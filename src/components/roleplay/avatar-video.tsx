"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2, VideoOff, Mic, MicOff } from "lucide-react";
import type { HeygenAvatarStatus } from "@/types/ai";

interface AvatarVideoProps {
  status: HeygenAvatarStatus;
  isUserSpeaking: boolean;
  isAvatarSpeaking: boolean;
  error?: string | null;
  className?: string;
}

export const AvatarVideo = forwardRef<HTMLVideoElement, AvatarVideoProps>(
  function AvatarVideo(
    { status, isUserSpeaking, isAvatarSpeaking, error, className },
    ref
  ) {
    const isConnecting = status === "connecting";
    const isConnected =
      status === "connected" ||
      status === "speaking" ||
      status === "listening";
    const hasError = status === "error" || !!error;

    return (
      <div
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-xl bg-black",
          className
        )}
      >
        {/* Video element */}
        <video
          ref={ref}
          autoPlay
          playsInline
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            isConnected ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Loading state */}
        {isConnecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <Loader2 className="h-12 w-12 animate-spin text-gold-500" />
            <p className="mt-4 text-sm text-white/70">
              Connecting to AI buyer...
            </p>
          </div>
        )}

        {/* Idle state */}
        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <VideoOff className="h-16 w-16 text-white/30" />
            <p className="mt-4 text-sm text-white/50">
              Ready to start session
            </p>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20">
            <VideoOff className="h-16 w-16 text-red-500" />
            <p className="mt-4 text-sm text-red-400">
              {error || "Connection error"}
            </p>
          </div>
        )}

        {/* Speaking indicators */}
        {isConnected && (
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            {/* Avatar speaking indicator */}
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 transition-all",
                isAvatarSpeaking
                  ? "bg-gold-500/90 text-black"
                  : "bg-black/50 text-white/70"
              )}
            >
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  isAvatarSpeaking ? "animate-pulse bg-black" : "bg-white/50"
                )}
              />
              <span className="text-xs font-medium">
                {isAvatarSpeaking ? "Buyer Speaking" : "Buyer"}
              </span>
            </div>

            {/* User speaking indicator */}
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 transition-all",
                isUserSpeaking
                  ? "bg-blue-500/90 text-white"
                  : "bg-black/50 text-white/70"
              )}
            >
              {isUserSpeaking ? (
                <Mic className="h-3.5 w-3.5 animate-pulse" />
              ) : (
                <MicOff className="h-3.5 w-3.5" />
              )}
              <span className="text-xs font-medium">
                {isUserSpeaking ? "You're Speaking" : "Your Mic"}
              </span>
            </div>
          </div>
        )}

        {/* Connection status badge */}
        {isConnected && (
          <div className="absolute right-4 top-4">
            <div className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-green-400">Live</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);
