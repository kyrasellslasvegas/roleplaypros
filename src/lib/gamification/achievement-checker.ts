// ============================================
// ACHIEVEMENT CHECKER
// Check if user has earned new achievements
// ============================================

import type {
  Achievement,
  AchievementRequirement,
  AchievementWithProgress,
  UnlockedAchievement,
  SkillName,
} from "@/types/gamification";
import { gradeToPoints } from "./xp-calculator";

// ============================================
// USER STATS INTERFACE
// ============================================

export interface UserStats {
  totalSessions: number;
  drillsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  totalPracticeMinutes: number;
  skillGrades: Record<string, { grade: string; trend?: string }>;
  weeklyChallengesCompleted: number;
  weeklyComplianceScore?: number;
  latestSessionGrade?: string;
}

// ============================================
// ACHIEVEMENT CHECKING
// ============================================

/**
 * Check if a specific achievement requirement is met
 */
export function isRequirementMet(
  requirement: AchievementRequirement,
  stats: UserStats
): { met: boolean; progress: number; target: number; progressText: string } {
  switch (requirement.type) {
    case "sessions": {
      const met = stats.totalSessions >= requirement.count;
      return {
        met,
        progress: stats.totalSessions,
        target: requirement.count,
        progressText: `${stats.totalSessions}/${requirement.count} sessions`,
      };
    }

    case "drills": {
      const met = stats.drillsCompleted >= requirement.count;
      return {
        met,
        progress: stats.drillsCompleted,
        target: requirement.count,
        progressText: `${stats.drillsCompleted}/${requirement.count} drills`,
      };
    }

    case "streak": {
      // Check both current and longest streak
      const maxStreak = Math.max(stats.currentStreak, stats.longestStreak);
      const met = maxStreak >= requirement.days;
      return {
        met,
        progress: maxStreak,
        target: requirement.days,
        progressText: `${maxStreak}/${requirement.days} days`,
      };
    }

    case "skill_grade": {
      const skillGrade = stats.skillGrades[requirement.skill]?.grade;
      const currentPoints = skillGrade ? gradeToPoints(skillGrade) : 0;
      const requiredPoints = gradeToPoints(requirement.minGrade);
      const met = currentPoints >= requiredPoints;
      return {
        met,
        progress: currentPoints,
        target: requiredPoints,
        progressText: skillGrade ? `${skillGrade} (need ${requirement.minGrade})` : `Need ${requirement.minGrade}`,
      };
    }

    case "min_grade": {
      const latestGrade = stats.latestSessionGrade;
      const currentPoints = latestGrade ? gradeToPoints(latestGrade) : 0;
      const requiredPoints = gradeToPoints(requirement.grade);
      const met = currentPoints >= requiredPoints;
      return {
        met,
        progress: currentPoints,
        target: requiredPoints,
        progressText: latestGrade ? `${latestGrade} (need ${requirement.grade})` : `Need ${requirement.grade}`,
      };
    }

    case "session_grade": {
      const latestGrade = stats.latestSessionGrade;
      const met = latestGrade === requirement.grade;
      return {
        met,
        progress: met ? 1 : 0,
        target: 1,
        progressText: latestGrade ? `${latestGrade} (need ${requirement.grade})` : `Need ${requirement.grade}`,
      };
    }

    case "all_skills": {
      const skills: SkillName[] = [
        "building_rapport",
        "money_questions",
        "deep_questions",
        "frame_control",
        "objection_handling",
        "closing",
        "compliance",
      ];
      const requiredPoints = gradeToPoints(requirement.minGrade);
      let skillsMet = 0;

      for (const skill of skills) {
        const skillGrade = stats.skillGrades[skill]?.grade;
        if (skillGrade && gradeToPoints(skillGrade) >= requiredPoints) {
          skillsMet++;
        }
      }

      const met = skillsMet === skills.length;
      return {
        met,
        progress: skillsMet,
        target: skills.length,
        progressText: `${skillsMet}/${skills.length} skills at ${requirement.minGrade}+`,
      };
    }

    case "compliance_week": {
      const score = stats.weeklyComplianceScore ?? 0;
      const met = score >= requirement.score;
      return {
        met,
        progress: score,
        target: requirement.score,
        progressText: `${score}% (need ${requirement.score}%)`,
      };
    }

    case "practice_minutes": {
      const met = stats.totalPracticeMinutes >= requirement.minutes;
      const hours = Math.floor(stats.totalPracticeMinutes / 60);
      const targetHours = Math.floor(requirement.minutes / 60);
      return {
        met,
        progress: stats.totalPracticeMinutes,
        target: requirement.minutes,
        progressText: `${hours}/${targetHours} hours`,
      };
    }

    case "weekly_challenges": {
      const met = stats.weeklyChallengesCompleted >= requirement.count;
      return {
        met,
        progress: stats.weeklyChallengesCompleted,
        target: requirement.count,
        progressText: `${stats.weeklyChallengesCompleted}/${requirement.count} challenges`,
      };
    }

    default:
      return {
        met: false,
        progress: 0,
        target: 1,
        progressText: "Unknown requirement",
      };
  }
}

