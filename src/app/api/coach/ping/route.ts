import { NextResponse } from "next/server";
import OpenAI from "openai";
import { COACH_SYSTEM } from "@/lib/prompts/templates";

export const runtime = "nodejs";

type PingBody = {
  transcriptTail: string;   // last chunk of conversation (recent lines)
  difficulty: "beginner" | "intermediate" | "advanced";
};

export async function POST(req: Request) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const body = (await req.json()) as PingBody;

  const transcriptTail = (body.transcriptTail || "").slice(0, 6000);

  const prompt = `
Recent transcript (most recent last):
\

Task:
- If agent made a mistake that should be corrected before continuing, set requireFix=true.
- Provide: correction (1-2 sentences), retryPrompt (what agent should say next, 1-3 short lines), and one short reason.
- If no immediate correction needed, requireFix=false and give 1 short improvement note.

Return STRICT JSON:
{
  "requireFix": boolean,
  "correction": string,
  "retryPrompt": string,
  "reason": string
}
`;

  const resp = await client.responses.create({
    model: "gpt-4.1-mini",
    instructions: COACH_SYSTEM,
    input: prompt,
  });

  // Responses API returns output_text; we enforce JSON by parsing carefully
  const text = resp.output_text?.trim() || "";
  try {
    const json = JSON.parse(text);
    return NextResponse.json(json);
  } catch {
    // fallback if model returns extra text
    return NextResponse.json({
      requireFix: false,
      correction: "",
      retryPrompt: "",
      reason: "Coach ping parsed fallback."
    });
  }
}
