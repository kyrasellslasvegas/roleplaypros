"use client";

import { cn } from "@/lib/utils";
import { Flame, Snowflake } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StreakIndicatorProps {
  currentStreak: number;
  longestStreak?: number;
  lastPracticeDate?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

export function StreakIndicator({
  currentStreak,
  longestStreak,
  lastPracticeDate,
  className,
  size = "md",
  showTooltip = true,
}: StreakIndicatorProps) {
  const today = new Date().toISOString().split("T")[0];
  const practicedToday = lastPracticeDate?.split("T")[0] === today;

  // Determine streak intensity (affects flame animation/color)
  const getStreakIntensity = () => {
    if (currentStreak >= 30) return "legendary";
    if (currentStreak >= 14) return "blazing";
    if (currentStreak >= 7) return "hot";
    if (currentStreak >= 3) return "warm";
    return "starting";
  };

  const intensity = getStreakIntensity();

  const intensityStyles = {
    legendary: {
      flame: "text-purple-500",
      bg: "bg-purple-500/20",
      border: "border-purple-500/50",
      glow: "shadow-purple-500/50",
      animate: "animate-pulse",
    },
    blazing: {
      flame: "text-orange-500",
      bg: "bg-orange-500/20",
      border: "border-orange-500/50",
      glow: "shadow-orange-500/50",
      animate: "animate-pulse",
    },
    hot: {
      flame: "text-primary",
      bg: "bg-primary/20",
      border: "border-primary/50",
      glow: "shadow-primary/10",
      animate: "",
    },
    warm: {
      flame: "text-yellow-500",
      bg: "bg-yellow-500/20",
      border: "border-yellow-500/50",
      glow: "",
      animate: "",
    },
    starting: {
      flame: "text-gray-400",
      bg: "bg-gray-500/20",
      border: "border-gray-500/50",
      glow: "",
      animate: "",
    },
  };

  const style = intensityStyles[intensity];

  const sizeClasses = {
    sm: {
      container: "gap-1 px-2 py-1",
      icon: "h-3 w-3",
      text: "text-xs",
    },
    md: {
      container: "gap-1.5 px-3 py-1.5",
      icon: "h-4 w-4",
      text: "text-sm",
    },
    lg: {
      container: "gap-2 px-4 py-2",
      icon: "h-5 w-5",
      text: "text-base",
    },
  };

  const sizes = sizeClasses[size];

  const content = (
    <div
      className={cn(
        "inline-flex items-center rounded-full border",
        sizes.container,
        style.bg,
        style.border,
        style.glow && `shadow-lg ${style.glow}`,
        className
      )}
    >
      {currentStreak > 0 ? (
        <Flame className={cn(sizes.icon, style.flame, style.animate)} />
      ) : (
        <Snowflake className={cn(sizes.icon, "text-blue-400")} />
      )}
      <span className={cn("font-semibold", sizes.text)}>
        {currentStreak} {currentStreak === 1 ? "day" : "days"}
      </span>
    </div>
  );

  if (!showTooltip) return content;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-semibold">
              {currentStreak > 0 ? `${currentStreak}-day streak!` : "No active streak"}
            </p>
            {longestStreak !== undefined && longestStreak > 0 && (
              <p className="text-muted-foreground">
                Longest: {longestStreak} days
              </p>
            )}
            <p className="text-muted-foreground mt-1">
              {practicedToday
                ? "Practiced today"
                : "Practice today to keep your streak!"}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Minimal version for sidebar
export function StreakIndicatorMinimal({
  currentStreak,
  className,
}: {
  currentStreak: number;
  className?: string;
}) {
  const hasStreak = currentStreak > 0;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {hasStreak ? (
        <Flame className="h-3.5 w-3.5 text-primary" />
      ) : (
        <Snowflake className="h-3.5 w-3.5 text-blue-400" />
      )}
      <span className="text-xs font-medium">{currentStreak}</span>
    </div>
  );
}
