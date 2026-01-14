import { NextResponse } from "next/server";

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY!;
  const model = process.env.OPENAI_REALTIME_MODEL || "gpt-4o-realtime-preview";

  const res = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return NextResponse.json({ error: errText }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ ephemeral: data });
}
