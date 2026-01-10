import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStreamingToken } from "@/lib/ai/heygen";
import { generateBuyerSystemPrompt } from "@/lib/ai/prompts/buyer-personas";
import type { SessionConfig, SessionStartResponse } from "@/types/session";

interface StartSessionRequest {
  config: SessionConfig;
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

    const body: StartSessionRequest = await request.json();
    const { config } = body;

    // Validate config
    if (!config || !config.buyerProfile || !config.difficulty) {
      return NextResponse.json(
        { error: "Invalid session configuration" },
        { status: 400 }
      );
    }

    // Ensure user profile exists (handles users who signed up before magic link)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existingProfile) {
      // Create profile if it doesn't exist
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        subscription_tier: "free",
      });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        return NextResponse.json(
          { error: "Failed to create user profile" },
          { status: 500 }
        );
      }

      // Also create user_progress record
      await supabase.from("user_progress").insert({
        user_id: user.id,
        current_streak: 0,
        longest_streak: 0,
        total_sessions: 0,
        total_practice_minutes: 0,
        skill_grades: {},
      });
    }

    // Create training session record in database
    const { data: session, error: dbError } = await supabase
      .from("training_sessions")
      .insert({
        user_id: user.id,
        session_type: "roleplay",
        difficulty: config.difficulty,
        duration_minutes: config.durationMinutes,
        buyer_profile: config.buyerProfile,
        transcript: [],
        coach_suggestions: [],
        session_phases: ["rapport"],
        analysis_status: "pending",
      })
      .select()
      .single();

    if (dbError || !session) {
      console.error("Database error creating session:", dbError);
      return NextResponse.json(
        { error: `Failed to create session: ${dbError?.message || "Unknown database error"}` },
        { status: 500 }
      );
    }

    // Generate HeyGen streaming token
    let heygenToken: string;
    try {
      heygenToken = await generateStreamingToken();
    } catch (heygenError) {
      console.error("HeyGen token error:", heygenError);
      // Return a more specific error for HeyGen issues
      return NextResponse.json(
        { error: `HeyGen service error: ${heygenError instanceof Error ? heygenError.message : "Failed to connect to avatar service"}` },
        { status: 503 }
      );
    }

    // Generate the buyer system prompt
    const buyerSystemPrompt = generateBuyerSystemPrompt(config.buyerProfile);

    const response: SessionStartResponse = {
      sessionId: session.id,
      heygenToken,
      buyerSystemPrompt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error starting session:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start session" },
      { status: 500 }
    );
  }
}
