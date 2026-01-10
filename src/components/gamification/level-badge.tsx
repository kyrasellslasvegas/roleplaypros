"use client";

import { cn } from "@/lib/utils";
import { getLevelTitle, getLevelTier } from "@/lib/gamification";
import { Crown, Star, Zap, Shield } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LevelBadgeProps {
  level: number;
  totalXp?: number;
  size?: "sm" | "md" | "lg" | "xl";
  showTooltip?: boolean;
  className?: string;
}

export function LevelBadge({
  level,
  totalXp,
  size = "md",
  showTooltip = true,
  className,
}: LevelBadgeProps) {
  const tier = getLevelTier(level);
  const title = getLevelTitle(level);

  const tierStyles = {
    bronze: {
      bg: "bg-gradient-to-br from-orange-500/20 to-orange-600/20",
      border: "border-orange-500/50",
      text: "text-orange-400",
      icon: Crown,
      iconColor: "text-orange-500",
    },
    silver: {
      bg: "bg-gradient-to-br from-gray-400/20 to-gray-500/20",
      border: "border-gray-400/50",
      text: "text-gray-300",
      icon: Star,
      iconColor: "text-gray-400",
    },
    gold: {
      bg: "bg-gradient-to-br from-primary/20 to-primary/20",
      border: "border-primary/50",
      text: "text-primary",
      icon: Zap,
      iconColor: "text-primary",
    },
    platinum: {
      bg: "bg-gradient-to-br from-purple-500/20 to-purple-600/20",
      border: "border-purple-500/50",
      text: "text-purple-300",
      icon: Shield,
      iconColor: "text-purple-400",
    },
  };

  const style = tierStyles[tier];
  const IconComponent = style.icon;

  const sizeClasses = {
    sm: {
      container: "px-2 py-1 gap-1",
      icon: "h-3 w-3",
      text: "text-xs",
    },
    md: {
      container: "px-3 py-1.5 gap-1.5",
      icon: "h-4 w-4",
      text: "text-sm",
    },
    lg: {
      container: "px-4 py-2 gap-2",
      icon: "h-5 w-5",
      text: "text-base",
    },
    xl: {
      container: "px-5 py-2.5 gap-2",
      icon: "h-6 w-6",
      text: "text-lg",
    },
  };

  const sizes = sizeClasses[size];

  const badge = (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border",
        style.bg,
        style.border,
        sizes.container,
        className
      )}
    >
      <IconComponent className={cn(sizes.icon, style.iconColor)} />
      <span className={cn("font-bold", style.text, sizes.text)}>
        Lvl {level}
      </span>
    </div>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-semibold">{title}</p>
            <p className="text-muted-foreground capitalize">{tier} Tier</p>
            {totalXp !== undefined && (
              <p className="text-primary">{totalXp.toLocaleString()} Total XP</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Large showcase version for profile/achievements page
export function LevelShowcase({
  level,
  totalXp,
  title,
  className,
}: {
  level: number;
  totalXp: number;
  title?: string;
  className?: string;
}) {
  const tier = getLevelTier(level);
  const levelTitle = title || getLevelTitle(level);

  const tierStyles = {
    bronze: {
      ring: "ring-orange-500/50",
      bg: "bg-gradient-to-br from-orange-500/30 to-orange-600/30",
      text: "text-orange-400",
      glow: "shadow-orange-500/30",
    },
    silver: {
      ring: "ring-gray-400/50",
      bg: "bg-gradient-to-br from-gray-400/30 to-gray-500/30",
      text: "text-gray-300",
      glow: "shadow-gray-400/30",
    },
    gold: {
      ring: "ring-primary/50",
      bg: "bg-gradient-to-br from-primary/30 to-primary/30",
      text: "text-primary",
      glow: "shadow-primary/10",
    },
    platinum: {
      ring: "ring-purple-500/50",
      bg: "bg-gradient-to-br from-purple-500/30 to-purple-600/30",
      text: "text-purple-300",
      glow: "shadow-purple-500/30",
    },
  };

  const style = tierStyles[tier];

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center w-24 h-24 rounded-full ring-4",
          style.ring,
          style.bg,
          style.glow,
          "shadow-lg"
        )}
      >
        <span className={cn("text-4xl font-bold", style.text)}>{level}</span>
        <div
          className={cn(
            "absolute -bottom-1 px-2 py-0.5 rounded-full text-xs font-semibold uppercase",
            style.bg,
            style.text
          )}
        >
          {tier}
        </div>
      </div>
      <div className="text-center">
        <p className="font-semibold text-lg">{levelTitle}</p>
        <p className="text-sm text-muted-foreground">
          {totalXp.toLocaleString()} XP
        </p>
      </div>
    </div>
  );
}
