import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLevelInfo, getLevelTitle, getLevelTier } from "@/lib/gamification";
import type { GamificationDashboardData, WeeklyChallengeWithProgress } from "@/types/gamification";

// GET /api/gamification/progress - Get user's gamification progress
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get gamification progress
    const { data: gamification, error: gamError } = await supabase
      .from("gamification_progress")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // If no record exists, create one
    if (gamError && gamError.code === "PGRST116") {
      const { data: newGamification, error: insertError } = await supabase
        .from("gamification_progress")
        .insert({
          user_id: user.id,
          total_xp: 0,
          current_level: 1,
          xp_to_next_level: 100,
          achievements: [],
          weekly_challenges_completed: 0,
          drills_completed: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating gamification record:", insertError);
        return NextResponse.json(
          { error: "Failed to initialize gamification" },
          { status: 500 }
        );
      }

      return buildResponse(newGamification, supabase, user.id);
    }

    if (gamError) {
      console.error("Error fetching gamification:", gamError);
      return NextResponse.json(
        { error: "Failed to fetch gamification progress" },
        { status: 500 }
      );
    }

    return buildResponse(gamification, supabase, user.id);
  } catch (error) {
    console.error("Error in GET /api/gamification/progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function buildResponse(
  gamification: {
    id: string;
    user_id: string;
    total_xp: number;
    current_level: number;
    xp_to_next_level: number;
    achievements: Array<{ achievementId: string; unlockedAt: string; xpAwarded: number }>;
    weekly_challenges_completed: number;
    drills_completed: number;
    created_at: string;
    updated_at: string;
  },
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  // Get level info
  const levelInfo = getLevelInfo(gamification.total_xp);

  // Get user progress for streak info
  const { data: progress } = await supabase
    .from("user_progress")
    .select("current_streak, longest_streak, last_practice_date")
    .eq("user_id", userId)
    .single();

  // Get current weekly challenge
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const { data: weeklyChallenge } = await supabase
    .from("weekly_challenges")
    .select("*")
    .lte("week_start", weekStartStr)
    .order("week_start", { ascending: false })
    .limit(1)
    .single();

  let weeklyChallengeWithProgress: WeeklyChallengeWithProgress | null = null;

  if (weeklyChallenge) {
    // Get user's progress on this challenge
    const { data: challengeProgress } = await supabase
      .from("user_challenge_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("challenge_id", weeklyChallenge.id)
      .single();

    const weekEnd = new Date(weeklyChallenge.week_start);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const daysRemaining = Math.max(
      0,
      Math.ceil((weekEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );

    const current = challengeProgress?.progress?.current || 0;
    const target = (weeklyChallenge.requirement as { count?: number })?.count || 1;

    weeklyChallengeWithProgress = {
      id: weeklyChallenge.id,
      weekStart: weeklyChallenge.week_start,
      title: weeklyChallenge.title,
      description: weeklyChallenge.description,
      requirement: weeklyChallenge.requirement,
      xpReward: weeklyChallenge.xp_reward,
      bonusMultiplier: weeklyChallenge.bonus_multiplier,
      active: weeklyChallenge.active,
      createdAt: weeklyChallenge.created_at,
      userProgress: challengeProgress || undefined,
      progressPercentage: Math.min(100, Math.round((current / target) * 100)),
      daysRemaining,
    };
  }

  // Get recent achievements
  const { data: allAchievements } = await supabase
    .from("achievements")
    .select("*")
    .order("sort_order");

  const unlockedIds = new Set(gamification.achievements.map((a) => a.achievementId));
  const recentUnlocked = gamification.achievements
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
    .slice(0, 5);

  const recentAchievements = recentUnlocked
    .map((unlocked) => {
      const achievement = allAchievements?.find((a) => a.id === unlocked.achievementId);
      if (!achievement) return null;
      return {
        ...achievement,
        unlocked: true,
        unlockedAt: unlocked.unlockedAt,
        progress: 100,
        progressText: "Completed",
      };
    })
    .filter(Boolean);

  const response: GamificationDashboardData = {
    progress: {
      id: gamification.id,
      userId: gamification.user_id,
      totalXp: gamification.total_xp,
      currentLevel: levelInfo.currentLevel,
      xpToNextLevel: levelInfo.xpToNextLevel,
      xpProgress: levelInfo.xpInCurrentLevel,
      achievements: gamification.achievements,
      weeklyChallengesCompleted: gamification.weekly_challenges_completed,
      drillsCompleted: gamification.drills_completed,
      createdAt: gamification.created_at,
      updatedAt: gamification.updated_at,
    },
    weeklyChallenge: weeklyChallengeWithProgress,
    recentAchievements: recentAchievements as GamificationDashboardData["recentAchievements"],
    streakInfo: {
      current: progress?.current_streak || 0,
      longest: progress?.longest_streak || 0,
      lastPracticeDate: progress?.last_practice_date || null,
    },
  };

  return NextResponse.json(response);
}
