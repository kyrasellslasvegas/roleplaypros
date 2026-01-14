import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const offerSdp = await req.text();
    if (!offerSdp?.includes("v=0")) {
      return NextResponse.json(
        { error: "Expected SDP offer in request body (application/sdp)." },
        { status: 400 }
      );
    }

    // Keep minimal until connected
    const session = {
      type: "realtime",
      model: "gpt-4o-realtime-preview",
      audio: { output: { voice: "alloy" } },
    };

    const fd = new FormData();
    fd.append("sdp", offerSdp); // ✅ THIS fixes your error
    fd.append("session", JSON.stringify(session));

    const r = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: fd,
    });

    const text = await r.text();

    if (!r.ok) {
      return NextResponse.json(
        { error: "OpenAI realtime/calls failed", status: r.status, details: text },
        { status: 500 }
      );
    }

    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": "application/sdp" },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Relay crashed", details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
