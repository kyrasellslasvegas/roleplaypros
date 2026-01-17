import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import type { TTSVoice } from "@/types/avatar";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TTSRequestBody {
  text: string;
  voice?: TTSVoice;
  speed?: number;
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

    const body: TTSRequestBody = await request.json();
    const { text, voice = "nova", speed = 1.0 } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    // Validate text length (OpenAI TTS has a 4096 character limit)
    if (text.length > 4096) {
      return NextResponse.json(
        { error: "Text too long. Maximum length is 4096 characters." },
        { status: 400 }
      );
    }

    // Validate voice
    const validVoices: TTSVoice[] = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
    if (!validVoices.includes(voice)) {
      return NextResponse.json(
        { error: `Invalid voice. Must be one of: ${validVoices.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate speed (0.25 to 4.0)
    const clampedSpeed = Math.max(0.25, Math.min(4.0, speed));

    // Generate speech using OpenAI TTS
    const mp3Response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: text,
      speed: clampedSpeed,
      response_format: "mp3",
    });

    // Get the audio buffer
    const buffer = Buffer.from(await mp3Response.arrayBuffer());

    // Return audio as streaming response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("TTS generation error:", error);

    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: "OpenAI API key is invalid" },
          { status: 401 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "TTS generation failed" },
      { status: 500 }
    );
  }
}
