import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import openai from "@/lib/ai/openai";
import type { DailyObjection } from "@/types/gamification";

interface TranscriptEntry {
  role: "user" | "buyer";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      sessionId,
      userMessage,
      conversationHistory,
      objection,
      exchangeCount,
    } = (await request.json()) as {
      sessionId: string;
      userMessage: string;
      conversationHistory: TranscriptEntry[];
      objection: DailyObjection;
      exchangeCount: number;
    };

    if (!userMessage || !objection) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Build conversation context
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: buildBuyerSystemPrompt(objection, exchangeCount),
      },
    ];

    // Add conversation history
    for (const entry of conversationHistory) {
      messages.push({
        role: entry.role === "buyer" ? "assistant" : "user",
        content: entry.content,
      });
    }

    // Add current user message
    messages.push({
      role: "user",
      content: userMessage,
    });

    // Generate buyer response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.8,
      max_tokens: 150,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(responseContent) as {
      response: string;
      emotion: string;
      isConvinced: boolean;
      shouldEnd: boolean;
    };

    return NextResponse.json({
      response: parsed.response,
      emotion: parsed.emotion || "neutral",
      isConvinced: parsed.isConvinced || false,
      shouldEnd: parsed.shouldEnd || exchangeCount >= 4,
    });
  } catch (error) {
    console.error("Error in drill respond:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}

function buildBuyerSystemPrompt(
  objection: DailyObjection,
  exchangeCount: number
): string {
  const isEarlyStage = exchangeCount < 2;
  const isMidStage = exchangeCount >= 2 && exchangeCount < 4;
  const isLateStage = exchangeCount >= 4;

  return `You are a realistic buyer in a sales training drill. You initially raised this objection:
"${objection.objectionText}"

Context: ${objection.context || "Standard sales conversation"}
Difficulty: ${objection.difficulty}

Your job is to respond naturally to the salesperson's objection handling attempt.

BEHAVIOR GUIDELINES:
${
  isEarlyStage
    ? `- Stay firm on your objection initially
- Ask follow-up questions to test their understanding
- Show skepticism but remain open to good arguments`
    : isMidStage
    ? `- If they make valid points, soften slightly
- Raise secondary concerns to test depth
- React to emotional intelligence and active listening`
    : `- Make a decision based on how well they've handled the conversation
- Either show you're convinced or explain why you're still hesitant
- Be realistic about whether their handling was effective`
}

DIFFICULTY ADJUSTMENTS (${objection.difficulty}):
${
  objection.difficulty === "beginner"
    ? "- Be more easily convinced by reasonable arguments\n- Don't push back too hard on minor issues"
    : objection.difficulty === "intermediate"
    ? "- Require solid logic and empathy to be convinced\n- Push back on weak arguments"
    : "- Be a tough customer who needs excellent handling\n- Test for sophisticated sales techniques\n- Only be convinced by truly exceptional responses"
}

RESPONSE FORMAT (JSON):
{
  "response": "Your natural conversational response (1-2 sentences)",
  "emotion": "skeptical|neutral|interested|convinced|frustrated",
  "isConvinced": false,
  "shouldEnd": false
}

Set shouldEnd to true if:
- The conversation has reached a natural conclusion
- You've been fully convinced
- The exchange count is high (${exchangeCount}/5)

Keep responses concise and conversational - this is a quick 5-minute drill.`;
}
