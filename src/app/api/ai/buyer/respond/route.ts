import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateChatCompletion } from "@/lib/ai/openai";
import {
  generateBuyerSystemPrompt,
  getPhaseGuidance,
  shouldBuyerInterrupt,
  type InterruptionContext,
} from "@/lib/ai/prompts/buyer-personas";
import type { BuyerRespondRequest, BuyerRespondResponse, SessionPhase } from "@/types/session";
import type { OpenAIMessage } from "@/types/ai";

interface ExtendedBuyerRespondRequest extends BuyerRespondRequest {
  agentSpeakingDuration?: number;
  silenceDuration?: number;
  checkInterruption?: boolean;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ExtendedBuyerRespondRequest = await request.json();
    const {
      userMessage,
      conversationHistory,
      buyerProfile,
      currentPhase,
      agentSpeakingDuration = 0,
      silenceDuration = 0,
      checkInterruption = false,
      difficulty = "intermediate",
    } = body;

    // Validate buyerProfile exists
    if (!buyerProfile || !buyerProfile.personality) {
      return NextResponse.json(
        { error: "Invalid buyer profile configuration" },
        { status: 400 }
      );
    }

    // Check if buyer should interrupt based on agent behavior
    if (checkInterruption) {
      const lastBuyerMessage = conversationHistory
        .filter((m) => m.speaker === "ai_buyer")
        .pop();
      const lastAgentMessage = conversationHistory
        .filter((m) => m.speaker === "user")
        .pop();

      // Check if agent ignored buyer's question
      const buyerAskedQuestion = lastBuyerMessage?.content?.includes("?") || false;
      const agentAddressedQuestion = lastAgentMessage?.content
        ? addressesQuestion(lastBuyerMessage?.content || "", lastAgentMessage.content)
        : true;

      // Count repetitions
      const repetitionCount = countRepetitions(conversationHistory);

      const interruptionContext: InterruptionContext = {
        agentSpeakingDuration,
        silenceDuration,
        repetitionCount,
        buyerQuestionIgnored: buyerAskedQuestion && !agentAddressedQuestion,
        personality: buyerProfile.personality,
        resistanceLevel: buyerProfile.resistanceLevel,
      };

      const interruptionResult = shouldBuyerInterrupt(interruptionContext);

      if (interruptionResult.shouldInterrupt) {
        // Return interruption as the buyer response
        const result: BuyerRespondResponse = {
          response: interruptionResult.interruptionPhrase || "Hold on, let me stop you there.",
          emotion: getInterruptionEmotion(buyerProfile.personality),
          isInterruption: true,
          interruptionReason: interruptionResult.reason,
        };

        return NextResponse.json(result);
      }
    }

    // Build the system prompt with difficulty
    const systemPrompt = generateBuyerSystemPrompt(buyerProfile, difficulty);
    const phaseGuidance = getPhaseGuidance(currentPhase);

    // Special handling for session start - buyer initiates conversation
    const isSessionStart = userMessage === "[SESSION_START]";

    // Build conversation messages for OpenAI
    const messages: OpenAIMessage[] = [
      {
        role: "system",
        content: `${systemPrompt}\n\n## CURRENT PHASE GUIDANCE\n${phaseGuidance}`,
      },
    ];

    // Add conversation history (skip if session start)
    if (!isSessionStart) {
      for (const entry of conversationHistory.slice(-10)) {
        messages.push({
          role: entry.speaker === "user" ? "user" : "assistant",
          content: entry.content,
        });
      }
    }

    // Add the current user message
    messages.push({
      role: "user",
      content: isSessionStart
        ? "[SESSION_START] - You are the buyer initiating the conversation. Give a natural opening greeting based on your personality."
        : userMessage,
    });

