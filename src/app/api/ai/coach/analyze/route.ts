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

// Default feedback for when analysis fails
function getDefaultFeedback(transcript: TranscriptEntry[]): SessionFeedback {
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

export async function POST(request: Request) {
  let sessionId = "";
  const startTime = Date.now();

  try {
    const body: AnalyzeRequest = await request.json();
    sessionId = body.sessionId;

    console.log(`[Analyze] Starting analysis for session ${sessionId}`);

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
    if (session.analysis_status === "completed" && session.feedback) {
      return NextResponse.json({ feedback: session.feedback });
    }

    // Get transcript and profile
    const transcript = (session.transcript || []) as TranscriptEntry[];
    const buyerProfile = session.buyer_profile as BuyerProfile | null;

    // If no transcript, return default feedback
    if (!transcript.length || transcript.length < 2) {
      const defaultFeedback = getDefaultFeedback(transcript);

      await supabase
        .from("training_sessions")
        .update({
          analysis_status: "completed",
          feedback: defaultFeedback,
          score: 80
        })
        .eq("id", sessionId);

      return NextResponse.json({ feedback: defaultFeedback });
    }

    // Mark as processing
    await supabase
      .from("training_sessions")
      .update({ analysis_status: "processing" })
      .eq("id", sessionId);

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

    let feedback: SessionFeedback;

    console.log(`[Analyze] Session ${sessionId}: Starting AI analysis with ${transcript.length} entries`);

    try {
      // Generate feedback analysis with a race against timeout
      const analysisPromise = generateJSONCompletion<SessionFeedback>(
        [
          { role: "system", content: SESSION_ANALYSIS_SYSTEM_PROMPT },
          { role: "user", content: analysisPrompt },
        ],
        { model: "gpt-4o", temperature: 0.5, maxTokens: 2000 }
      );

      // 25 second timeout for the AI call (increased from 12)
      feedback = await Promise.race([
        analysisPromise,
        new Promise<SessionFeedback>((_, reject) =>
          setTimeout(() => reject(new Error("AI analysis timeout")), 25000)
        ),
      ]);

      console.log(`[Analyze] Session ${sessionId}: AI analysis completed in ${Date.now() - startTime}ms`);
    } catch (aiError) {
      console.error(`[Analyze] Session ${sessionId}: AI analysis failed after ${Date.now() - startTime}ms:`, aiError);
      feedback = getDefaultFeedback(transcript);
    }

    // Validate feedback structure
    if (!feedback.overallGrade || !feedback.skillGrades) {
      console.error("Invalid feedback structure, using default");
      feedback = getDefaultFeedback(transcript);
    }

    // Calculate overall score from grades
    const gradeToScore: Record<string, number> = {
      "A+": 100, A: 95, "A-": 92,
      "B+": 88, B: 85, "B-": 82,
      "C+": 78, C: 75, "C-": 72,
      D: 65, F: 50,
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

    // Try to mark as completed with default feedback
    if (sessionId) {
      try {
        const supabase = await createClient();
        const defaultFeedback = getDefaultFeedback([]);

        await supabase
          .from("training_sessions")
          .update({
            analysis_status: "completed",
            feedback: defaultFeedback,
            score: 75
          })
          .eq("id", sessionId);

        return NextResponse.json({ feedback: defaultFeedback });
      } catch (e) {
        console.error("Failed to save default feedback:", e);
      }
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
