"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SessionCountdownProps {
  onComplete: () => void;
  className?: string;
}

export function SessionCountdown({ onComplete, className }: SessionCountdownProps) {
  const [count, setCount] = useState(3);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (count === 0) {
      // Small delay before completing to show "GO!"
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(completeTimer);
    }

    const timer = setTimeout(() => {
      setIsAnimating(false);
      // Brief pause before next number
      setTimeout(() => {
        setCount(count - 1);
        setIsAnimating(true);
      }, 100);
    }, 900);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 rounded-xl",
      className
    )}>
      <div className="text-center">
        {/* Countdown number or GO! */}
        <div className={cn(
          "transition-all duration-300",
          isAnimating ? "scale-100 opacity-100" : "scale-150 opacity-0"
        )}>
          {count > 0 ? (
            <span className="text-9xl font-black text-white drop-shadow-[0_0_30px_rgba(34,197,94,0.5)]">
              {count}
            </span>
          ) : (
            <span className="text-8xl font-black text-green-500 drop-shadow-[0_0_30px_rgba(34,197,94,0.8)]">
              GO!
            </span>
          )}
        </div>

        {/* Subtitle text */}
        <p className={cn(
          "mt-4 text-lg text-white/70 transition-opacity duration-300",
          count > 0 ? "opacity-100" : "opacity-0"
        )}>
          {count === 3 && "Get ready..."}
          {count === 2 && "Take a breath..."}
          {count === 1 && "Here we go..."}
        </p>

        {/* Mic activation hint */}
        <p className={cn(
          "mt-2 text-sm text-white/50 transition-opacity duration-300",
          count === 1 ? "opacity-100" : "opacity-0"
        )}>
          Your microphone will activate automatically
        </p>
      </div>

      {/* Animated ring */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center pointer-events-none",
        isAnimating ? "opacity-100" : "opacity-0"
      )}>
        <div className={cn(
          "w-64 h-64 rounded-full border-4 border-green-500/30",
          "animate-ping"
        )} />
      </div>
    </div>
  );
}
