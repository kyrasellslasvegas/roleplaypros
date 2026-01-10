import type { SessionPhase, BuyerProfile, TranscriptEntry } from "@/types/session";

// Phase-specific base scripts for 6th grade reading level
export const phaseScripts: Record<SessionPhase, {
  title: string;
  goal: string;
  openers: string[];
  questions: string[];
  transitions: string[];
  tips: string[];
}> = {
  rapport: {
    title: "Building Rapport",
    goal: "Make the buyer feel comfortable and build trust",
    openers: [
      "Hi! Thanks for meeting with me today. How are you doing?",
      "It's great to connect with you. How has your day been so far?",
      "Thanks for taking the time to chat. I'd love to get to know you better.",
    ],
    questions: [
      "So what brings you to Las Vegas? Have you lived here long?",
      "Tell me a little about yourself. What do you do for work?",
      "How did you hear about me? What made you reach out?",
      "Is anyone helping you with this home search?",
    ],
    transitions: [
      "That's great to hear. So let me ask you about what you're looking for...",
      "I appreciate you sharing that. Now, can we talk about your home search?",
      "Thanks for telling me that. I'd love to learn more about your goals.",
    ],
    tips: [
      "Find something in common with the buyer",
      "Listen more than you talk",
      "Remember their name and use it",
      "Be warm but not fake",
    ],
  },
  money_questions: {
    title: "Questions About Money",
    goal: "Understand their budget and financial readiness",
    openers: [
      "Let's talk about the money side of things...",
      "I want to make sure we're looking at the right homes for you...",
      "To help you best, I need to understand your budget...",
    ],
    questions: [
      "Have you talked to a lender yet? Are you pre-approved?",
      "What price range are you comfortable with?",
      "How much do you have saved for a down payment?",
      "Are you looking at any special loan programs, like FHA or VA?",
      "What monthly payment would work for your budget?",
    ],
    transitions: [
      "That's helpful. Now let me understand why you want to buy...",
      "Great, I have a good sense of your budget. Let's talk about your goals...",
      "Thanks for being open about that. Now I want to learn about your priorities...",
    ],
    tips: [
      "Make them feel safe discussing money",
      "Don't judge their budget",
      "Explain why you're asking",
      "Offer to connect them with a lender",
    ],
  },
  deep_questions: {
    title: "Deep Questions",
    goal: "Understand their real motivations and priorities",
    openers: [
      "Help me understand what's driving this decision...",
      "I want to really understand what matters most to you...",
      "Let's get to the heart of what you're looking for...",
    ],
    questions: [
      "Why is now the right time for you to buy?",
      "What would your perfect home look like?",
      "What are the top 3 things you must have in a home?",
      "What would you never want in a home?",
      "How will buying a home change your life?",
      "If you don't buy, what happens? What will you do?",
      "What's holding you back from buying right now?",
    ],
    transitions: [
      "I really understand what you need now. Let me tell you how I can help...",
      "Thanks for sharing that. I know exactly what we're looking for now...",
      "That's so helpful. Let me explain how I work and what I'll do for you...",
    ],
    tips: [
      "Ask 'why' to go deeper",
      "Listen for emotions, not just facts",
      "Take notes on what matters most",
      "Connect their home to their life goals",
    ],
  },
  frame: {
    title: "Setting the Frame",
    goal: "Establish your value and how you work",
    openers: [
      "Let me tell you what to expect working with me...",
      "Here's how I'll help you find the right home...",
      "I want to set clear expectations about our process...",
    ],
    questions: [
      "Have you worked with a real estate agent before?",
      "What did you like or not like about that experience?",
      "What's most important to you in working with an agent?",
    ],
    transitions: [
      "Now that you know how I work, let's talk about next steps...",
      "Are you ready to start looking at homes?",
      "I'm excited to help you find your home. What questions do you have?",
    ],
    tips: [
      "Explain your value clearly",
      "Tell them what to expect",
      "Be confident but not pushy",
      "Ask if they have concerns",
    ],
  },
  close: {
    title: "Closing",
    goal: "Get commitment for next steps",
    openers: [
      "I'd love to start working together...",
      "Are you ready to take the next step?",
      "Let's set up a plan to find your home...",
    ],
    questions: [
      "When are you available to see some homes?",
      "Can I add you to my search alerts?",
      "Would you like me to send you some listings to review?",
      "What day works best for us to start looking?",
    ],
    transitions: [
      "Great! I'll send you those listings tonight.",
      "Perfect. I'll set up showings for this weekend.",
      "I'm looking forward to helping you find your home.",
    ],
    tips: [
      "Ask for a specific action",
      "Overcome objections calmly",
      "Don't be afraid to ask",
      "Confirm next steps clearly",
    ],
  },
};

