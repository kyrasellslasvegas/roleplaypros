import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSONCompletion } from "@/lib/ai/openai";
import {
  DRILL_FEEDBACK_SYSTEM_PROMPT,
  buildDrillFeedbackPrompt,
  calculateDrillXp,
} from "@/lib/ai/prompts/drill-feedback";
import {
  getLevelInfo,
  checkNewAchievements,
  createUnlockedAchievement,
} from "@/lib/gamification";
import type { DailyDrillCompleteResponse, DrillFeedback, Achievement } from "@/types/gamification";
import type { TranscriptEntry } from "@/types/session";

interface CompleteRequest {
  objectionId: string;
  sessionId: string;
  transcript: TranscriptEntry[];
  durationSeconds: number;
}

// POST /api/drills/daily/complete - Complete a daily drill and get feedback
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CompleteRequest = await request.json();
    const { objectionId, sessionId, transcript, durationSeconds } = body;

    if (!objectionId || !sessionId) {
      return NextResponse.json(
        { error: "Objection ID and Session ID are required" },
        { status: 400 }
      );
    }

    // Fetch the objection
    const { data: objection, error: fetchError } = await supabase
      .from("daily_objections")
      .select("*")
      .eq("id", objectionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !objection) {
      return NextResponse.json(
        { error: "Objection not found" },
        { status: 404 }
      );
    }

    if (objection.completed) {
      return NextResponse.json(
        { error: "This drill has already been completed" },
        { status: 400 }
      );
    }

    // Generate feedback using AI
    const feedbackPrompt = buildDrillFeedbackPrompt({
      objectionText: objection.objection_text,
      objectionCategory: objection.objection_category,
      targetSkill: objection.target_skill,
      difficulty: objection.difficulty,
      buyerScenario: objection.buyer_scenario,
      transcript,
      durationSeconds,
      tips: objection.tips || [],
    });

    const feedback = await generateJSONCompletion<DrillFeedback>(
      [
        { role: "system", content: DRILL_FEEDBACK_SYSTEM_PROMPT },
        { role: "user", content: feedbackPrompt },
      ],
      { model: "gpt-4o", temperature: 0.5, maxTokens: 800 }
    );

    // Get user's current progress for streak and XP calculations
    const { data: progress } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const { data: gamification } = await supabase
      .from("gamification_progress")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Calculate streak
    const today = new Date().toISOString().split("T")[0];
    const lastPractice = progress?.last_practice_date?.split("T")[0];
    let currentStreak = progress?.current_streak || 0;
    let streakUpdated = false;

    if (lastPractice !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastPractice === yesterdayStr) {
        currentStreak += 1;
      } else if (!lastPractice) {
        currentStreak = 1;
      } else {
        currentStreak = 1; // Streak broken
      }
      streakUpdated = true;
    }

    // Calculate XP
    const xpResult = calculateDrillXp(
      feedback.overallScore,
      objection.difficulty,
      currentStreak
    );

    const previousXp = gamification?.total_xp || 0;
    const newTotalXp = previousXp + xpResult.totalXp;
    const previousLevelInfo = getLevelInfo(previousXp);
    const newLevelInfo = getLevelInfo(newTotalXp);
    const leveledUp = newLevelInfo.currentLevel > previousLevelInfo.currentLevel;

    // Check for new achievements
    const { data: allAchievements } = await supabase
      .from("achievements")
      .select("*")
      .order("sort_order");

    const unlockedIds = (gamification?.achievements || []).map(
      (a: { achievementId: string }) => a.achievementId
    );

    const drillsCompleted = (gamification?.drills_completed || 0) + 1;

    const userStats = {
      totalSessions: progress?.total_sessions || 0,
      drillsCompleted,
      currentStreak,
      longestStreak: Math.max(progress?.longest_streak || 0, currentStreak),
      totalPracticeMinutes: (progress?.total_practice_minutes || 0) + Math.ceil(durationSeconds / 60),
      skillGrades: progress?.skill_grades || {},
      weeklyChallengesCompleted: gamification?.weekly_challenges_completed || 0,
      latestSessionGrade: feedback.grade,
    };

    const newAchievements = checkNewAchievements(
      allAchievements as Achievement[],
      unlockedIds,
      userStats
    );

    // Calculate additional XP from achievements
    let achievementXp = 0;
    const newUnlockedAchievements = newAchievements.map((a) => {
      achievementXp += a.xpReward;
      return createUnlockedAchievement(a.id, a.xpReward);
    });

    const finalTotalXp = newTotalXp + achievementXp;
    const finalLevelInfo = getLevelInfo(finalTotalXp);

    // Update database records
    // 1. Update daily objection
    await supabase
      .from("daily_objections")
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        score: feedback.overallScore,
        feedback,
        xp_earned: xpResult.totalXp + achievementXp,
      })
      .eq("id", objectionId);

    // 2. Update training session
    await supabase
      .from("training_sessions")
      .update({
        transcript,
        score: feedback.overallScore,
        feedback: {
          overallGrade: feedback.grade,
          overallSummary: feedback.summary,
          strengths: feedback.strengths,
          areasForImprovement: [feedback.improvement],
        },
        duration_minutes: Math.ceil(durationSeconds / 60),
        ended_at: new Date().toISOString(),
        analysis_status: "completed",
        xp_earned: xpResult.totalXp,
      })
      .eq("id", sessionId);

    // 3. Update user progress
    const newLongestStreak = Math.max(progress?.longest_streak || 0, currentStreak);
    await supabase
      .from("user_progress")
      .update({
        current_streak: currentStreak,
        longest_streak: newLongestStreak,
        total_practice_minutes:
          (progress?.total_practice_minutes || 0) + Math.ceil(durationSeconds / 60),
        last_practice_date: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    // 4. Update gamification progress
    const updatedAchievements = [
      ...(gamification?.achievements || []),
      ...newUnlockedAchievements,
    ];

    await supabase
      .from("gamification_progress")
      .upsert({
        user_id: user.id,
        total_xp: finalTotalXp,
        current_level: finalLevelInfo.currentLevel,
        xp_to_next_level: finalLevelInfo.xpToNextLevel,
        achievements: updatedAchievements,
        drills_completed: drillsCompleted,
      })
      .eq("user_id", user.id);

    const response: DailyDrillCompleteResponse = {
      feedback,
      xpResult: {
        previousXp,
        xpAwarded: xpResult.totalXp + achievementXp,
        newTotalXp: finalTotalXp,
        previousLevel: previousLevelInfo.currentLevel,
        newLevel: finalLevelInfo.currentLevel,
        leveledUp: finalLevelInfo.currentLevel > previousLevelInfo.currentLevel,
        newAchievements,
      },
      streakUpdated,
      newStreak: currentStreak,
      newAchievements,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in POST /api/drills/daily/complete:", error);
    return NextResponse.json(
      { error: "Failed to complete drill" },
      { status: 500 }
    );
  }
}
