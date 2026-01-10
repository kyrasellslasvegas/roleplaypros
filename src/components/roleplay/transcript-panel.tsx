"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import type { TranscriptEntry } from "@/types/session";

interface TranscriptPanelProps {
  transcript: TranscriptEntry[];
  className?: string;
}

export function TranscriptPanel({ transcript, className }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-lg border border-border bg-card",
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          Live Transcript
        </h3>
        <p className="text-xs text-muted-foreground">
          {transcript.length} messages
        </p>
      </div>

      {/* Transcript entries */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {transcript.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Conversation will appear here...
          </p>
        ) : (
          transcript.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "flex gap-3",
                entry.speaker === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  entry.speaker === "user"
                    ? "bg-blue-500/10 text-blue-500"
                    : "bg-gold-500/10 text-gold-500"
                )}
              >
                {entry.speaker === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>

              {/* Message bubble */}
              <div
                className={cn(
                  "flex max-w-[80%] flex-col",
                  entry.speaker === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-3 py-2",
                    entry.speaker === "user"
                      ? "bg-blue-500/10 text-foreground"
                      : "bg-gold-500/10 text-foreground"
                  )}
                >
                  <p className="text-sm">{entry.content}</p>
                </div>
                <span className="mt-1 text-xs text-muted-foreground">
                  {formatTimestamp(entry.timestamp)}
                  {entry.phase && (
                    <span className="ml-2 capitalize opacity-60">
                      • {entry.phase.replace("_", " ")}
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
