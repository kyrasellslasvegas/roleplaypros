import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStreamingToken } from "@/lib/ai/heygen";

export async function POST() {
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

    // Generate HeyGen streaming token
    const token = await generateStreamingToken();

    // Token is valid for approximately 10 minutes
    const expiresAt = Date.now() + 10 * 60 * 1000;

    return NextResponse.json({
      token,
      expiresAt,
    });
  } catch (error) {
    console.error("Error generating HeyGen token:", error);
    return NextResponse.json(
      { error: "Failed to generate streaming token" },
      { status: 500 }
    );
  }
}
