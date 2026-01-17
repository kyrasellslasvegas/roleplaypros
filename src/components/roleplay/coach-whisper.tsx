"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Lightbulb, AlertTriangle, Star, X } from "lucide-react";
import type { CoachSuggestion } from "@/types/session";

interface CoachWhisperProps {
  suggestions: CoachSuggestion[];
  onDismiss: (id: string) => void;
  className?: string;
}

export function CoachWhisper({
  suggestions,
  onDismiss,
  className,
}: CoachWhisperProps) {
  // Show only non-dismissed suggestions, most recent first
  const activeSuggestions = suggestions
    .filter((s) => !s.dismissed)
    .slice(-3)
    .reverse();

  return (
    <div className={cn("space-y-2", className)}>
      {activeSuggestions.map((suggestion) => (
        <WhisperCard
          key={suggestion.id}
          suggestion={suggestion}
          onDismiss={() => onDismiss(suggestion.id)}
        />
      ))}
    </div>
  );
}

interface WhisperCardProps {
  suggestion: CoachSuggestion;
  onDismiss: () => void;
}

function WhisperCard({ suggestion, onDismiss }: WhisperCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const getIcon = () => {
    switch (suggestion.type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "praise":
        return <Star className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getStyles = () => {
    // Use hook category for styling if available
    if (suggestion.hookCategory) {
      switch (suggestion.hookCategory) {
        case "fear":
          return "bg-red-500/10 border-red-500/30 text-red-200";
        case "shame":
          return "bg-orange-500/10 border-orange-500/30 text-orange-200";
        case "curiosity":
          return "bg-purple-500/10 border-purple-500/30 text-purple-200";
        case "authority":
          return "bg-blue-500/10 border-blue-500/30 text-blue-200";
        case "drama":
          return "bg-primary/10 border-primary/30 text-primary";
      }
    }
    // Fallback to type-based styling
    switch (suggestion.type) {
      case "warning":
        return "bg-orange-500/10 border-orange-500/30 text-orange-200";
      case "praise":
        return "bg-green-500/10 border-green-500/30 text-green-200";
      default:
        return "bg-blue-500/10 border-blue-500/30 text-blue-200";
    }
  };

  const getIconStyles = () => {
    switch (suggestion.type) {
      case "warning":
        return "text-orange-400";
      case "praise":
        return "text-green-400";
      default:
        return "text-blue-400";
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border p-3 transition-all duration-300",
        getStyles(),
        isVisible && !isLeaving
          ? "translate-x-0 opacity-100"
          : "translate-x-4 opacity-0"
      )}
    >
      <div className="flex items-start gap-2">
        <div className={cn("mt-0.5 shrink-0", getIconStyles())}>{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">
            {suggestion.content}
          </p>
          <p className="mt-1 text-xs opacity-60 capitalize">
            {suggestion.hookCategory ? (
              <span className="font-medium">{suggestion.hookCategory}</span>
            ) : (
              <>Coach {suggestion.type}</>
            )}
          </p>
        </div>
        <button
          type="button"
          title="Dismiss suggestion"
          aria-label="Dismiss suggestion"
          onClick={handleDismiss}
          className="shrink-0 rounded p-1 transition-colors hover:bg-white/10"
        >
          <X className="h-3.5 w-3.5 opacity-60" />
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          className="h-full bg-white/30 transition-all duration-[8000ms] ease-linear"
          style={{
            width: isVisible && !isLeaving ? "0%" : "100%",
          }}
        />
      </div>
    </div>
  );
}
