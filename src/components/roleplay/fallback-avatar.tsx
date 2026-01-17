"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Volume2, VolumeX, User } from "lucide-react";

interface FallbackAvatarProps {
  isAvatarSpeaking: boolean;
  isUserSpeaking: boolean;
  isMicActive: boolean;
  className?: string;
}

export function FallbackAvatar({
  isAvatarSpeaking,
  isUserSpeaking,
  isMicActive,
  className,
}: FallbackAvatarProps) {
  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
        className
      )}
    >
      {/* Animated background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        {isAvatarSpeaking && (
          <div className="absolute inset-0 animate-pulse bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-500/10 via-transparent to-transparent" />
        )}
      </div>

      {/* Avatar placeholder */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Avatar circle */}
        <div
          className={cn(
            "relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800 shadow-2xl transition-all duration-300",
            isAvatarSpeaking && "ring-4 ring-green-500/50 scale-105"
          )}
        >
          <User className="h-16 w-16 text-slate-400" />

          {/* Speaking animation rings */}
          {isAvatarSpeaking && (
            <>
              <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
              <div className="absolute -inset-2 animate-pulse rounded-full border-2 border-green-500/30" />
              <div className="absolute -inset-4 animate-pulse rounded-full border border-green-500/20" style={{ animationDelay: "150ms" }} />
            </>
          )}
        </div>

        {/* Status text */}
        <div className="mt-6 text-center">
          <p className="text-lg font-medium text-white">
            {isAvatarSpeaking ? "AI Buyer Speaking..." : "AI Buyer"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Browser Speech Mode
          </p>
        </div>

        {/* Audio visualization bars */}
        {isAvatarSpeaking && (
          <div className="mt-4 flex items-end justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-green-500 rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 20 + 10}px`,
                  animationDelay: `${i * 100}ms`,
                  animationDuration: "300ms",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Speaking indicators */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        {/* Avatar speaking indicator */}
        <div
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1.5 transition-all",
            isAvatarSpeaking
              ? "bg-green-500/90 text-white"
              : "bg-black/50 text-white/70"
          )}
        >
          {isAvatarSpeaking ? (
            <Volume2 className="h-4 w-4 animate-pulse" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
          <span className="text-xs font-medium">
            {isAvatarSpeaking ? "Speaking" : "Buyer"}
          </span>
        </div>

        {/* User speaking indicator */}
        <div
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1.5 transition-all",
            isUserSpeaking
              ? "bg-blue-500/90 text-white"
              : isMicActive
              ? "bg-green-600/80 text-white"
              : "bg-black/50 text-white/70"
          )}
        >
          {isUserSpeaking ? (
            <Mic className="h-3.5 w-3.5 animate-pulse" />
          ) : isMicActive ? (
            <Mic className="h-3.5 w-3.5" />
          ) : (
            <MicOff className="h-3.5 w-3.5" />
          )}
          <span className="text-xs font-medium">
            {isUserSpeaking ? "You're Speaking" : isMicActive ? "Mic Active" : "Mic Off"}
          </span>
        </div>
      </div>

      {/* Connection status badge */}
      <div className="absolute right-4 top-4">
        <div className="flex items-center gap-1.5 rounded-full bg-yellow-500/20 px-2.5 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
          <span className="text-xs font-medium text-yellow-400">Fallback</span>
        </div>
      </div>
    </div>
  );
}

// Hook for browser-based text-to-speech fallback
export function useFallbackSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      // Configure voice settings
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => v.name.includes("Samantha") || v.name.includes("Google") || v.name.includes("Female")
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Load voices on mount
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return { speak, stop, isSpeaking };
}

// Hook for browser-based speech recognition fallback
export function useFallbackSpeechRecognition(onMessage: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const text = lastResult[0].transcript.trim();
          if (text) {
            onMessage(text);
          }
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Auto-restart if still supposed to be listening
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {
            // Already started or stopped
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Already stopped
        }
        recognitionRef.current = null;
      }
    };
  }, [onMessage]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start speech recognition:", e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Already stopped
      }
      setIsListening(false);
    }
  }, []);

  return { startListening, stopListening, isListening, isSupported };
}
