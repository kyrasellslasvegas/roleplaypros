"use client";

import { cn } from "@/lib/utils";
import { getTierColors } from "@/lib/gamification";
import { Lock, Check } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { AchievementWithProgress, AchievementTier } from "@/types/gamification";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AchievementBadgeProps {
  achievement: AchievementWithProgress;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

export function AchievementBadge({
  achievement,
  size = "md",
  showTooltip = true,
  className,
}: AchievementBadgeProps) {
  const colors = getTierColors(achievement.tier);
  const IconComponent = getIconComponent(achievement.iconName);

  const sizeClasses = {
    sm: {
      container: "w-12 h-12",
      icon: "h-5 w-5",
      lock: "h-3 w-3",
    },
    md: {
      container: "w-16 h-16",
      icon: "h-7 w-7",
      lock: "h-4 w-4",
    },
    lg: {
      container: "w-20 h-20",
      icon: "h-9 w-9",
      lock: "h-5 w-5",
    },
  };

  const sizes = sizeClasses[size];

  const badge = (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl border-2 transition-all",
        sizes.container,
        achievement.unlocked
          ? cn(colors.bg, colors.border, "shadow-lg")
          : "bg-muted/50 border-muted-foreground/20 opacity-60",
        className
      )}
    >
      {achievement.unlocked ? (
        <>
          <IconComponent className={cn(sizes.icon, colors.icon)} />
          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
            <Check className="h-2.5 w-2.5 text-white" />
          </div>
        </>
      ) : (
        <>
          <IconComponent className={cn(sizes.icon, "text-muted-foreground/40")} />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
            <Lock className={cn(sizes.lock, "text-muted-foreground")} />
          </div>
          {/* Progress ring for partial progress */}
          {achievement.progress !== undefined && achievement.progress > 0 && (
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                className="text-muted stroke-current"
                strokeWidth="4"
                fill="transparent"
                r="45"
                cx="50"
                cy="50"
              />
              <circle
                className={cn("stroke-current", colors.text)}
                strokeWidth="4"
                strokeLinecap="round"
                fill="transparent"
                r="45"
                cx="50"
                cy="50"
                strokeDasharray={`${achievement.progress * 2.83} 283`}
              />
            </svg>
          )}
        </>
      )}
    </div>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{achievement.name}</span>
              <TierBadge tier={achievement.tier} />
            </div>
            <p className="text-sm text-muted-foreground">
              {achievement.description}
            </p>
            {!achievement.unlocked && achievement.progressText && (
              <p className="text-xs text-muted-foreground">
                Progress: {achievement.progressText}
              </p>
            )}
            {achievement.unlocked && achievement.unlockedAt && (
              <p className="text-xs text-green-500">
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </p>
            )}
            <p className="text-xs font-medium text-primary">
              +{achievement.xpReward} XP
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Small tier badge
function TierBadge({ tier }: { tier: AchievementTier }) {
  const colors = getTierColors(tier);
  return (
    <span
      className={cn(
        "text-[10px] px-1.5 py-0.5 rounded-full uppercase font-semibold",
        colors.bg,
        colors.text
      )}
    >
      {tier}
    </span>
  );
}

// Get Lucide icon component by name
function getIconComponent(iconName: string): React.ComponentType<{ className?: string }> {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  return icons[iconName] || icons.Award;
}

// Achievement card for full display
export function AchievementCard({
  achievement,
  className,
}: {
  achievement: AchievementWithProgress;
  className?: string;
}) {
  const colors = getTierColors(achievement.tier);
  const IconComponent = getIconComponent(achievement.iconName);

  return (
    <div
      className={cn(
        "relative flex items-start gap-4 rounded-lg border p-4 transition-all",
        achievement.unlocked
          ? cn(colors.bg, colors.border)
          : "bg-muted/30 border-muted-foreground/20 opacity-75",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-lg p-3",
          achievement.unlocked ? colors.bg : "bg-muted"
        )}
      >
        <IconComponent
          className={cn(
            "h-6 w-6",
            achievement.unlocked ? colors.icon : "text-muted-foreground/50"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold truncate">{achievement.name}</h4>
          <TierBadge tier={achievement.tier} />
          {achievement.unlocked && (
            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {achievement.description}
        </p>

        {!achievement.unlocked && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{achievement.progressText}</span>
              <span>{achievement.progress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", colors.bg)}
                style={{ width: `${achievement.progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-primary font-medium">
            +{achievement.xpReward} XP
          </span>
          {achievement.unlocked && achievement.unlockedAt && (
            <span className="text-xs text-muted-foreground">
              {new Date(achievement.unlockedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {!achievement.unlocked && (
        <Lock className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
      )}
    </div>
  );
}
