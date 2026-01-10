// AI service types for OpenAI and HeyGen integrations

import type { StreamingEvents } from "@heygen/streaming-avatar";

// OpenAI types
export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAICompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface CoachAnalysisRequest {
  transcript: {
    speaker: string;
    content: string;
    timestamp: number;
  }[];
  currentPhase: string;
  previousSuggestions: string[];
}

export interface CoachAnalysisResponse {
  shouldSuggest: boolean;
  type?: "suggestion" | "warning" | "praise";
  hookCategory?: "fear" | "shame" | "curiosity" | "authority" | "drama";
  content?: string;
  priority?: "low" | "medium" | "high";
}

export interface FeedbackAnalysisRequest {
  sessionId: string;
  transcript: {
    speaker: string;
    content: string;
    timestamp: number;
    phase?: string;
  }[];
  buyerProfile: {
    experienceLevel: string;
    emotionalState: string;
    resistanceLevel: string;
  };
  difficulty: string;
  durationMinutes: number;
}

// HeyGen types
export interface HeygenTokenResponse {
  token: string;
  expiresAt: number;
}

export interface HeygenSessionConfig {
  avatarName?: string;
  quality?: "high" | "medium" | "low";
  voiceId?: string;
  voiceEmotion?: "EXCITED" | "SERIOUS" | "FRIENDLY" | "SOOTHING" | "BROADCASTER";
  language?: string;
}

export type HeygenAvatarStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "speaking"
  | "listening"
  | "error"
  | "disconnected";

export interface HeygenAvatarState {
  status: HeygenAvatarStatus;
  sessionId: string | null;
  isUserSpeaking: boolean;
  isAvatarSpeaking: boolean;
  error: string | null;
}

// Re-export HeyGen SDK events for convenience
export type { StreamingEvents };

// SSE Event types for coach feedback
export interface CoachSSEEvent {
  type: "suggestion" | "warning" | "praise" | "heartbeat" | "error";
  hookCategory?: "fear" | "shame" | "curiosity" | "authority" | "drama";
  content?: string;
  timestamp: number;
  id?: string;
}

// Avatar speak options
export interface AvatarSpeakOptions {
  text: string;
  taskType?: "TALK" | "REPEAT";
}
