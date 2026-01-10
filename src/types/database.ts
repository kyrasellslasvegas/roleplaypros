import type {
  BuyerProfile,
  TranscriptEntry,
  CoachSuggestion,
  SessionFeedback,
  SessionPhase,
  AnalysisStatus,
} from "./session";
import type {
  AchievementCategory,
  AchievementTier,
  AchievementRequirement,
  ChallengeRequirement,
  ObjectionCategory,
  SkillName,
  DrillFeedback,
  BuyerScenario,
  CoachingInsight,
  UnlockedAchievement,
  ChallengeProgressData,
} from "./gamification";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          subscription_tier: "free" | "pro" | "enterprise";
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: "free" | "pro" | "enterprise";
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: "free" | "pro" | "enterprise";
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      training_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_type: string;
          difficulty: "beginner" | "intermediate" | "advanced";
          duration_minutes: number | null;
          score: number | null;
          feedback: SessionFeedback | null;
          transcript: TranscriptEntry[] | null;
          created_at: string;
          buyer_profile: BuyerProfile | null;
          heygen_session_id: string | null;
          coach_suggestions: CoachSuggestion[] | null;
          session_phases: SessionPhase[] | null;
          ended_at: string | null;
          analysis_status: AnalysisStatus;
          // Gamification additions
          is_drill: boolean;
          drill_type: "daily_objection" | "top10" | "compliance" | null;
          xp_earned: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_type: string;
          difficulty?: "beginner" | "intermediate" | "advanced";
          duration_minutes?: number | null;
          score?: number | null;
          feedback?: SessionFeedback | null;
          transcript?: TranscriptEntry[] | null;
          created_at?: string;
          buyer_profile?: BuyerProfile | null;
          heygen_session_id?: string | null;
          coach_suggestions?: CoachSuggestion[] | null;
          session_phases?: SessionPhase[] | null;
          ended_at?: string | null;
          analysis_status?: AnalysisStatus;
          // Gamification additions
          is_drill?: boolean;
          drill_type?: "daily_objection" | "top10" | "compliance" | null;
          xp_earned?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_type?: string;
          difficulty?: "beginner" | "intermediate" | "advanced";
          duration_minutes?: number | null;
          score?: number | null;
          feedback?: SessionFeedback | null;
          transcript?: TranscriptEntry[] | null;
          created_at?: string;
          buyer_profile?: BuyerProfile | null;
          heygen_session_id?: string | null;
          coach_suggestions?: CoachSuggestion[] | null;
          session_phases?: SessionPhase[] | null;
          ended_at?: string | null;
          analysis_status?: AnalysisStatus;
          // Gamification additions
          is_drill?: boolean;
          drill_type?: "daily_objection" | "top10" | "compliance" | null;
          xp_earned?: number;
        };
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          total_sessions: number;
          total_practice_minutes: number;
          skill_grades: Json;
          last_practice_date: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          total_sessions?: number;
          total_practice_minutes?: number;
          skill_grades?: Json;
          last_practice_date?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          total_sessions?: number;
          total_practice_minutes?: number;
          skill_grades?: Json;
          last_practice_date?: string | null;
          updated_at?: string;
        };
      };
      agent_applications: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string;
          brokerage_name: string;
          brokerage_address: string;
          brokerage_phone: string;
          is_active_agent: boolean;
          licensed_states: string[];
          license_numbers: Record<string, string>;
          years_of_experience: number;
          status: "pending" | "approved" | "rejected";
          reviewed_at: string | null;
          reviewed_by: string | null;
          rejection_reason: string | null;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone: string;
          brokerage_name: string;
          brokerage_address: string;
          brokerage_phone: string;
          is_active_agent?: boolean;
          licensed_states: string[];
          license_numbers: Record<string, string>;
          years_of_experience: number;
          status?: "pending" | "approved" | "rejected";
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          brokerage_name?: string;
          brokerage_address?: string;
          brokerage_phone?: string;
          is_active_agent?: boolean;
          licensed_states?: string[];
          license_numbers?: Record<string, string>;
          years_of_experience?: number;
          status?: "pending" | "approved" | "rejected";
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // ============================================
      // GAMIFICATION TABLES
      // ============================================
      achievements: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon_name: string;
          category: AchievementCategory;
          xp_reward: number;
          requirement: AchievementRequirement;
          tier: AchievementTier;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description: string;
          icon_name: string;
          category: AchievementCategory;
          xp_reward?: number;
          requirement: AchievementRequirement;
          tier?: AchievementTier;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon_name?: string;
          category?: AchievementCategory;
          xp_reward?: number;
          requirement?: AchievementRequirement;
          tier?: AchievementTier;
          sort_order?: number;
          created_at?: string;
        };
      };
      gamification_progress: {
        Row: {
          id: string;
          user_id: string;
          total_xp: number;
          current_level: number;
          xp_to_next_level: number;
          achievements: UnlockedAchievement[];
          weekly_challenges_completed: number;
          drills_completed: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_xp?: number;
          current_level?: number;
          xp_to_next_level?: number;
          achievements?: UnlockedAchievement[];
          weekly_challenges_completed?: number;
          drills_completed?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_xp?: number;
          current_level?: number;
          xp_to_next_level?: number;
          achievements?: UnlockedAchievement[];
          weekly_challenges_completed?: number;
          drills_completed?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      weekly_challenges: {
        Row: {
          id: string;
          week_start: string;
          title: string;
          description: string;
          requirement: ChallengeRequirement;
          xp_reward: number;
          bonus_multiplier: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          week_start: string;
          title: string;
          description: string;
          requirement: ChallengeRequirement;
          xp_reward?: number;
          bonus_multiplier?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          week_start?: string;
          title?: string;
          description?: string;
          requirement?: ChallengeRequirement;
          xp_reward?: number;
          bonus_multiplier?: number;
          active?: boolean;
          created_at?: string;
        };
      };
      user_challenge_progress: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          progress: ChallengeProgressData;
          completed: boolean;
          completed_at: string | null;
          xp_awarded: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          progress?: ChallengeProgressData;
          completed?: boolean;
          completed_at?: string | null;
          xp_awarded?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          challenge_id?: string;
          progress?: ChallengeProgressData;
          completed?: boolean;
          completed_at?: string | null;
          xp_awarded?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_objections: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          objection_text: string;
          objection_category: ObjectionCategory;
          difficulty: "beginner" | "intermediate" | "advanced";
          target_skill: SkillName;
          tips: string[];
          context: string | null;
          buyer_scenario: BuyerScenario | null;
          completed: boolean;
          completed_at: string | null;
          drill_session_id: string | null;
          score: number | null;
          feedback: DrillFeedback | null;
          xp_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          objection_text: string;
          objection_category: ObjectionCategory;
          difficulty: "beginner" | "intermediate" | "advanced";
          target_skill: SkillName;
          tips?: string[];
          context?: string | null;
          buyer_scenario?: BuyerScenario | null;
          completed?: boolean;
          completed_at?: string | null;
          drill_session_id?: string | null;
          score?: number | null;
          feedback?: DrillFeedback | null;
          xp_earned?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          objection_text?: string;
          objection_category?: ObjectionCategory;
          difficulty?: "beginner" | "intermediate" | "advanced";
          target_skill?: SkillName;
          tips?: string[];
          context?: string | null;
          buyer_scenario?: BuyerScenario | null;
          completed?: boolean;
          completed_at?: string | null;
          drill_session_id?: string | null;
          score?: number | null;
          feedback?: DrillFeedback | null;
          xp_earned?: number;
          created_at?: string;
        };
      };
      weekly_reports: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          week_end: string;
          sessions_count: number;
          drills_count: number;
          total_practice_minutes: number;
          skill_grades: Record<string, string>;
          skill_changes: Record<string, number>;
          compliance_score: number | null;
          compliance_issues_count: number;
          coaching_insights: CoachingInsight[];
          streak_days: number | null;
          xp_earned: number;
          overall_grade: string | null;
          email_sent: boolean;
          email_sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start: string;
          week_end: string;
          sessions_count?: number;
          drills_count?: number;
          total_practice_minutes?: number;
          skill_grades?: Record<string, string>;
          skill_changes?: Record<string, number>;
          compliance_score?: number | null;
          compliance_issues_count?: number;
          coaching_insights?: CoachingInsight[];
          streak_days?: number | null;
          xp_earned?: number;
          overall_grade?: string | null;
          email_sent?: boolean;
          email_sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start?: string;
          week_end?: string;
          sessions_count?: number;
          drills_count?: number;
          total_practice_minutes?: number;
          skill_grades?: Record<string, string>;
          skill_changes?: Record<string, number>;
          compliance_score?: number | null;
          compliance_issues_count?: number;
          coaching_insights?: CoachingInsight[];
          streak_days?: number | null;
          xp_earned?: number;
          overall_grade?: string | null;
          email_sent?: boolean;
          email_sent_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