    // Generate buyer response
    let response: string;
    try {
      response = await generateChatCompletion(messages, {
        model: "gpt-4o",
        temperature: 0.8,
        maxTokens: 300,
      });
    } catch (error) {
      // Handle OpenAI quota/rate limit errors gracefully
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate")) {
        console.warn("OpenAI quota exceeded, using fallback response");
        response = getFallbackBuyerResponse(buyerProfile.personality, isSessionStart, userMessage);
      } else {
        throw error;
      }
    }

    // Determine emotion based on content analysis
    const emotion = analyzeResponseEmotion(response, buyerProfile.personality);

    // Check if phase should advance
    const phaseAdvancement = checkPhaseAdvancement(
      currentPhase,
      conversationHistory.length,
      response
    );

    const result: BuyerRespondResponse = {
      response,
      emotion,
      shouldAdvancePhase: phaseAdvancement.shouldAdvance,
      nextPhase: phaseAdvancement.nextPhase,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating buyer response:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}

function analyzeResponseEmotion(
  response: string,
  personality: string
): BuyerRespondResponse["emotion"] {
  const lowerResponse = response.toLowerCase();

  // Check for frustration indicators
  if (
    lowerResponse.includes("i don't") ||
    lowerResponse.includes("that's not") ||
    lowerResponse.includes("frustrated") ||
    lowerResponse.includes("already said")
  ) {
    return "frustrated";
  }

  // Check for skepticism
  if (
    lowerResponse.includes("are you sure") ||
    lowerResponse.includes("i'm not convinced") ||
    lowerResponse.includes("how do i know") ||
    lowerResponse.includes("prove")
  ) {
    return "skeptical";
  }

  // Check for concern
  if (
    lowerResponse.includes("worried") ||
    lowerResponse.includes("concerned") ||
    lowerResponse.includes("nervous") ||
    lowerResponse.includes("scary")
  ) {
    return "concerned";
  }

  // Check for positive emotions
  if (
    lowerResponse.includes("great") ||
    lowerResponse.includes("perfect") ||
    lowerResponse.includes("love") ||
    lowerResponse.includes("excited") ||
    lowerResponse.includes("sounds good")
  ) {
    return "happy";
  }

  // Default based on personality
  if (personality === "nervous") return "concerned";
  if (personality === "skeptical") return "skeptical";

  return "neutral";
}

function getInterruptionEmotion(
  personality: string
): BuyerRespondResponse["emotion"] {
  switch (personality) {
    case "friendly":
      return "neutral";
    case "dominant":
      return "frustrated";
    case "nervous":
      return "concerned";
    case "skeptical":
      return "skeptical";
    case "distracted":
      return "neutral";
    case "cautious":
      return "concerned";
    default:
      return "neutral";
  }
}

// Check if agent's response addresses the buyer's question
function addressesQuestion(buyerQuestion: string, agentResponse: string): boolean {
  // Simple keyword matching for now
  const questionWords = buyerQuestion
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);

  const responseWords = agentResponse.toLowerCase();

  // Check if at least some question keywords appear in response
  const matchCount = questionWords.filter((w) => responseWords.includes(w)).length;
  return matchCount >= Math.min(2, questionWords.length);
}

// Count how many times agent repeated similar content
function countRepetitions(conversationHistory: Array<{ speaker: string; content: string }>): number {
  const agentMessages = conversationHistory
    .filter((m) => m.speaker === "user")
    .map((m) => m.content.toLowerCase())
    .slice(-5);

  if (agentMessages.length < 2) return 0;

  // Check for similar phrases
  let repetitions = 0;
  const lastMessage = agentMessages[agentMessages.length - 1];

  for (let i = 0; i < agentMessages.length - 1; i++) {
    const similarity = calculateSimilarity(lastMessage, agentMessages[i]);
    if (similarity > 0.6) {
      repetitions++;
    }
  }

  return repetitions;
}

// Simple similarity check (Jaccard-like)
function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\W+/).filter((w) => w.length > 3));
  const wordsB = new Set(b.split(/\W+/).filter((w) => w.length > 3));

  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;

  return union === 0 ? 0 : intersection / union;
}

