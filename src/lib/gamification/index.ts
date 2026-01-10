// ============================================
// GAMIFICATION MODULE
// Export all gamification utilities
// ============================================

// XP Calculator
export {
  XP_AWARDS,
  calculateDrillXp,
  calculateSessionXp,
  calculateWeeklyChallengeXp,
  calculateAchievementXp,
  summarizeXpEvents,
  gradeToPoints,
  pointsToGrade,
  compareGrades,
} from "./xp-calculator";

// Level Calculator
export {
  MAX_LEVEL,
  getXpRequiredForLevel,
  getXpForNextLevel,
  getLevelFromXp,
  getLevelInfo,
  wouldLevelUp,
  getLevelTitle,
  getLevelTier,
  getFullLevelInfo,
  generateXpTable,
  LEVEL_TIERS,
  LEVEL_TITLES,
} from "./level-calculator";

// Achievement Checker
export {
  isRequirementMet,
  checkNewAchievements,
  getAchievementsWithProgress,
  createUnlockedAchievement,
  sortAchievementsByCategory,
  getTierColors,
  TIER_COLORS,
} from "./achievement-checker";
export type { UserStats } from "./achievement-checker";
