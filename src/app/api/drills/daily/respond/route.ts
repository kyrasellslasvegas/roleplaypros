import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
// Update the import path below if the file exists elsewhere, for example:
import { buildDrillBuyerPrompt } from "@/lib/prompts/drillBuyerPrompt";


async function safeJson(req: Request) {
  try {
    const txt = await req.text();
    if (!txt) return null;
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await safeJson(request);
    const sessionId = body?.sessionId ?? body?.session_id ?? null;
    const agentText = body?.agentText ?? body?.text ?? body?.message ?? null;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId (string) is required" }, { status: 400 });
    }
    if (!agentText || typeof agentText !== "string" || agentText.trim().length === 0) {
      return NextResponse.json({ error: "agentText (string) is required" }, { status: 400 });
    }

    const { data: session, error: sessionErr } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionErr || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const { data: objection, error: objErr } = await supabase
      .from("daily_objections")
      .select("*")
      .eq("drill_session_id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (objErr || !objection) {
      return NextResponse.json({ error: "Linked objection not found" }, { status: 404 });
    }

    const transcript: any[] = Array.isArray(session.transcript) ? session.transcript : [];

    const nextTranscript = [
      ...transcript,
      { role: "agent", text: agentText.trim(), ts: new Date().toISOString() },
    ];

    const buyerSystemPrompt = buildDrillBuyerPrompt(objection);
    const buyerText = await generateBuyerReply({
      systemPrompt: buyerSystemPrompt,
      transcript: nextTranscript,
    });

    const finalTranscript = [
      ...nextTranscript,
      { role: "buyer", text: buyerText, ts: new Date().toISOString() },
    ];

    await supabase
      .from("training_sessions")
      .update({ transcript: finalTranscript })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    return NextResponse.json({
      sessionId,
      buyerText,
      transcript: finalTranscript,
      objectionId: objection.id,
    });
  } catch (e) {
    console.error("Error in /api/drills/daily/respond:", e);
    return NextResponse.json({ error: "Failed to generate buyer response" }, { status: 500 });
  }
}

async function generateBuyerReply(opts: {
  systemPrompt: string;
  transcript: Array<{ role: string; text: string }>;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return "Can you explain that a little more?";

  const messages = [
    { role: "system", content: opts.systemPrompt },
    ...opts.transcript.map((t) => ({
      role: t.role === "agent" ? "user" : "assistant",
      content: t.text,
    })),
    { role: "system", content: "Reply ONLY as the buyer. No coaching. No AI mention. Keep it short." },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 180,
    }),
  });

  if (!res.ok) {
    const raw = await res.text();
    console.error("OpenAI error:", res.status, raw);
    return "I hear you… but I’m still not sure. What does that mean for me in real life?";
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || "Okay… can you break that down more?";
}
