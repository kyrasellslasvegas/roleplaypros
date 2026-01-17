"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Volume2, VolumeX, User, Loader2 } from "lucide-react";
import type { AvatarStatus } from "@/types/avatar";

interface CustomAvatarProps {
  status: AvatarStatus;
  isAvatarSpeaking: boolean;
  isUserSpeaking: boolean;
  isMicActive: boolean;
  avatarImageUrl?: string | null;
  audioLevel?: number;
  error?: string | null;
  className?: string;
}

export function CustomAvatar({
  status,
  isAvatarSpeaking,
  isUserSpeaking,
  isMicActive,
  avatarImageUrl,
  audioLevel = 0,
  error,
  className,
}: CustomAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Generate dynamic speaking bars based on audio level
  const speakingBars = useMemo(() => {
    return [...Array(7)].map((_, i) => ({
      height: isAvatarSpeaking
        ? Math.random() * 30 + 10 + (audioLevel * 50)
        : 4,
      delay: i * 75,
    }));
  }, [isAvatarSpeaking, audioLevel]);

  // Reset image state when URL changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [avatarImageUrl]);

  const showImage = avatarImageUrl && imageLoaded && !imageError;

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

        {/* Speaking pulse effect */}
        {isAvatarSpeaking && (
          <div className="absolute inset-0 animate-pulse bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-500/10 via-transparent to-transparent" />
        )}

        {/* User speaking pulse effect */}
        {isUserSpeaking && (
          <div className="absolute inset-0 animate-pulse bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
        )}
      </div>

      {/* Avatar image or placeholder */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Avatar circle container */}
        <div
          className={cn(
            "relative flex h-40 w-40 items-center justify-center rounded-full shadow-2xl transition-all duration-300 overflow-hidden",
            isAvatarSpeaking && "ring-4 ring-green-500/50 scale-105",
            isUserSpeaking && "ring-4 ring-blue-500/50"
          )}
        >
          {/* Preload image */}
          {avatarImageUrl && (
            <img
              src={avatarImageUrl}
              alt="AI Buyer Avatar"
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
                showImage ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}

          {/* Fallback placeholder */}
          {!showImage && (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
              <User className="h-20 w-20 text-slate-400" />
            </div>
          )}

          {/* Speaking animation rings */}
          {isAvatarSpeaking && (
            <>
              <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20 pointer-events-none" />
              <div className="absolute -inset-2 animate-pulse rounded-full border-2 border-green-500/30 pointer-events-none" />
              <div
                className="absolute -inset-4 animate-pulse rounded-full border border-green-500/20 pointer-events-none"
                style={{ animationDelay: "150ms" }}
              />
            </>
          )}

          {/* User speaking animation rings */}
          {isUserSpeaking && !isAvatarSpeaking && (
            <>
              <div className="absolute -inset-2 animate-pulse rounded-full border-2 border-blue-500/30 pointer-events-none" />
            </>
          )}
        </div>

        {/* Status text */}
        <div className="mt-6 text-center">
          <p className="text-lg font-medium text-white">
            {status === "connecting" && "Connecting..."}
            {status === "error" && "Connection Error"}
            {status === "disconnected" && "Disconnected"}
            {status === "connected" && !isAvatarSpeaking && "AI Buyer Ready"}
            {status === "listening" && !isAvatarSpeaking && "Listening..."}
            {status === "speaking" && "AI Buyer Speaking..."}
            {isAvatarSpeaking && status !== "speaking" && "AI Buyer Speaking..."}
          </p>
          {error && (
            <p className="mt-1 text-sm text-red-400 max-w-md mx-auto">
              {error}
            </p>
          )}
        </div>

        {/* Audio visualization bars */}
        {isAvatarSpeaking && (
          <div className="mt-4 flex items-end justify-center gap-1 h-10">
            {speakingBars.map((bar, i) => (
              <div
                key={i}
                className="w-1.5 bg-green-500 rounded-full transition-all duration-100"
                style={{
                  height: `${bar.height}px`,
                  animationDelay: `${bar.delay}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* Audio level indicator when listening */}
        {isMicActive && !isAvatarSpeaking && (
          <div className="mt-4 flex items-end justify-center gap-1 h-10">
            {[...Array(7)].map((_, i) => {
              const barHeight = Math.max(4, audioLevel * 100 * (0.5 + Math.random() * 0.5));
              return (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 rounded-full transition-all duration-75",
                    isUserSpeaking ? "bg-blue-500" : "bg-slate-600"
                  )}
                  style={{
                    height: `${isUserSpeaking ? barHeight : 4}px`,
                  }}
                />
              );
            })}
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
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1",
            status === "connected" || status === "listening" || status === "speaking"
              ? "bg-green-500/20"
              : status === "connecting"
              ? "bg-yellow-500/20"
              : status === "error"
              ? "bg-red-500/20"
              : "bg-slate-500/20"
          )}
        >
          {status === "connecting" && (
            <Loader2 className="h-3 w-3 animate-spin text-yellow-400" />
          )}
          {(status === "connected" || status === "listening" || status === "speaking") && (
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          )}
          {status === "error" && (
            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
          )}
          {(status === "idle" || status === "disconnected") && (
            <div className="h-1.5 w-1.5 rounded-full bg-slate-500" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              status === "connected" || status === "listening" || status === "speaking"
                ? "text-green-400"
                : status === "connecting"
                ? "text-yellow-400"
                : status === "error"
                ? "text-red-400"
                : "text-slate-400"
            )}
          >
            {status === "connecting" && "Connecting"}
            {status === "connected" && "Connected"}
            {status === "listening" && "Listening"}
            {status === "speaking" && "Speaking"}
            {status === "error" && "Error"}
            {status === "idle" && "Idle"}
            {status === "disconnected" && "Disconnected"}
          </span>
        </div>
      </div>
    </div>
  );
}
