import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSONCompletion } from "@/lib/ai/openai";
import {
  SESSION_ANALYSIS_SYSTEM_PROMPT,
  buildFeedbackAnalysisPrompt,
} from "@/lib/ai/prompts/feedback-analysis";
import type { SessionFeedback, BuyerProfile, TranscriptEntry } from "@/types/session";

interface AnalyzeRequest {
  sessionId: string;
}

export async function POST(request: Request) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch session data
    const { data: session, error: fetchError } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (fetchError || !session) {
      console.error("Session not found:", fetchError);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if already analyzed
    if (session.analysis_status === "completed") {
      return NextResponse.json({ feedback: session.feedback });
    }

    // Get transcript and profile
    const transcript = (session.transcript || []) as TranscriptEntry[];
    const buyerProfile = session.buyer_profile as BuyerProfile | null;

    if (!transcript.length) {
      // No transcript to analyze
      await supabase
        .from("training_sessions")
        .update({ analysis_status: "completed", feedback: null })
        .eq("id", sessionId);

      return NextResponse.json({ feedback: null });
    }

    // Build analysis prompt
    const analysisPrompt = buildFeedbackAnalysisPrompt(
      transcript.map((t) => ({
        speaker: t.speaker,
        content: t.content,
        timestamp: t.timestamp,
      })),
      {
        experienceLevel: buyerProfile?.experienceLevel || "first_time",
        emotionalState: buyerProfile?.emotionalState || "nervous",
        resistanceLevel: buyerProfile?.resistanceLevel || "medium",
      },
      session.difficulty,
      session.duration_minutes || 30
    );

    // Generate feedback analysis
    const feedback = await generateJSONCompletion<SessionFeedback>(
      [
        { role: "system", content: SESSION_ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: analysisPrompt },
      ],
      { model: "gpt-4o", temperature: 0.5, maxTokens: 2000 }
    );

    // Calculate overall score from grades
    const gradeToScore: Record<string, number> = {
      "A+": 100,
      A: 95,
      "A-": 92,
      "B+": 88,
      B: 85,
      "B-": 82,
      "C+": 78,
      C: 75,
      "C-": 72,
      D: 65,
      F: 50,
    };
    const overallScore = gradeToScore[feedback.overallGrade] || 75;

    // Update session with feedback
    const { error: updateError } = await supabase
      .from("training_sessions")
      .update({
        feedback,
        score: overallScore,
        analysis_status: "completed",
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Failed to save feedback:", updateError);
    }

    // Update user progress
    await updateUserProgress(supabase, session.user_id, feedback, session.duration_minutes || 0);

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Error analyzing session:", error);

    // Mark as failed
    const body: AnalyzeRequest = await request.json().catch(() => ({ sessionId: "" }));
    if (body.sessionId) {
      const supabase = await createClient();
      await supabase
        .from("training_sessions")
        .update({ analysis_status: "failed" })
        .eq("id", body.sessionId);
    }

    return NextResponse.json(
      { error: "Failed to analyze session" },
      { status: 500 }
    );
  }
}

async function updateUserProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  feedback: SessionFeedback,
  durationMinutes: number
): Promise<void> {
  try {
    // Get current progress
    const { data: progress } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .single();

    const today = new Date().toISOString().split("T")[0];
    const lastPracticeDate = progress?.last_practice_date?.split("T")[0];

    // Calculate streak
    let currentStreak = progress?.current_streak || 0;
    if (lastPracticeDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastPracticeDate === today) {
        // Already practiced today, no streak change
      } else if (lastPracticeDate === yesterdayStr) {
        // Practiced yesterday, increment streak
        currentStreak += 1;
      } else {
        // Streak broken, reset to 1
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    const longestStreak = Math.max(currentStreak, progress?.longest_streak || 0);

    // Build skill grades object
    const skillGrades: Record<string, { grade: string; trend: string }> = {};
    for (const sg of feedback.skillGrades) {
      skillGrades[sg.skill.toLowerCase().replace(/\s+/g, "_")] = {
        grade: sg.grade,
        trend: sg.trend || "stable",
      };
    }

    if (progress) {
      // Update existing progress
      await supabase
        .from("user_progress")
        .update({
          current_streak: currentStreak,
          longest_streak: longestStreak,
          total_sessions: (progress.total_sessions || 0) + 1,
          total_practice_minutes:
            (progress.total_practice_minutes || 0) + durationMinutes,
          skill_grades: skillGrades,
          last_practice_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    } else {
      // Create new progress record
      await supabase.from("user_progress").insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        total_sessions: 1,
        total_practice_minutes: durationMinutes,
        skill_grades: skillGrades,
        last_practice_date: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Failed to update user progress:", error);
  }
}
