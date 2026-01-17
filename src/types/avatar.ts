// Custom avatar system types for OpenAI TTS/Whisper integration

// Avatar status for the custom realtime avatar
export type AvatarStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "speaking"
  | "listening"
  | "error"
  | "disconnected";

// OpenAI TTS voices
export type TTSVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

// Voice mapping based on buyer personality
export const PERSONALITY_VOICE_MAP: Record<string, TTSVoice> = {
  friendly: "nova",      // Warm, approachable
  cautious: "echo",      // Measured, thoughtful
  dominant: "onyx",      // Authoritative
  nervous: "shimmer",    // Softer tone
  skeptical: "fable",    // Expressive
  distracted: "alloy",   // Neutral
};

// TTS request/response types
export interface TTSRequest {
  text: string;
  voice?: TTSVoice;
  speed?: number; // 0.25 to 4.0, default 1.0
}

// Whisper transcription response
export interface WhisperTranscriptionResponse {
  text: string;
}

// Audio recorder state
export interface AudioRecorderState {
  isRecording: boolean;
  isSupported: boolean;
  audioLevel: number;
  error: string | null;
}

// Audio player state
export interface AudioPlayerState {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  error: string | null;
}

// Audio recorder events
export interface AudioRecorderEvents {
  onSpeechStart?: () => void;
  onSpeechEnd?: (audioBlob: Blob) => void;
  onAudioLevel?: (level: number) => void;
  onError?: (error: Error) => void;
}

// Audio player events
export interface AudioPlayerEvents {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

// Custom avatar hook options
export interface UseCustomAvatarOptions {
  onUserMessage?: (text: string) => void;
  onAvatarSpeakingChange?: (isSpeaking: boolean) => void;
  onError?: (error: Error) => void;
  personalityVoice?: TTSVoice;
}

// Custom avatar hook return type
export interface UseCustomAvatarReturn {
  status: AvatarStatus;
  startSession: (avatarImageUrl?: string) => Promise<void>;
  speak: (text: string, emotion?: string) => Promise<void>;
  startVoiceChat: () => Promise<void>;
  stopVoiceChat: () => void;
  interrupt: () => void;
  endSession: () => Promise<void>;
  isUserSpeaking: boolean;
  isAvatarSpeaking: boolean;
  userTranscript: string;
  error: string | null;
  avatarImageUrl: string | null;
  audioLevel: number;
}

// Session start response for the custom avatar
export interface CustomSessionStartResponse {
  sessionId: string;
  avatarImageUrl: string;
  buyerSystemPrompt?: string;
}