// Generate dynamic teleprompter suggestion based on conversation context
export function generateTeleprompterSystemPrompt(
  phase: SessionPhase,
  buyerProfile: BuyerProfile,
  transcript: TranscriptEntry[]
): string {
  const script = phaseScripts[phase];
  const recentMessages = transcript.slice(-6);

  return `You are a real-time sales coaching teleprompter for a real estate agent in training. Your job is to suggest what the agent should say next, in simple 6th grade reading level language.

## CURRENT PHASE: ${script.title}
Goal: ${script.goal}

## BUYER PROFILE
- Personality: ${buyerProfile.personality}
- Experience: ${buyerProfile.experienceLevel.replace("_", " ")}
- Financial comfort: ${buyerProfile.financialComfort}
- Resistance: ${buyerProfile.resistanceLevel}

## RECENT CONVERSATION
${recentMessages.length > 0
  ? recentMessages.map(m => `${m.speaker === "user" ? "AGENT" : "BUYER"}: ${m.content}`).join("\n")
  : "Conversation just started."}

## YOUR TASK
Generate 3 short, natural-sounding suggestions for what the agent should say next. Each suggestion should:
1. Be 1-2 sentences maximum
2. Use simple, everyday words (6th grade level)
3. Feel natural and conversational
4. Match the current phase goal
5. Be appropriate for this buyer's personality

## IMPORTANT RULES
- Never suggest anything that could be a compliance violation
- Don't promise home values will go up
- Don't make claims about guaranteed returns
- Do encourage disclosure of agency relationship
- Do encourage asking permission before personal questions

## RESPONSE FORMAT
Respond with a JSON object:
{
  "suggestions": [
    {"type": "question", "text": "suggestion 1"},
    {"type": "response", "text": "suggestion 2"},
    {"type": "transition", "text": "suggestion 3"}
  ],
  "phaseProgress": "early" | "middle" | "ready_to_advance",
  "buyerMood": "positive" | "neutral" | "resistant"
}`;
}

// Detect if phase should advance based on conversation
export function detectPhaseProgress(
  phase: SessionPhase,
  transcript: TranscriptEntry[]
): { shouldAdvance: boolean; confidence: number; nextPhase: SessionPhase | null } {
  const recentMessages = transcript.slice(-10);
  const messageCount = recentMessages.length;

  // Simple heuristics for phase advancement
  const phaseOrder: SessionPhase[] = ["rapport", "money_questions", "deep_questions", "frame", "close"];
  const currentIndex = phaseOrder.indexOf(phase);

  if (currentIndex === phaseOrder.length - 1) {
    return { shouldAdvance: false, confidence: 0, nextPhase: null };
  }

  // Check for phase-specific keywords that indicate completion
  const lastMessages = recentMessages.map(m => m.content.toLowerCase()).join(" ");

  const completionIndicators: Record<SessionPhase, string[]> = {
    rapport: ["nice to meet", "good to connect", "thanks for", "appreciate", "looking forward"],
    money_questions: ["budget", "pre-approved", "afford", "down payment", "monthly payment"],
    deep_questions: ["must have", "need", "want", "important", "dream", "perfect home"],
    frame: ["how you work", "your process", "what you do", "experience", "clients"],
    close: ["next steps", "schedule", "showings", "start looking"],
  };

  const indicators = completionIndicators[phase] || [];
  const indicatorMatches = indicators.filter(i => lastMessages.includes(i)).length;

  // Advance if enough messages AND indicators present
  const shouldAdvance = messageCount >= 4 && indicatorMatches >= 2;
  const confidence = Math.min(1, (messageCount / 8) * (indicatorMatches / 2));

  return {
    shouldAdvance,
    confidence,
    nextPhase: shouldAdvance ? phaseOrder[currentIndex + 1] : null,
  };
}

// Get phase-appropriate tips for the teleprompter
export function getPhaseTips(phase: SessionPhase): string[] {
  return phaseScripts[phase]?.tips || [];
}

// Get sample openers for a phase
export function getPhaseOpeners(phase: SessionPhase): string[] {
  return phaseScripts[phase]?.openers || [];
}