/**
 * Check all achievements and return newly earned ones
 */
export function checkNewAchievements(
  achievements: Achievement[],
  unlockedIds: string[],
  stats: UserStats
): Achievement[] {
  const newlyEarned: Achievement[] = [];

  for (const achievement of achievements) {
    // Skip if already unlocked
    if (unlockedIds.includes(achievement.id)) {
      continue;
    }

    const { met } = isRequirementMet(achievement.requirement, stats);
    if (met) {
      newlyEarned.push(achievement);
    }
  }

  return newlyEarned;
}

/**
 * Get achievements with progress info for display
 */
export function getAchievementsWithProgress(
  achievements: Achievement[],
  unlocked: UnlockedAchievement[],
  stats: UserStats
): AchievementWithProgress[] {
  const unlockedMap = new Map(unlocked.map(u => [u.achievementId, u]));

  return achievements.map(achievement => {
    const unlockedInfo = unlockedMap.get(achievement.id);
    const { met, progress, target, progressText } = isRequirementMet(achievement.requirement, stats);

    return {
      ...achievement,
      unlocked: !!unlockedInfo,
      unlockedAt: unlockedInfo?.unlockedAt,
      progress: Math.min(Math.round((progress / target) * 100), 100),
      progressText,
    };
  });
}

// ============================================
// ACHIEVEMENT NOTIFICATION HELPERS
// ============================================

export function createUnlockedAchievement(
  achievementId: string,
  xpAwarded: number
): UnlockedAchievement {
  return {
    achievementId,
    unlockedAt: new Date().toISOString(),
    xpAwarded,
  };
}

export function sortAchievementsByCategory(
  achievements: AchievementWithProgress[]
): Record<string, AchievementWithProgress[]> {
  const categories: Record<string, AchievementWithProgress[]> = {
    beginner: [],
    streak: [],
    skill: [],
    volume: [],
    special: [],
  };

  for (const achievement of achievements) {
    const category = achievement.category;
    if (categories[category]) {
      categories[category].push(achievement);
    }
  }

  // Sort each category by sort_order
  for (const category of Object.keys(categories)) {
    categories[category].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return categories;
}

// ============================================
// ACHIEVEMENT TIER COLORS
// ============================================

export const TIER_COLORS = {
  bronze: {
    bg: "bg-orange-500/20",
    border: "border-orange-500/50",
    text: "text-orange-400",
    icon: "text-orange-500",
  },
  silver: {
    bg: "bg-gray-400/20",
    border: "border-gray-400/50",
    text: "text-gray-300",
    icon: "text-gray-400",
  },
  gold: {
    bg: "bg-gold-500/20",
    border: "border-gold-500/50",
    text: "text-gold-400",
    icon: "text-gold-500",
  },
  platinum: {
    bg: "bg-purple-500/20",
    border: "border-purple-500/50",
    text: "text-purple-300",
    icon: "text-purple-400",
  },
} as const;

export function getTierColors(tier: string) {
  return TIER_COLORS[tier as keyof typeof TIER_COLORS] || TIER_COLORS.bronze;
}
