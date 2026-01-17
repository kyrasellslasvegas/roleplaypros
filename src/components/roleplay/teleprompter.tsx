"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  HelpCircle,
  ArrowRight,
  Lightbulb,
  RefreshCw,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { phaseScripts } from "@/lib/ai/prompts/teleprompter-prompts";
import type {
  SessionPhase,
  BuyerProfile,
  TranscriptEntry,
} from "@/types/session";

interface TeleprompterProps {
  currentPhase: SessionPhase;
  buyerProfile: BuyerProfile;
  transcript: TranscriptEntry[];
  onAdvancePhase?: () => void;
  className?: string;
}

interface StaticSuggestion {
  type: "question" | "response" | "transition" | "opener";
  text: string;
}

export function Teleprompter({
  currentPhase,
  buyerProfile,
  transcript,
  onAdvancePhase,
  className,
}: TeleprompterProps) {
  const [suggestions, setSuggestions] = useState<StaticSuggestion[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const script = phaseScripts[currentPhase];

  // Get static suggestions based on phase and transcript progress
  const refreshSuggestions = useCallback(() => {
    setSuggestions(getStaticSuggestions(currentPhase, transcript.length));
  }, [currentPhase, transcript.length]);

  // Update suggestions when phase or transcript changes
  useEffect(() => {
    if (transcript.length === 0) {
      // Show openers at the start
      setSuggestions(
        script.openers.slice(0, 3).map((text) => ({
          type: "opener" as const,
          text,
        }))
      );
    } else {
      setSuggestions(getStaticSuggestions(currentPhase, transcript.length));
    }
  }, [transcript.length, currentPhase, script.openers]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "question":
        return <HelpCircle className="h-3.5 w-3.5" />;
      case "transition":
        return <ArrowRight className="h-3.5 w-3.5" />;
      default:
        return <MessageSquare className="h-3.5 w-3.5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "question":
        return "Ask";
      case "transition":
        return "Move to next";
      case "opener":
        return "Start with";
      default:
        return "Say";
    }
  };

  if (isCollapsed) {
    return (
      <div className={cn("rounded-lg border border-border bg-card", className)}>
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Teleprompter</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {script.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshSuggestions}
            className="h-7 w-7 p-0"
            title="Shuffle suggestions"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="h-7 w-7 p-0"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Goal */}
      <div className="border-b border-border bg-primary/5 px-4 py-2">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-primary">Goal:</span> {script.goal}
        </p>
      </div>

      {/* Suggestions */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="group rounded-lg border border-border bg-background p-3 transition-colors hover:border-gold-500/50 hover:bg-primary/5"
          >
            <div className="flex items-start gap-2">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gold-500/10 text-primary">
                {getTypeIcon(suggestion.type)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
                  {getTypeLabel(suggestion.type)}
                </span>
                <p className="mt-0.5 text-sm text-foreground leading-relaxed">
                  "{suggestion.text}"
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips toggle */}
      <div className="border-t border-border">
        <button
          onClick={() => setShowTips(!showTips)}
          className="flex w-full items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <span>Tips for this phase</span>
          {showTips ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>

        {showTips && (
          <div className="px-4 pb-3 space-y-1">
            {script.tips.map((tip, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <span className="text-primary">•</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phase transition button */}
      {onAdvancePhase && transcript.length >= 4 && (
        <div className="border-t border-border p-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onAdvancePhase}
            className="w-full gap-2 border-gold-500/50 text-primary hover:bg-gold-500/10"
          >
            <ArrowRight className="h-4 w-4" />
            Ready for next phase
          </Button>
        </div>
      )}
    </div>
  );
}

// Static suggestions based on phase scripts
function getStaticSuggestions(
  phase: SessionPhase,
  messageCount: number
): StaticSuggestion[] {
  const script = phaseScripts[phase];

  // Helper to shuffle and pick random items
  const shuffle = <T,>(arr: T[]): T[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  if (messageCount === 0) {
    // Show openers at the start
    return shuffle(script.openers).slice(0, 3).map((text) => ({
      type: "opener" as const,
      text,
    }));
  }

  if (messageCount >= 6) {
    // Show transitions when ready to move to next phase
    const suggestions: StaticSuggestion[] = [];

    // Add 1-2 transitions
    shuffle(script.transitions).slice(0, 2).forEach((text) => {
      suggestions.push({ type: "transition" as const, text });
    });

    // Add 1 question
    const randomQuestion = shuffle(script.questions)[0];
    if (randomQuestion) {
      suggestions.push({ type: "question" as const, text: randomQuestion });
    }

    return suggestions;
  }

  // Show questions during the phase
  return shuffle(script.questions).slice(0, 3).map((text) => ({
    type: "question" as const,
    text,
  }));
}
