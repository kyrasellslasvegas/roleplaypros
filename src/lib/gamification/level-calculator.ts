// ============================================
// LEVEL CALCULATOR
// Calculate levels from XP using exponential curve
// ============================================

import type { LevelInfo, AchievementTier } from "@/types/gamification";

// ============================================
// LEVEL CONFIGURATION
// ============================================

export const MAX_LEVEL = 50;

// XP required for each level follows: base + (level * multiplier)
// This creates a smooth exponential curve
const BASE_XP = 100;
const XP_MULTIPLIER = 50;

// ============================================
// LEVEL CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate the total XP required to reach a specific level
 */
export function getXpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level > MAX_LEVEL) level = MAX_LEVEL;

  // Sum of XP required for each level from 2 to target
  // Formula: sum(BASE_XP + i * XP_MULTIPLIER) for i = 1 to level-1
  // = (level-1) * BASE_XP + XP_MULTIPLIER * sum(1 to level-1)
  // = (level-1) * BASE_XP + XP_MULTIPLIER * (level-1) * level / 2

  const levelsToGain = level - 1;
  const baseTotal = levelsToGain * BASE_XP;
  const multiplierTotal = XP_MULTIPLIER * (levelsToGain * level) / 2;

  return Math.round(baseTotal + multiplierTotal);
}

/**
 * Calculate the XP required to go from one level to the next
 */
export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) return 0;
  return BASE_XP + currentLevel * XP_MULTIPLIER;
}

/**
 * Calculate level from total XP
 */
export function getLevelFromXp(totalXp: number): number {
  if (totalXp <= 0) return 1;

  // Binary search for the level
  let low = 1;
  let high = MAX_LEVEL;

  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const xpRequired = getXpRequiredForLevel(mid);

    if (xpRequired <= totalXp) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return low;
}

/**
 * Get detailed level info including progress to next level
 */
export function getLevelInfo(totalXp: number): {
  currentLevel: number;
  xpInCurrentLevel: number;
  xpRequiredForNextLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
  totalXp: number;
  isMaxLevel: boolean;
} {
  const currentLevel = getLevelFromXp(totalXp);
  const isMaxLevel = currentLevel >= MAX_LEVEL;

  const xpForCurrentLevel = getXpRequiredForLevel(currentLevel);
  const xpForNextLevel = isMaxLevel ? xpForCurrentLevel : getXpRequiredForLevel(currentLevel + 1);
  const xpRequiredForNextLevel = xpForNextLevel - xpForCurrentLevel;

  const xpInCurrentLevel = totalXp - xpForCurrentLevel;
  const xpToNextLevel = isMaxLevel ? 0 : xpForNextLevel - totalXp;
  const progressPercent = isMaxLevel ? 100 : Math.round((xpInCurrentLevel / xpRequiredForNextLevel) * 100);

  return {
    currentLevel,
    xpInCurrentLevel,
    xpRequiredForNextLevel,
    xpToNextLevel,
    progressPercent,
    totalXp,
    isMaxLevel,
  };
}

/**
 * Check if adding XP would cause a level up
 */
export function wouldLevelUp(currentXp: number, xpToAdd: number): {
  willLevelUp: boolean;
  levelsGained: number;
  newLevel: number;
} {
  const currentLevel = getLevelFromXp(currentXp);
  const newLevel = getLevelFromXp(currentXp + xpToAdd);
  const levelsGained = newLevel - currentLevel;

  return {
    willLevelUp: levelsGained > 0,
    levelsGained,
    newLevel,
  };
}

// ============================================
// LEVEL TITLES & TIERS
// ============================================

export const LEVEL_TIERS: { minLevel: number; tier: AchievementTier; name: string }[] = [
  { minLevel: 1, tier: "bronze", name: "Bronze" },
  { minLevel: 10, tier: "silver", name: "Silver" },
  { minLevel: 25, tier: "gold", name: "Gold" },
  { minLevel: 40, tier: "platinum", name: "Platinum" },
];

export const LEVEL_TITLES: { minLevel: number; title: string }[] = [
  { minLevel: 1, title: "Rookie" },
  { minLevel: 3, title: "Trainee" },
  { minLevel: 5, title: "Apprentice" },
  { minLevel: 8, title: "Junior Agent" },
  { minLevel: 10, title: "Agent" },
  { minLevel: 13, title: "Senior Agent" },
  { minLevel: 16, title: "Lead Agent" },
  { minLevel: 20, title: "Expert" },
  { minLevel: 25, title: "Master" },
  { minLevel: 30, title: "Elite" },
  { minLevel: 35, title: "Legend" },
  { minLevel: 40, title: "Grandmaster" },
  { minLevel: 45, title: "Champion" },
  { minLevel: 50, title: "Ultimate" },
];

export function getLevelTitle(level: number): string {
  const title = [...LEVEL_TITLES]
    .reverse()
    .find(t => level >= t.minLevel);
  return title?.title || "Rookie";
}

export function getLevelTier(level: number): AchievementTier {
  const tier = [...LEVEL_TIERS]
    .reverse()
    .find(t => level >= t.minLevel);
  return tier?.tier || "bronze";
}

export function getFullLevelInfo(totalXp: number): LevelInfo {
  const levelInfo = getLevelInfo(totalXp);
  return {
    level: levelInfo.currentLevel,
    title: getLevelTitle(levelInfo.currentLevel),
    xpRequired: getXpRequiredForLevel(levelInfo.currentLevel),
    tier: getLevelTier(levelInfo.currentLevel),
  };
}

// ============================================
// XP TABLE FOR REFERENCE
// ============================================

export function generateXpTable(): { level: number; totalXp: number; xpToNextLevel: number; title: string; tier: AchievementTier }[] {
  const table = [];
  for (let level = 1; level <= MAX_LEVEL; level++) {
    table.push({
      level,
      totalXp: getXpRequiredForLevel(level),
      xpToNextLevel: getXpForNextLevel(level),
      title: getLevelTitle(level),
      tier: getLevelTier(level),
    });
  }
  return table;
}

/*
XP Table Preview:
Level 1:  0 XP (need 150 for level 2)
Level 5:  700 XP
Level 10: 2,500 XP
Level 15: 5,550 XP
Level 20: 9,850 XP
Level 25: 15,400 XP
Level 30: 22,200 XP
Level 35: 30,250 XP
Level 40: 39,550 XP
Level 45: 50,100 XP
Level 50: 61,900 XP
*/
