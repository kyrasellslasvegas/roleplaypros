"use client";

import { cn } from "@/lib/utils";
import { getLevelTitle, getLevelTier } from "@/lib/gamification";
import { Zap } from "lucide-react";

interface XpProgressBarProps {
  currentXp: number;
  xpToNextLevel: number;
  currentLevel: number;
  xpProgress: number; // XP earned towards current level
  className?: string;
  showDetails?: boolean;
  size?: "sm" | "md" | "lg";
}

export function XpProgressBar({
  currentXp,
  xpToNextLevel,
  currentLevel,
  xpProgress,
  className,
  showDetails = true,
  size = "md",
}: XpProgressBarProps) {
  const progressPercent = xpToNextLevel > 0
    ? Math.min(100, Math.round((xpProgress / (xpProgress + xpToNextLevel)) * 100))
    : 100;

  const levelTitle = getLevelTitle(currentLevel);
  const tier = getLevelTier(currentLevel);

  const tierColors = {
    bronze: "from-orange-500 to-orange-600",
    silver: "from-gray-400 to-gray-500",
    gold: "from-primary to-primary",
    platinum: "from-purple-500 to-purple-600",
  };

  const tierBgColors = {
    bronze: "bg-orange-500/20",
    silver: "bg-gray-400/20",
    gold: "bg-primary/20",
    platinum: "bg-purple-500/20",
  };

  const sizeClasses = {
    sm: {
      bar: "h-2",
      text: "text-xs",
      icon: "h-3 w-3",
      padding: "p-2",
    },
    md: {
      bar: "h-3",
      text: "text-sm",
      icon: "h-4 w-4",
      padding: "p-3",
    },
    lg: {
      bar: "h-4",
      text: "text-base",
      icon: "h-5 w-5",
      padding: "p-4",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn("w-full", className)}>
      {showDetails && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center justify-center rounded-lg",
                tierBgColors[tier],
                sizes.padding
              )}
            >
              <span className={cn("font-bold", sizes.text)}>
                Lvl {currentLevel}
              </span>
            </div>
            <span className={cn("text-muted-foreground", sizes.text)}>
              {levelTitle}
            </span>
          </div>
          <div className={cn("flex items-center gap-1 text-muted-foreground", sizes.text)}>
            <Zap className={cn(sizes.icon, "text-primary")} />
            <span>{currentXp.toLocaleString()} XP</span>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className={cn("w-full bg-muted rounded-full overflow-hidden", sizes.bar)}>
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out",
            tierColors[tier]
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {showDetails && (
        <div className={cn("flex justify-between mt-1 text-muted-foreground", sizes.text)}>
          <span>{xpProgress.toLocaleString()} / {(xpProgress + xpToNextLevel).toLocaleString()}</span>
          <span>{xpToNextLevel.toLocaleString()} XP to Level {currentLevel + 1}</span>
        </div>
      )}
    </div>
  );
}

// Compact version for sidebar/header
export function XpProgressBarCompact({
  currentXp,
  xpToNextLevel,
  currentLevel,
  xpProgress,
  className,
}: Omit<XpProgressBarProps, "showDetails" | "size">) {
  const progressPercent = xpToNextLevel > 0
    ? Math.min(100, Math.round((xpProgress / (xpProgress + xpToNextLevel)) * 100))
    : 100;

  const tier = getLevelTier(currentLevel);

  const tierColors = {
    bronze: "from-orange-500 to-orange-600",
    silver: "from-gray-400 to-gray-500",
    gold: "from-primary to-primary",
    platinum: "from-purple-500 to-purple-600",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs font-bold text-muted-foreground">
        {currentLevel}
      </span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-300",
            tierColors[tier]
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">
        {currentLevel + 1}
      </span>
    </div>
  );
}
