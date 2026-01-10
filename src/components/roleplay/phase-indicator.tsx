"use client";

import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";
import type { SessionPhase } from "@/types/session";

interface PhaseIndicatorProps {
  currentPhase: SessionPhase;
  className?: string;
}

const phases: { id: SessionPhase; label: string; shortLabel: string }[] = [
  { id: "rapport", label: "Building Rapport", shortLabel: "Rapport" },
  { id: "money_questions", label: "Questions About Money", shortLabel: "Money" },
  { id: "deep_questions", label: "Deep Questions", shortLabel: "Deep" },
  { id: "frame", label: "Frame", shortLabel: "Frame" },
  { id: "close", label: "Close", shortLabel: "Close" },
];

export function PhaseIndicator({ currentPhase, className }: PhaseIndicatorProps) {
  const currentIndex = phases.findIndex((p) => p.id === currentPhase);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {phases.map((phase, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = phase.id === currentPhase;
        const isFuture = index > currentIndex;

        return (
          <div key={phase.id} className="flex items-center">
            {/* Phase indicator */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all",
                  isComplete && "bg-green-500 text-white",
                  isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
                  isFuture && "bg-muted text-muted-foreground"
                )}
              >
                {isComplete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-1 text-[10px] font-medium whitespace-nowrap",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}
              >
                {phase.shortLabel}
              </span>
            </div>

            {/* Connector line */}
            {index < phases.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 w-6 transition-colors",
                  index < currentIndex ? "bg-green-500" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Compact version for mobile/header
export function PhaseIndicatorCompact({ currentPhase, className }: PhaseIndicatorProps) {
  const currentIndex = phases.findIndex((p) => p.id === currentPhase);
  const current = phases[currentIndex];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        {phases.map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 w-6 rounded-full transition-colors",
              index < currentIndex && "bg-green-500",
              index === currentIndex && "bg-primary",
              index > currentIndex && "bg-muted"
            )}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-primary">
        {current?.label}
      </span>
    </div>
  );
}
