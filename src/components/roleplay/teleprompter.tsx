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
  TeleprompterSuggestion,
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

interface DynamicSuggestion {
  type: "question" | "response" | "transition" | "opener";
  text: string;
  isLoading?: boolean;
}

export function Teleprompter({
  currentPhase,
  buyerProfile,
  transcript,
  onAdvancePhase,
  className,
}: TeleprompterProps) {
  const [suggestions, setSuggestions] = useState<DynamicSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const script = phaseScripts[currentPhase];

  // Fetch dynamic suggestions from AI
  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/teleprompter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: currentPhase,
          buyerProfile,
          transcript: transcript.slice(-6),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } else {
        // Fallback to static suggestions
        setSuggestions(getStaticSuggestions(currentPhase, transcript.length));
      }
    } catch (error) {
      console.error("Failed to fetch teleprompter suggestions:", error);
      setSuggestions(getStaticSuggestions(currentPhase, transcript.length));
    } finally {
      setIsLoading(false);
    }
  }, [currentPhase, buyerProfile, transcript]);

  // Fetch suggestions when transcript changes (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (transcript.length > 0) {
        fetchSuggestions();
      } else {
        // Show openers at the start
        setSuggestions(
          script.openers.slice(0, 3).map((text) => ({
            type: "opener" as const,
            text,
          }))
        );
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [transcript.length, currentPhase, fetchSuggestions, script.openers]);

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
            onClick={fetchSuggestions}
            disabled={isLoading}
            className="h-7 w-7 p-0"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
            />
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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          suggestions.map((suggestion, index) => (
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
          ))
        )}
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

// Fallback static suggestions
function getStaticSuggestions(
  phase: SessionPhase,
  messageCount: number
): DynamicSuggestion[] {
  const script = phaseScripts[phase];

  if (messageCount === 0) {
    return script.openers.slice(0, 3).map((text) => ({
      type: "opener" as const,
      text,
    }));
  }

  if (messageCount >= 6) {
    return [
      ...script.transitions.slice(0, 2).map((text) => ({
        type: "transition" as const,
        text,
      })),
      {
        type: "question" as const,
        text: script.questions[Math.floor(Math.random() * script.questions.length)],
      },
    ];
  }

  return script.questions.slice(0, 3).map((text) => ({
    type: "question" as const,
    text,
  }));
}
