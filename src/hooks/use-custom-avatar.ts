"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioRecorder } from "@/lib/audio/audio-recorder";
import { AudioPlayer } from "@/lib/audio/audio-player";
import {
  useFallbackSpeech,
  useFallbackSpeechRecognition,
} from "@/components/roleplay/fallback-avatar";
import type {
  AvatarStatus,
  TTSVoice,
  UseCustomAvatarOptions,
  UseCustomAvatarReturn,
  PERSONALITY_VOICE_MAP,
} from "@/types/avatar";

interface UseCustomAvatarOptionsInternal extends UseCustomAvatarOptions {
  personalityVoice?: TTSVoice;
}

export function useCustomAvatar(
  options: UseCustomAvatarOptionsInternal = {}
): UseCustomAvatarReturn {
  const { onUserMessage, onAvatarSpeakingChange, onError, personalityVoice = "nova" } = options;

  // State
  const [status, setStatus] = useState<AvatarStatus>("idle");
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [avatarImageUrl, setAvatarImageUrl] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const voiceRef = useRef<TTSVoice>(personalityVoice);
  const isListeningRef = useRef(false);
  const useOpenAIRef = useRef(true); // Track if OpenAI is available

  // Browser fallback hooks
  const fallbackSpeech = useFallbackSpeech();
  const fallbackRecognition = useFallbackSpeechRecognition((text) => {
    if (text.trim() && useOpenAIRef.current === false) {
      handleUserSpeech(text);
    }
  });

  // Update voice ref when personality changes
  useEffect(() => {
    voiceRef.current = personalityVoice;
  }, [personalityVoice]);

  /**
   * Handle user speech completion
   */
  const handleUserSpeech = useCallback(
    async (audioBlob: Blob | string) => {
      // audioBlob can be Blob (from Whisper) or string (from browser fallback)
      let transcribedText: string;

      if (typeof audioBlob === "string") {
        transcribedText = audioBlob;
      } else {
        // Transcribe using Whisper API
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          const response = await fetch("/api/ai/whisper/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Transcription failed");
          }

          const data = await response.json();
          transcribedText = data.text;
        } catch (err) {
          console.error("Whisper transcription failed:", err);

          // Fall back to browser speech recognition
          if (!useOpenAIRef.current) {
            return; // Already using fallback
          }

          console.log("Falling back to browser speech recognition");
          useOpenAIRef.current = false;
          fallbackRecognition.startListening();
          return;
        }
      }

      if (!transcribedText.trim()) {
        return;
      }

      setUserTranscript(transcribedText);
      onUserMessage?.(transcribedText);
    },
    [onUserMessage, fallbackRecognition]
  );

  /**
   * Start a session
   */
  const startSession = useCallback(
    async (imageUrl?: string) => {
      try {
        setStatus("connecting");
        setError(null);

        // Set avatar image
        setAvatarImageUrl(imageUrl || "/avatars/default-buyer.png");

        // Initialize audio player
        playerRef.current = new AudioPlayer({
          onStart: () => {
            setIsAvatarSpeaking(true);
            onAvatarSpeakingChange?.(true);
          },
          onEnd: () => {
            setIsAvatarSpeaking(false);
            onAvatarSpeakingChange?.(false);
          },
          onError: (err) => {
            console.error("Audio player error:", err);
            setIsAvatarSpeaking(false);
            onAvatarSpeakingChange?.(false);
          },
        });

        // Check if OpenAI recording/TTS is supported
        if (!AudioRecorder.isSupported()) {
          console.log("Audio recording not supported, using browser fallbacks");
          useOpenAIRef.current = false;
        }

        // Test TTS availability
        try {
          const testResponse = await fetch("/api/ai/tts/speak", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: "test", voice: "nova" }),
          });

          if (!testResponse.ok) {
            console.log("OpenAI TTS not available, using browser fallback");
            useOpenAIRef.current = false;
          }
        } catch {
          console.log("OpenAI TTS check failed, using browser fallback");
          useOpenAIRef.current = false;
        }

        setStatus("connected");
        console.log("Custom avatar session started, using OpenAI:", useOpenAIRef.current);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Failed to start custom avatar session:", error);
        setError(error.message);
        setStatus("error");
        onError?.(error);
      }
    },
    [onAvatarSpeakingChange, onError]
  );

  /**
   * Make avatar speak text
   */
  const speak = useCallback(
    async (text: string, emotion?: string) => {
      if (status !== "connected" && status !== "listening" && status !== "speaking") {
        console.warn("Avatar not ready to speak, current status:", status);
        return;
      }

      try {
        setStatus("speaking");
        console.log("Making avatar speak:", text.substring(0, 50) + "...");

        if (useOpenAIRef.current && playerRef.current) {
          // Use OpenAI TTS
          const response = await fetch("/api/ai/tts/speak", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text,
              voice: voiceRef.current,
              speed: 1.0,
            }),
          });

          if (!response.ok) {
            throw new Error("TTS request failed");
          }

          await playerRef.current.playFromResponse(response);
        } else {
          // Use browser TTS fallback
          setIsAvatarSpeaking(true);
          onAvatarSpeakingChange?.(true);
          await fallbackSpeech.speak(text);
          setIsAvatarSpeaking(false);
          onAvatarSpeakingChange?.(false);
        }

        // Resume listening status if we were listening before
        if (isListeningRef.current) {
          setStatus("listening");
        } else {
          setStatus("connected");
        }
      } catch (err) {
        console.error("Failed to make avatar speak:", err);

        // Try browser fallback
        if (useOpenAIRef.current) {
          console.log("Falling back to browser TTS");
          useOpenAIRef.current = false;
          setIsAvatarSpeaking(true);
          onAvatarSpeakingChange?.(true);
          await fallbackSpeech.speak(text);
          setIsAvatarSpeaking(false);
          onAvatarSpeakingChange?.(false);
        }

        setStatus(isListeningRef.current ? "listening" : "connected");
      }
    },
    [status, fallbackSpeech, onAvatarSpeakingChange]
  );

  /**
   * Start voice chat (enable microphone)
   */
  const startVoiceChat = useCallback(async () => {
    if (status !== "connected" && status !== "listening" && status !== "speaking") {
      console.warn("Avatar not connected, cannot start voice chat. Status:", status);
      return;
    }

    try {
      isListeningRef.current = true;
      setStatus("listening");

      if (useOpenAIRef.current) {
        // Use OpenAI Whisper for transcription
        recorderRef.current = new AudioRecorder({
          onSpeechStart: () => {
            setIsUserSpeaking(true);
          },
          onSpeechEnd: async (audioBlob) => {
            setIsUserSpeaking(false);
            await handleUserSpeech(audioBlob);
          },
          onAudioLevel: (level) => {
            setAudioLevel(level);
          },
          onError: (err) => {
            console.error("Audio recorder error:", err);
            setError(err.message);

            // Fall back to browser speech recognition
            if (fallbackRecognition.isSupported) {
              console.log("Falling back to browser speech recognition");
              useOpenAIRef.current = false;
              fallbackRecognition.startListening();
            }
          },
          silenceThreshold: 0.02,
          silenceDuration: 1500,
          minSpeechDuration: 500,
        });

        await recorderRef.current.start();
        console.log("OpenAI voice chat started");
      } else {
        // Use browser speech recognition fallback
        if (fallbackRecognition.isSupported) {
          fallbackRecognition.startListening();
          console.log("Browser speech recognition started");
        } else {
          throw new Error("Speech recognition not supported in this browser");
        }
      }
    } catch (err) {
      console.error("Failed to start voice chat:", err);
      setStatus("connected");
      isListeningRef.current = false;
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message);
      onError?.(error);
    }
  }, [status, handleUserSpeech, fallbackRecognition, onError]);

  /**
   * Stop voice chat (disable microphone)
   */
  const stopVoiceChat = useCallback(() => {
    isListeningRef.current = false;

    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }

    if (fallbackRecognition.isListening) {
      fallbackRecognition.stopListening();
    }

    setIsUserSpeaking(false);
    setAudioLevel(0);
    setStatus("connected");
    console.log("Voice chat stopped");
  }, [fallbackRecognition]);

  /**
   * Interrupt avatar speech
   */
  const interrupt = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stop();
    }

    if (fallbackSpeech.isSpeaking) {
      fallbackSpeech.stop();
    }

    setIsAvatarSpeaking(false);
    onAvatarSpeakingChange?.(false);
  }, [fallbackSpeech, onAvatarSpeakingChange]);

  /**
   * End the session
   */
  const endSession = useCallback(async () => {
    try {
      setStatus("disconnected");

      // Stop recording
      if (recorderRef.current) {
        recorderRef.current.stop();
        recorderRef.current = null;
      }

      // Stop playback
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      // Stop browser fallbacks
      if (fallbackRecognition.isListening) {
        fallbackRecognition.stopListening();
      }

      if (fallbackSpeech.isSpeaking) {
        fallbackSpeech.stop();
      }

      isListeningRef.current = false;
      setIsUserSpeaking(false);
      setIsAvatarSpeaking(false);
      setAudioLevel(0);
      setStatus("idle");
      console.log("Custom avatar session ended");
    } catch (err) {
      console.error("Error ending session:", err);
    }
  }, [fallbackRecognition, fallbackSpeech]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.stop();
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  return {
    status,
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
    avatarImageUrl,
    audioLevel,
  };
}
