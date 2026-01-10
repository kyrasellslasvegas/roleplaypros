import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAchievementsWithProgress, sortAchievementsByCategory } from "@/lib/gamification";
import type { Achievement, AchievementWithProgress, UnlockedAchievement } from "@/types/gamification";

// GET /api/gamification/achievements - Get all achievements with user progress
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

    // Get all achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from("achievements")
      .select("*")
      .order("sort_order");

    if (achievementsError) {
      console.error("Error fetching achievements:", achievementsError);
      return NextResponse.json(
        { error: "Failed to fetch achievements" },
        { status: 500 }
      );
    }

    // Get user's gamification progress (for unlocked achievements)
    const { data: gamification } = await supabase
      .from("gamification_progress")
      .select("achievements")
      .eq("user_id", user.id)
      .single();

    const unlocked: UnlockedAchievement[] = gamification?.achievements || [];

    // Get user's stats for progress calculation
    const { data: progress } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const { data: gamificationFull } = await supabase
      .from("gamification_progress")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Get this week's compliance score if available
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const { data: weeklyReport } = await supabase
      .from("weekly_reports")
      .select("compliance_score")
      .eq("user_id", user.id)
      .eq("week_start", weekStartStr)
      .single();

    const userStats = {
      totalSessions: progress?.total_sessions || 0,
      drillsCompleted: gamificationFull?.drills_completed || 0,
      currentStreak: progress?.current_streak || 0,
      longestStreak: progress?.longest_streak || 0,
      totalPracticeMinutes: progress?.total_practice_minutes || 0,
      skillGrades: (progress?.skill_grades as Record<string, { grade: string; trend?: string }>) || {},
      weeklyChallengesCompleted: gamificationFull?.weekly_challenges_completed || 0,
      weeklyComplianceScore: weeklyReport?.compliance_score || undefined,
    };

    // Transform achievements to camelCase and add progress
    const transformedAchievements: Achievement[] = achievements.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      iconName: a.icon_name,
      category: a.category,
      xpReward: a.xp_reward,
      requirement: a.requirement,
      tier: a.tier,
      sortOrder: a.sort_order,
    }));

    const achievementsWithProgress = getAchievementsWithProgress(
      transformedAchievements,
      unlocked,
      userStats
    );

    // Sort by category
    const byCategory = sortAchievementsByCategory(achievementsWithProgress);

    // Calculate stats
    const totalAchievements = achievements.length;
    const unlockedCount = unlocked.length;
    const totalXpFromAchievements = unlocked.reduce((sum, u) => sum + u.xpAwarded, 0);

    return NextResponse.json({
      achievements: achievementsWithProgress,
      byCategory,
      stats: {
        total: totalAchievements,
        unlocked: unlockedCount,
        percentage: Math.round((unlockedCount / totalAchievements) * 100),
        totalXpEarned: totalXpFromAchievements,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/gamification/achievements:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