// Check if conversation should advance to next phase
function checkPhaseAdvancement(
  currentPhase: SessionPhase,
  messageCount: number,
  lastResponse: string
): { shouldAdvance: boolean; nextPhase?: SessionPhase } {
  const phaseOrder: SessionPhase[] = [
    "rapport",
    "money_questions",
    "deep_questions",
    "frame",
    "close",
  ];

  const currentIndex = phaseOrder.indexOf(currentPhase);
  if (currentIndex === phaseOrder.length - 1) {
    return { shouldAdvance: false };
  }

  // Minimum messages before phase can advance
  const minMessages = 4;
  if (messageCount < minMessages) {
    return { shouldAdvance: false };
  }

  // Check for phase completion indicators
  const completionPhrases: Record<SessionPhase, string[]> = {
    rapport: ["nice to meet", "looking forward", "good to connect", "excited to"],
    money_questions: ["budget", "pre-approved", "afford", "down payment", "monthly"],
    deep_questions: ["understand", "makes sense", "that helps", "clear picture"],
    frame: ["sounds good", "like how you work", "comfortable with", "ready to"],
    close: [],
  };

  const phrases = completionPhrases[currentPhase] || [];
  const responseLower = lastResponse.toLowerCase();
  const hasCompletionPhrase = phrases.some((p) => responseLower.includes(p));

  if (hasCompletionPhrase && messageCount >= minMessages) {
    return {
      shouldAdvance: true,
      nextPhase: phaseOrder[currentIndex + 1],
    };
  }

  return { shouldAdvance: false };
}

// Fallback responses when OpenAI is unavailable
function getFallbackBuyerResponse(
  personality: string,
  isSessionStart: boolean,
  userMessage: string
): string {
  // Session start greetings by personality
  if (isSessionStart) {
    const greetings: Record<string, string[]> = {
      friendly: [
        "Hi! I heard good things about you and I'm looking to buy my first home.",
        "Hey there! Thanks for taking the time to meet with me. I'm excited to start looking for a home.",
      ],
      cautious: [
        "Hello. I'm interested in buying a home and wanted to ask you some questions first.",
        "Hi. I've been researching the market and thought I should talk to an agent.",
      ],
      dominant: [
        "Let's cut to it - I'm looking for a home and I want to know why I should work with you.",
        "I'm interviewing a few agents. Tell me what makes you different.",
      ],
      distracted: [
        "Hey, sorry I only have a few minutes but I wanted to talk about finding a place.",
        "Hi - hold on one sec - okay, I'm here. So I need to find a house.",
      ],
      nervous: [
        "Hi... um, I'm not really sure how this works but I'm thinking about buying a home?",
        "Hello. This is my first time doing this and I'm a little nervous honestly.",
      ],
      skeptical: [
        "I'm calling around to interview agents. Tell me why you're different from everyone else.",
        "So I've heard a lot about agents just trying to close deals. How do I know you're different?",
      ],
    };
    const options = greetings[personality] || greetings.cautious;
    return options[Math.floor(Math.random() * options.length)];
  }

  // Generic responses based on personality
  const responses: Record<string, string[]> = {
    friendly: [
      "That's interesting! Can you tell me more about that?",
      "I appreciate you explaining that. What else should I know?",
      "Oh nice! So what would be the next step?",
    ],
    cautious: [
      "I see. And how would that work exactly?",
      "Interesting. Can you give me more details on that?",
      "I'd like to understand that better before we move on.",
    ],
    dominant: [
      "Get to the point. What's the bottom line here?",
      "I need specifics, not generalities. What exactly are we looking at?",
      "Okay, but what does that mean for me specifically?",
    ],
    distracted: [
      "Sorry, what was that? I got distracted for a second.",
      "Right, right. So what's the main thing I need to focus on?",
      "Can you give me the quick version?",
    ],
    nervous: [
      "That makes sense... I think. Is that normal?",
      "Okay... that's a lot to process. What if something goes wrong?",
      "I'm still worried about making a mistake here.",
    ],
    skeptical: [
      "Everyone says that. Can you prove it?",
      "How do I know that's actually true?",
      "I've heard that before from other agents.",
    ],
  };

  const options = responses[personality] || responses.cautious;
  return options[Math.floor(Math.random() * options.length)];
}
