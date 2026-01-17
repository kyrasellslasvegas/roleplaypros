import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSONCompletion } from "@/lib/ai/openai";
import {
  SESSION_ANALYSIS_SYSTEM_PROMPT,
  buildFeedbackAnalysisPrompt,
} from "@/lib/ai/prompts/feedback-analysis";
import type {
  TranscriptEntry,
  CoachSuggestion,
  SessionEndResponse,
  SessionFeedback,
  BuyerProfile,
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

    // Log transcript info for debugging
    console.log(`Session ${sessionId} ending with ${transcript?.length || 0} transcript entries`);

    // Fetch full session data for analysis
    const { data: fullSession } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    // Perform analysis directly (not via HTTP)
    let analysisStatus: "processing" | "completed" = "processing";

    try {
      // Run analysis with a 25-second timeout
      const feedback = await Promise.race([
        performAnalysis(
          transcript,
          fullSession?.buyer_profile as BuyerProfile | null,
          fullSession?.difficulty || "intermediate",
          durationMinutes || 30
        ),
        new Promise<SessionFeedback>((_, reject) =>
          setTimeout(() => reject(new Error("Analysis timeout")), 25000)
        )
      ]);

      // Calculate overall score from grades
      const gradeToScore: Record<string, number> = {
        "A+": 100, A: 95, "A-": 92,
        "B+": 88, B: 85, "B-": 82,
        "C+": 78, C: 75, "C-": 72,
        D: 65, F: 50,
      };
      const overallScore = gradeToScore[feedback.overallGrade] || 75;

      // Update session with feedback
      await supabase
        .from("training_sessions")
        .update({
          feedback,
          score: overallScore,
          analysis_status: "completed",
        })
        .eq("id", sessionId);

      // Update user progress
      await updateUserProgress(supabase, user.id, feedback, durationMinutes || 0);

      analysisStatus = "completed";
      console.log(`Session ${sessionId} analysis completed successfully`);
    } catch (analysisError) {
      console.error(`Analysis failed for session ${sessionId}:`, analysisError);

      // Save default feedback on error
      const defaultFeedback = getDefaultFeedback();
      await supabase
        .from("training_sessions")
        .update({
          feedback: defaultFeedback,
          score: 75,
          analysis_status: "completed",
        })
        .eq("id", sessionId);

      analysisStatus = "completed"; // Mark as completed with default feedback
    }

    const response: SessionEndResponse = {
      feedbackUrl: `/roleplay/review/${sessionId}`,
      analysisStatus,
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

// Default feedback for when analysis fails
function getDefaultFeedback(): SessionFeedback {
  return {
    overallGrade: "B",
    overallSummary: "Session completed. Detailed analysis was unable to process due to technical issues. Please review your transcript manually or try another session.",
    skillGrades: [
      { skill: "Building Rapport", grade: "B", notes: "Review your opening approach", trend: "stable" },
      { skill: "Discovery Questions", grade: "B", notes: "Continue asking deep questions", trend: "stable" },
      { skill: "Money Qualification", grade: "B", notes: "Practice budget conversations", trend: "stable" },
      { skill: "Objection Handling", grade: "B", notes: "Keep working on responses", trend: "stable" },
      { skill: "Frame Control", grade: "B", notes: "Maintain conversation leadership", trend: "stable" },
      { skill: "Closing Skills", grade: "B", notes: "Work on asking for commitment", trend: "stable" },
      { skill: "Compliance", grade: "A-", notes: "No major issues detected", trend: "stable" },
    ],
    strengths: ["Completed the roleplay session", "Engaged in conversation with the buyer"],
    areasForImprovement: ["Continue practicing to build confidence", "Review transcript for specific improvement areas"],
    complianceIssues: [],
    keyMoments: [],
    nextSessionFocus: "Focus on asking more discovery questions and practice closing techniques.",
  };
}

async function performAnalysis(
  transcript: TranscriptEntry[],
  buyerProfile: BuyerProfile | null,
  difficulty: string,
  durationMinutes: number
): Promise<SessionFeedback> {
  // If no/insufficient transcript, return default feedback
  if (!transcript || transcript.length < 2) {
    console.log("Insufficient transcript entries, returning default feedback");
    return getDefaultFeedback();
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
    difficulty,
    durationMinutes
  );

  console.log(`Starting AI analysis with ${transcript.length} transcript entries`);

  // Generate feedback analysis
  const feedback = await generateJSONCompletion<SessionFeedback>(
    [
      { role: "system", content: SESSION_ANALYSIS_SYSTEM_PROMPT },
      { role: "user", content: analysisPrompt },
    ],
    { model: "gpt-4o", temperature: 0.5, maxTokens: 2000 }
  );

  // Validate feedback structure
  if (!feedback.overallGrade || !feedback.skillGrades) {
    console.error("Invalid feedback structure, using default");
    return getDefaultFeedback();
  }

  return feedback;
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
    for (const sg of feedback.skillGrades || []) {
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
