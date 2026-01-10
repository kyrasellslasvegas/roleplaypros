"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface SessionTimerProps {
  durationMinutes: number;
  elapsedSeconds: number;
  isPaused: boolean;
  onTick: (seconds: number) => void;
  className?: string;
}

export function SessionTimer({
  durationMinutes,
  elapsedSeconds,
  isPaused,
  onTick,
  className,
}: SessionTimerProps) {
  // Tick every second when not paused
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      onTick(elapsedSeconds + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [elapsedSeconds, isPaused, onTick]);

  const totalSeconds = durationMinutes * 60;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const progress = (elapsedSeconds / totalSeconds) * 100;
  const isLowTime = remainingSeconds <= 60;
  const isOvertime = elapsedSeconds > totalSeconds;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Timer display */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-2",
          isOvertime
            ? "bg-orange-500/10 text-orange-400"
            : isLowTime
            ? "bg-red-500/10 text-red-400"
            : "bg-card text-foreground"
        )}
      >
        <Clock className="h-4 w-4" />
        <span className="font-mono text-lg font-semibold tabular-nums">
          {isOvertime ? (
            <>+{formatTime(elapsedSeconds - totalSeconds)}</>
          ) : (
            formatTime(remainingSeconds)
          )}
        </span>
        {isPaused && (
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Paused
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-all duration-1000 ease-linear",
            isOvertime
              ? "bg-orange-500"
              : isLowTime
              ? "bg-red-500"
              : "bg-primary"
          )}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      {/* Duration label */}
      <span className="text-sm text-muted-foreground">
        {formatTime(elapsedSeconds)} / {durationMinutes}:00
      </span>
    </div>
  );
}
