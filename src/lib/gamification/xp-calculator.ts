// ============================================
// XP CALCULATOR
// Calculate XP awards for various activities
// ============================================

import type { XpEvent, XpSource } from "@/types/gamification";

// ============================================
// XP AWARD CONSTANTS
// ============================================

export const XP_AWARDS = {
  // Daily drills
  DRILL_BASE: 50,
  DRILL_GRADE_BONUS_PER_LEVEL: 10, // Per grade level above C

  // Roleplay sessions
  SESSION_BASE: 100,
  SESSION_PER_MINUTE: 2, // Bonus per minute of practice
  SESSION_MAX_DURATION_BONUS: 60, // Cap at 30 minutes (60 XP)

  // Grade bonuses (added to base)
  GRADE_BONUS: {
    "A+": 50,
    "A": 40,
    "A-": 35,
    "B+": 25,
    "B": 20,
    "B-": 15,
    "C+": 10,
    "C": 5,
    "C-": 0,
    "D": 0,
    "F": 0,
  } as Record<string, number>,

  // Streak bonuses
  STREAK_BONUS_PER_DAY: 5,
  STREAK_BONUS_MAX: 50, // Cap at 10 days

  // Weekly challenge
  WEEKLY_CHALLENGE_BASE: 200,

  // Achievement XP is defined per-achievement in the database
} as const;

// ============================================
// XP CALCULATION FUNCTIONS
// ============================================

export function calculateDrillXp(
  grade: string,
  difficulty: "beginner" | "intermediate" | "advanced",
  streakDays: number
): XpEvent {
  const baseXp = XP_AWARDS.DRILL_BASE;
  const gradeBonus = XP_AWARDS.GRADE_BONUS[grade] || 0;

  // Difficulty multiplier
  const difficultyMultiplier = {
    beginner: 1.0,
    intermediate: 1.2,
    advanced: 1.5,
  }[difficulty];

  // Streak bonus
  const streakBonus = Math.min(streakDays * XP_AWARDS.STREAK_BONUS_PER_DAY, XP_AWARDS.STREAK_BONUS_MAX);

  const subtotal = baseXp + gradeBonus;
  const withDifficulty = Math.round(subtotal * difficultyMultiplier);
  const finalXp = withDifficulty + streakBonus;

  return {
    source: "daily_drill",
    baseXp: baseXp,
    multiplier: difficultyMultiplier,
    finalXp: finalXp,
    description: `Daily drill completed (${grade}, ${difficulty})${streakBonus > 0 ? ` +${streakBonus} streak bonus` : ""}`,
  };
}

export function calculateSessionXp(
  grade: string,
  durationMinutes: number,
  difficulty: "beginner" | "intermediate" | "advanced",
  streakDays: number,
  isDrill: boolean = false
): XpEvent {
  // If it's a drill, use drill calculation
  if (isDrill) {
    return calculateDrillXp(grade, difficulty, streakDays);
  }

  const baseXp = XP_AWARDS.SESSION_BASE;
  const gradeBonus = XP_AWARDS.GRADE_BONUS[grade] || 0;

  // Duration bonus (capped)
  const durationBonus = Math.min(
    durationMinutes * XP_AWARDS.SESSION_PER_MINUTE,
    XP_AWARDS.SESSION_MAX_DURATION_BONUS
  );

  // Difficulty multiplier
  const difficultyMultiplier = {
    beginner: 1.0,
    intermediate: 1.25,
    advanced: 1.5,
  }[difficulty];

  // Streak bonus
  const streakBonus = Math.min(streakDays * XP_AWARDS.STREAK_BONUS_PER_DAY, XP_AWARDS.STREAK_BONUS_MAX);

  const subtotal = baseXp + gradeBonus + durationBonus;
  const withDifficulty = Math.round(subtotal * difficultyMultiplier);
  const finalXp = withDifficulty + streakBonus;

  return {
    source: "roleplay_session",
    baseXp: baseXp,
    multiplier: difficultyMultiplier,
    finalXp: finalXp,
    description: `Roleplay session completed (${grade}, ${durationMinutes}min, ${difficulty})${streakBonus > 0 ? ` +${streakBonus} streak bonus` : ""}`,
  };
}

export function calculateWeeklyChallengeXp(
  challengeXpReward: number,
  bonusMultiplier: number = 1.0
): XpEvent {
  const finalXp = Math.round(challengeXpReward * bonusMultiplier);

  return {
    source: "weekly_challenge",
    baseXp: challengeXpReward,
    multiplier: bonusMultiplier,
    finalXp: finalXp,
    description: `Weekly challenge completed${bonusMultiplier > 1 ? ` (${bonusMultiplier}x bonus!)` : ""}`,
  };
}

export function calculateAchievementXp(achievementXpReward: number): XpEvent {
  return {
    source: "achievement",
    baseXp: achievementXpReward,
    multiplier: 1.0,
    finalXp: achievementXpReward,
    description: "Achievement unlocked",
  };
}

// ============================================
// XP SUMMARY HELPERS
// ============================================

export function summarizeXpEvents(events: XpEvent[]): {
  totalXp: number;
  breakdown: { source: XpSource; xp: number }[];
} {
  const breakdown: { source: XpSource; xp: number }[] = [];
  let totalXp = 0;

  const bySource = new Map<XpSource, number>();

  for (const event of events) {
    totalXp += event.finalXp;
    bySource.set(event.source, (bySource.get(event.source) || 0) + event.finalXp);
  }

  for (const [source, xp] of bySource) {
    breakdown.push({ source, xp });
  }

  return { totalXp, breakdown };
}

// ============================================
// GRADE HELPERS
// ============================================

export function gradeToPoints(grade: string): number {
  const gradePoints: Record<string, number> = {
    "A+": 12,
    "A": 11,
    "A-": 10,
    "B+": 9,
    "B": 8,
    "B-": 7,
    "C+": 6,
    "C": 5,
    "C-": 4,
    "D+": 3,
    "D": 2,
    "D-": 1,
    "F": 0,
  };
  return gradePoints[grade] ?? 5; // Default to C
}

export function pointsToGrade(points: number): string {
  if (points >= 12) return "A+";
  if (points >= 11) return "A";
  if (points >= 10) return "A-";
  if (points >= 9) return "B+";
  if (points >= 8) return "B";
  if (points >= 7) return "B-";
  if (points >= 6) return "C+";
  if (points >= 5) return "C";
  if (points >= 4) return "C-";
  if (points >= 3) return "D+";
  if (points >= 2) return "D";
  if (points >= 1) return "D-";
  return "F";
}

export function compareGrades(grade1: string, grade2: string): "better" | "same" | "worse" {
  const points1 = gradeToPoints(grade1);
  const points2 = gradeToPoints(grade2);

  if (points1 > points2) return "better";
  if (points1 < points2) return "worse";
  return "same";
}
