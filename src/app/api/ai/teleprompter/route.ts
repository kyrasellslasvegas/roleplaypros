import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSONCompletion } from "@/lib/ai/openai";
import { generateTeleprompterSystemPrompt } from "@/lib/ai/prompts/teleprompter-prompts";
import type { SessionPhase, BuyerProfile, TranscriptEntry } from "@/types/session";

interface TeleprompterRequest {
  phase: SessionPhase;
  buyerProfile: BuyerProfile;
  transcript: TranscriptEntry[];
}

interface TeleprompterSuggestion {
  type: "question" | "response" | "transition" | "opener";
  text: string;
}

interface TeleprompterResponse {
  suggestions: TeleprompterSuggestion[];
  phaseProgress: "early" | "middle" | "ready_to_advance";
  buyerMood: "positive" | "neutral" | "resistant";
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

    const body: TeleprompterRequest = await request.json();
    const { phase, buyerProfile, transcript } = body;

    // Generate the system prompt for teleprompter
    const systemPrompt = generateTeleprompterSystemPrompt(
      phase,
      buyerProfile,
      transcript
    );

    // Get AI-generated suggestions
    const response = await generateJSONCompletion<TeleprompterResponse>(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate teleprompter suggestions for the agent." },
      ],
      {
        model: "gpt-4o",
        temperature: 0.7,
        maxTokens: 500,
      }
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating teleprompter suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
