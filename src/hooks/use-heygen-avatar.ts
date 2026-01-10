"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
  VoiceEmotion,
} from "@heygen/streaming-avatar";
import type { HeygenAvatarStatus } from "@/types/ai";

interface UseHeygenAvatarOptions {
  onUserMessage?: (text: string) => void;
  onAvatarSpeakingChange?: (isSpeaking: boolean) => void;
  onError?: (error: Error) => void;
}

interface UseHeygenAvatarReturn {
  status: HeygenAvatarStatus;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startSession: (token: string, avatarId?: string) => Promise<void>;
  speak: (text: string, emotion?: string) => Promise<void>;
  startVoiceChat: () => Promise<void>;
  stopVoiceChat: () => void;
  interrupt: () => void;
  endSession: () => Promise<void>;
  isUserSpeaking: boolean;
  isAvatarSpeaking: boolean;
  userTranscript: string;
  error: string | null;
}

export function useHeygenAvatar(
  options: UseHeygenAvatarOptions = {}
): UseHeygenAvatarReturn {
  const { onUserMessage, onAvatarSpeakingChange, onError } = options;

  const [status, setStatus] = useState<HeygenAvatarStatus>("idle");
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const avatarRef = useRef<StreamingAvatar | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (avatarRef.current) {
        avatarRef.current.stopAvatar().catch(console.error);
      }
    };
  }, []);

  const startSession = useCallback(
    async (token: string, avatarId?: string) => {
      try {
        setStatus("connecting");
        setError(null);

        // Initialize the avatar
        const avatar = new StreamingAvatar({ token });
        avatarRef.current = avatar;

        // Set up event listeners
        avatar.on(StreamingEvents.STREAM_READY, (event) => {
          console.log("Stream ready:", event);
          if (videoRef.current && event.detail) {
            videoRef.current.srcObject = event.detail;
            videoRef.current.play().catch(console.error);
          }
          setStatus("connected");
        });

        avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
          console.log("Stream disconnected");
          setStatus("disconnected");
        });

        avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
          setIsAvatarSpeaking(true);
          onAvatarSpeakingChange?.(true);
        });

        avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
          setIsAvatarSpeaking(false);
          onAvatarSpeakingChange?.(false);
        });

        avatar.on(StreamingEvents.USER_START, () => {
          setIsUserSpeaking(true);
        });

        avatar.on(StreamingEvents.USER_STOP, () => {
          setIsUserSpeaking(false);
        });

        avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
          const message = event.detail?.message;
          if (message) {
            setUserTranscript(message);
            onUserMessage?.(message);
          }
        });

        // Start the avatar session
        // Note: Avatar appearance (professional real estate office setting) should be
        // configured in the HeyGen dashboard by selecting an appropriate avatar
        const sessionData = await avatar.createStartAvatar({
          avatarName: avatarId || process.env.NEXT_PUBLIC_HEYGEN_AVATAR_ID || "default",
          quality: AvatarQuality.High,
          voice: {
            voiceId: undefined, // Use default voice
            emotion: VoiceEmotion.FRIENDLY,
          },
          language: "en",
        });

        sessionIdRef.current = sessionData.session_id;
        console.log("Avatar session started:", sessionData.session_id);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Failed to start avatar session:", error);
        setError(error.message);
        setStatus("error");
        onError?.(error);
      }
    },
    [onUserMessage, onAvatarSpeakingChange, onError]
  );

  const speak = useCallback(
    async (text: string, emotion?: string) => {
      if (!avatarRef.current || status !== "connected") {
        console.warn("Avatar not connected, cannot speak");
        return;
      }

      try {
        setStatus("speaking");
        await avatarRef.current.speak({
          text,
          taskType: TaskType.REPEAT,
        });
      } catch (err) {
        console.error("Failed to make avatar speak:", err);
        setStatus("connected");
      }
    },
    [status]
  );

  const startVoiceChat = useCallback(async () => {
    if (!avatarRef.current || status !== "connected") {
      console.warn("Avatar not connected, cannot start voice chat");
      return;
    }

    try {
      setStatus("listening");
      await avatarRef.current.startVoiceChat();
      console.log("Voice chat started");
    } catch (err) {
      console.error("Failed to start voice chat:", err);
      setStatus("connected");
    }
  }, [status]);

  const stopVoiceChat = useCallback(() => {
    if (!avatarRef.current) return;

    try {
      avatarRef.current.closeVoiceChat();
      setStatus("connected");
      console.log("Voice chat stopped");
    } catch (err) {
      console.error("Failed to stop voice chat:", err);
    }
  }, []);

  const interrupt = useCallback(() => {
    if (!avatarRef.current) return;

    try {
      avatarRef.current.interrupt();
      setIsAvatarSpeaking(false);
    } catch (err) {
      console.error("Failed to interrupt avatar:", err);
    }
  }, []);

  const endSession = useCallback(async () => {
    if (!avatarRef.current) return;

    try {
      setStatus("disconnected");
      await avatarRef.current.stopAvatar();
      avatarRef.current = null;
      sessionIdRef.current = null;
      setStatus("idle");
      console.log("Avatar session ended");
    } catch (err) {
      console.error("Failed to end avatar session:", err);
    }
  }, []);

  return {
    status,
    videoRef,
    startSession,
    speak,
    startVoiceChat,
    stopVoiceChat,
    interrupt,
    endSession,
    isUserSpeaking,
    isAvatarSpeaking,
    userTranscript,
    error,
  };
}
