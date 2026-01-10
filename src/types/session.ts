// Session configuration and state types for AI roleplay

export interface BuyerProfile {
  experienceLevel: "first_time" | "move_up" | "investor_lite";
  emotionalState: "excited" | "rushed";
  financialComfort: "clear" | "unclear" | "embarrassed";
  resistanceLevel: "low" | "medium" | "high";
  questionDepth: "surface" | "mixed" | "advanced";
  personality: "friendly" | "cautious" | "dominant" | "distracted" | "nervous" | "skeptical";
}

export interface ComplianceViolation {
  id: string;
  severity: "info" | "warning" | "critical";
  category: "disclosure" | "fair_housing" | "licensing" | "promises" | "ethics";
  message: string;
  suggestion: string;
  transcriptIndex?: number;
  timestamp: number;
}

export interface TeleprompterSuggestion {
  id: string;
  phase: SessionPhase;
  type: "opener" | "question" | "transition" | "response" | "close";
  text: string;
  context?: string;
}

export type CoachHookCategory = "fear" | "shame" | "curiosity" | "authority" | "drama";

export interface SessionConfig {
  difficulty: "beginner" | "intermediate" | "advanced";
  durationMinutes: 10 | 30 | 60;
  buyerProfile: BuyerProfile;
}

export interface TranscriptEntry {
  id: string;
  speaker: "user" | "ai_buyer";
  content: string;
  timestamp: number;
  phase?: SessionPhase;
  coachNoteId?: string;
}

export type SessionPhase =
  | "rapport"
  | "money_questions"
  | "deep_questions"
  | "frame"
  | "close";

export interface CoachSuggestion {
  id: string;
  type: "suggestion" | "warning" | "praise";
  content: string;
  timestamp: number;
  relatedTranscriptIndex?: number;
  dismissed?: boolean;
  hookCategory?: CoachHookCategory;
}

export interface SkillGrade {
  skill: string;
  grade: string;
  notes: string;
  trend?: "improving" | "stable" | "declining";
}

export interface ComplianceIssue {
  severity: "minor" | "major" | "critical";
  description: string;
  transcriptReference: number;
  suggestion: string;
}

export interface KeyMoment {
  timestamp: number;
  type: "positive" | "negative" | "teachable";
  description: string;
  transcriptIndex?: number;
}

export interface SessionFeedback {
  overallGrade: string;
  overallSummary: string;
  skillGrades: SkillGrade[];
  strengths: string[];
  areasForImprovement: string[];
  complianceIssues: ComplianceIssue[];
  keyMoments: KeyMoment[];
  nextSessionFocus: string;
}

export type SessionStatus =
  | "configuring"
  | "connecting"
  | "active"
  | "paused"
  | "ending"
  | "completed"
  | "error";

export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";

export interface SessionState {
  sessionId: string | null;
  status: SessionStatus;
  config: SessionConfig | null;
  transcript: TranscriptEntry[];
  coachSuggestions: CoachSuggestion[];
  complianceViolations: ComplianceViolation[];
  teleprompterSuggestions: TeleprompterSuggestion[];
  currentPhase: SessionPhase;
  startedAt: number | null;
  elapsedSeconds: number;
  lastUserSpeakTime: number;
  agentSpeakingDuration: number;
  error: string | null;
}

export interface SessionStartResponse {
  sessionId: string;
  heygenToken: string;
  buyerSystemPrompt: string;
}

export interface SessionEndResponse {
  feedbackUrl: string;
  analysisStatus: AnalysisStatus;
}

export interface BuyerRespondRequest {
  sessionId: string;
  userMessage: string;
  conversationHistory: TranscriptEntry[];
  buyerProfile: BuyerProfile;
  currentPhase: SessionPhase;
}

export interface BuyerRespondResponse {
  response: string;
  emotion?: "neutral" | "happy" | "concerned" | "skeptical" | "frustrated";
  shouldAdvancePhase?: boolean;
  nextPhase?: SessionPhase;
  isInterruption?: boolean;
  interruptionReason?: string;
}
