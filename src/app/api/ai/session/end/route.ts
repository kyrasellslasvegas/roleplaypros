import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  TranscriptEntry,
  CoachSuggestion,
  SessionEndResponse,
} from "@/types/session";

interface EndSessionRequest {
  sessionId: string;
  transcript: TranscriptEntry[];
  coachSuggestions?: CoachSuggestion[];
  actualDurationSeconds?: number;
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

    const body: EndSessionRequest = await request.json();
    const { sessionId, transcript, coachSuggestions, actualDurationSeconds } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    // Verify user owns this session
    const { data: existingSession, error: fetchError } = await supabase
      .from("training_sessions")
      .select("user_id")
      .eq("id", sessionId)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (existingSession.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Calculate actual duration in minutes
    const durationMinutes = actualDurationSeconds
      ? Math.ceil(actualDurationSeconds / 60)
      : null;

    // Update session with final data
    const { error: updateError } = await supabase
      .from("training_sessions")
      .update({
        transcript,
        coach_suggestions: coachSuggestions || [],
        duration_minutes: durationMinutes,
        ended_at: new Date().toISOString(),
        analysis_status: "processing",
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Database error ending session:", updateError);
      return NextResponse.json(
        { error: "Failed to save session" },
        { status: 500 }
      );
    }

    // Trigger async feedback analysis (in production, this would be a background job)
    // For now, we'll handle it in the analyze endpoint
    triggerFeedbackAnalysis(sessionId).catch(console.error);

    const response: SessionEndResponse = {
      feedbackUrl: `/roleplay/review/${sessionId}`,
      analysisStatus: "processing",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.json(
      { error: "Failed to end session" },
      { status: 500 }
    );
  }
}

async function triggerFeedbackAnalysis(sessionId: string): Promise<void> {
  // In production, this would queue a background job
  // For now, we call the analyze endpoint internally
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await fetch(`${baseUrl}/api/ai/coach/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
    });
  } catch (error) {
    console.error("Failed to trigger feedback analysis:", error);
  }
}
