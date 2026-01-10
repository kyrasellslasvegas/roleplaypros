// ============================================
// GAMIFICATION TYPES
// Types for XP, levels, achievements, and challenges
// ============================================

// ============================================
// DAILY OBJECTION TYPES
// ============================================

export interface DailyObjection {
  id: string;
  userId: string;
  date: string;
  objectionText: string;
  objectionCategory: ObjectionCategory;
  difficulty: "beginner" | "intermediate" | "advanced";
  targetSkill: SkillName;
  tips: string[];
  context: string | null;
  buyerScenario: BuyerScenario | null;
  completed: boolean;
  completedAt: string | null;
  drillSessionId: string | null;
  score: number | null;
  feedback: DrillFeedback | null;
  xpEarned: number;
  createdAt: string;
}

export type ObjectionCategory =
  | "price"
  | "timing"
  | "competition"
  | "trust"
  | "commitment"
  | "financing"
  | "market"
  | "property";

export interface BuyerScenario {
  name: string;
  personality: string;
  situation: string;
  emotionalState: string;
  resistanceLevel: "low" | "medium" | "high";
}

export interface DrillFeedback {
  overallScore: number;
  grade: string;
  summary: string;
  strengths: string[];
  improvement: string;
  suggestedResponse: string;
}

// ============================================
// GAMIFICATION PROGRESS TYPES
// ============================================

export interface GamificationProgress {
  id: string;
  userId: string;
  totalXp: number;
  currentLevel: number;
  xpToNextLevel: number;
  xpProgress: number; // XP earned towards next level
  achievements: UnlockedAchievement[];
  weeklyChallengesCompleted: number;
  drillsCompleted: number;
  createdAt: string;
  updatedAt: string;
}

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: string;
  xpAwarded: number;
}

// ============================================
// ACHIEVEMENT TYPES
// ============================================

export type AchievementCategory =
  | "beginner"
  | "streak"
  | "skill"
  | "volume"
  | "special";

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconName: string;
  category: AchievementCategory;
  xpReward: number;
  requirement: AchievementRequirement;
  tier: AchievementTier;
  sortOrder: number;
}

export type AchievementRequirement =
  | { type: "sessions"; count: number }
  | { type: "drills"; count: number }
  | { type: "streak"; days: number }
  | { type: "skill_grade"; skill: string; minGrade: string }
  | { type: "min_grade"; grade: string }
  | { type: "session_grade"; grade: string }
  | { type: "all_skills"; minGrade: string }
  | { type: "compliance_week"; score: number }
  | { type: "practice_minutes"; minutes: number }
  | { type: "weekly_challenges"; count: number };

export interface AchievementWithProgress extends Achievement {
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number; // 0-100 percentage
  progressText?: string; // e.g., "3/7 days"
}

// ============================================
// WEEKLY CHALLENGE TYPES
// ============================================

export interface WeeklyChallenge {
  id: string;
  weekStart: string;
  title: string;
  description: string;
  requirement: ChallengeRequirement;
  xpReward: number;
  bonusMultiplier: number;
  active: boolean;
  createdAt: string;
}

export type ChallengeRequirement =
  | { type: "drills"; count: number }
  | { type: "sessions"; count: number }
  | { type: "min_grades"; grade: string; count: number }
  | { type: "clean_compliance"; count: number }
  | { type: "practice_minutes"; minutes: number };

export interface UserChallengeProgress {
  id: string;
  userId: string;
  challengeId: string;
  progress: ChallengeProgressData;
  completed: boolean;
  completedAt: string | null;
  xpAwarded: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeProgressData {
  current: number;
  target: number;
}

export interface WeeklyChallengeWithProgress extends WeeklyChallenge {
  userProgress?: UserChallengeProgress;
  progressPercentage: number;
  daysRemaining: number;
}

// ============================================
// WEEKLY REPORT TYPES
// ============================================

export interface WeeklyReport {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  sessionsCount: number;
  drillsCount: number;
  totalPracticeMinutes: number;
  skillGrades: Partial<Record<SkillName, string>>;
  skillChanges: Partial<Record<SkillName, SkillChange>>;
  complianceScore: number | null;
  complianceIssuesCount: number;
  coachingInsights: CoachingInsight[];
  streakDays: number | null;
  xpEarned: number;
  overallGrade: string | null;
  emailSent: boolean;
  emailSentAt: string | null;
  createdAt: string;
}

export interface SkillChange {
  previous: string | null;
  current: string;
  trend: "improving" | "stable" | "declining";
  pointsChange: number;
}

export interface CoachingInsight {
  hookCategory: "fear" | "shame" | "curiosity" | "authority" | "drama";
  title: string;
  content: string;
  actionItem: string;
  priority: number;
}

// ============================================
// SKILL TYPES
// ============================================

export type SkillName =
  | "building_rapport"
  | "money_questions"
  | "deep_questions"
  | "frame_control"
  | "objection_handling"
  | "closing"
  | "compliance";

export const SKILL_DISPLAY_NAMES: Record<SkillName, string> = {
  building_rapport: "Building Rapport",
  money_questions: "Money Questions",
  deep_questions: "Deep Questions",
  frame_control: "Frame Control",
  objection_handling: "Objection Handling",
  closing: "Closing",
  compliance: "Compliance",
};

// ============================================
// XP & LEVEL TYPES
// ============================================

export interface XpAwardResult {
  previousXp: number;
  xpAwarded: number;
  newTotalXp: number;
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  newAchievements: Achievement[];
}

export type XpSource =
  | "daily_drill"
  | "roleplay_session"
  | "grade_bonus"
  | "streak_bonus"
  | "weekly_challenge"
  | "achievement";

export interface XpEvent {
  source: XpSource;
  baseXp: number;
  multiplier: number;
  finalXp: number;
  description: string;
}

// ============================================
// LEVEL THRESHOLDS
// ============================================

export interface LevelInfo {
  level: number;
  title: string;
  xpRequired: number;
  tier: AchievementTier;
}

export const LEVEL_TITLES: Record<number, string> = {
  1: "Rookie",
  5: "Apprentice",
  10: "Agent",
  15: "Senior Agent",
  20: "Expert",
  25: "Master",
  30: "Elite",
  35: "Legend",
  40: "Grandmaster",
  45: "Champion",
  50: "Ultimate",
};

// ============================================
// API RESPONSE TYPES
// ============================================

export interface DailyDrillStartResponse {
  sessionId: string;
  heygenToken: string;
  buyerSystemPrompt: string;
  objection: DailyObjection;
}

export interface DailyDrillCompleteResponse {
  feedback: DrillFeedback;
  xpResult: XpAwardResult;
  streakUpdated: boolean;
  newStreak: number;
  newAchievements: Achievement[];
}

export interface GamificationDashboardData {
  progress: GamificationProgress;
  weeklyChallenge: WeeklyChallengeWithProgress | null;
  recentAchievements: AchievementWithProgress[];
  streakInfo: {
    current: number;
    longest: number;
    lastPracticeDate: string | null;
  };
}
