"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useHeygenAvatar } from "@/hooks/use-heygen-avatar";
import { AvatarVideo } from "@/components/roleplay/avatar-video";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Mic,
  MicOff,
  PhoneOff,
  Target,
  Clock,
  MessageSquare,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DailyObjection } from "@/types/gamification";

interface DrillConfig {
  sessionId: string;
  heygenToken: string;
  buyerSystemPrompt: string;
  objection: DailyObjection;
}

interface TranscriptEntry {
  role: "user" | "buyer";
  content: string;
  timestamp: Date;
}

function DrillSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configParam = searchParams.get("config");

  const [config, setConfig] = useState<DrillConfig | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [drillPhase, setDrillPhase] = useState<"intro" | "active" | "complete">("intro");
  const [isEnding, setIsEnding] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);

  const lastUserMessageRef = useRef<string>("");
  const isProcessingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_DURATION_SECONDS = 5 * 60; // 5 minutes
  const MAX_EXCHANGES = 5; // Max back-and-forth exchanges

  // HeyGen avatar hook
  const avatar = useHeygenAvatar({
    onUserMessage: handleUserMessage,
    onAvatarSpeakingChange: (speaking) => {
      if (!speaking && drillPhase === "intro") {
        setDrillPhase("active");
      }
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  // Handle user speech from HeyGen
  async function handleUserMessage(text: string) {
    if (!text.trim() || isProcessingRef.current || !config) return;
    if (text === lastUserMessageRef.current) return;
    if (drillPhase !== "active") return;

    lastUserMessageRef.current = text;
    isProcessingRef.current = true;

    try {
      // Add user message to transcript
      setTranscript((prev) => [
        ...prev,
        { role: "user", content: text, timestamp: new Date() },
      ]);

      // Get buyer response
      const response = await fetch("/api/drills/daily/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: config.sessionId,
          userMessage: text,
          conversationHistory: transcript,
          objection: config.objection,
          exchangeCount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get buyer response");
      }

      const data = await response.json();

      // Add buyer response to transcript
      setTranscript((prev) => [
        ...prev,
        { role: "buyer", content: data.response, timestamp: new Date() },
      ]);

      setExchangeCount((prev) => prev + 1);

      // Make avatar speak the response
      await avatar.speak(data.response, data.emotion);

      // Check if drill should end
      if (data.shouldEnd || exchangeCount + 1 >= MAX_EXCHANGES) {
        setTimeout(() => handleEndDrill(), 2000);
      }
    } catch (error) {
      console.error("Error processing user message:", error);
    } finally {
      isProcessingRef.current = false;
      lastUserMessageRef.current = "";
    }
  }

  // Initialize session
  useEffect(() => {
    async function initializeSession() {
      if (!configParam) {
        router.push("/drills/daily");
        return;
      }

      try {
        const parsed: DrillConfig = JSON.parse(decodeURIComponent(configParam));
        setConfig(parsed);

        // Connect to HeyGen avatar
        await avatar.startSession(parsed.heygenToken);

        // Start with the buyer presenting the objection
        const introMessage = parsed.objection.objectionText;
        setTranscript([
          { role: "buyer", content: introMessage, timestamp: new Date() },
        ]);

        // Make avatar speak the objection
        await avatar.speak(introMessage, "skeptical");

        setIsInitializing(false);
      } catch (err) {
        console.error("Session initialization error:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize session");
        setIsInitializing(false);
      }
    }

    initializeSession();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [configParam]);

  // Timer effect
  useEffect(() => {
    if (drillPhase === "active" && !isEnding) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_DURATION_SECONDS) {
            handleEndDrill();
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [drillPhase, isEnding]);

  // Handle voice chat toggle
  const handleToggleVoiceChat = useCallback(async () => {
    if (isVoiceChatActive) {
      avatar.stopVoiceChat();
      setIsVoiceChatActive(false);
    } else {
      await avatar.startVoiceChat();
      setIsVoiceChatActive(true);
    }
  }, [isVoiceChatActive, avatar]);

  // Handle end drill
  const handleEndDrill = useCallback(async () => {
    if (isEnding || drillPhase === "complete") return;

    setIsEnding(true);
    setDrillPhase("complete");

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Stop avatar
    avatar.endSession();

    try {
      // Complete the drill and get feedback
      const response = await fetch("/api/drills/daily/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectionId: config?.objection.id,
          transcript: transcript.map((t) => ({
            speaker: t.role === "user" ? "user" : "ai_buyer",
            text: t.content,
          })),
          durationSeconds: elapsedSeconds,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to results page with feedback
        const resultsConfig = encodeURIComponent(
          JSON.stringify({
            objection: config?.objection,
            feedback: data.feedback,
            xpEarned: data.xpEarned,
            newLevel: data.newLevel,
            newAchievements: data.newAchievements,
            transcript,
            durationSeconds: elapsedSeconds,
          })
        );
        router.push(`/drills/daily/results?data=${resultsConfig}`);
      } else {
        router.push("/drills/daily");
      }
    } catch (err) {
      console.error("Error completing drill:", err);
      router.push("/drills/daily");
    }
  }, [isEnding, drillPhase, config, transcript, elapsedSeconds, avatar, router]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const remainingTime = MAX_DURATION_SECONDS - elapsedSeconds;
  const isTimeWarning = remainingTime <= 60;

  // Loading state
  if (isInitializing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">
          Setting up your drill session...
        </p>
        <p className="text-sm text-muted-foreground/60">
          Connecting to AI buyer avatar
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-lg text-red-500">{error}</p>
        <Button onClick={() => router.push("/drills/daily")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Daily Drill
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/drills/daily")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Daily Drill
            </h1>
            <p className="text-sm text-muted-foreground">
              Objection Handling Practice
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full",
              isTimeWarning
                ? "bg-red-500/20 text-red-400"
                : "bg-primary/20 text-primary"
            )}
          >
            <Clock className="h-4 w-4" />
            <span className="font-mono font-bold text-lg">
              {formatTime(remainingTime)}
            </span>
          </div>

          <Badge
            variant="outline"
            className={cn(
              drillPhase === "intro"
                ? "border-blue-500/50 text-blue-400"
                : drillPhase === "active"
                ? "border-green-500/50 text-green-400"
                : "border-primary/50 text-primary"
            )}
          >
            {drillPhase === "intro"
              ? "Listen to Objection"
              : drillPhase === "active"
              ? "Your Turn"
              : "Complete"}
          </Badge>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center - Avatar video */}
        <div className="flex-1 flex flex-col p-4 relative">
          <AvatarVideo
            ref={avatar.videoRef}
            status={avatar.status}
            isUserSpeaking={avatar.isUserSpeaking}
            isAvatarSpeaking={avatar.isAvatarSpeaking}
            error={avatar.error}
            className="flex-1"
          />

          {/* Objection overlay */}
          {config?.objection && drillPhase !== "complete" && (
            <div className="absolute top-4 left-4 right-4 max-w-xl mx-auto">
              <Card className="bg-muted/90 border-primary/30 backdrop-blur-sm">
                <CardContent className="pt-4 pb-3">
                  <p className="text-sm text-primary font-medium mb-1">
                    Objection to Handle:
                  </p>
                  <p className="text-lg italic">"{config.objection.objectionText}"</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Controls bar */}
          <div className="mt-4 flex justify-center gap-4">
            <Button
              variant={isVoiceChatActive ? "default" : "outline"}
              size="lg"
              onClick={handleToggleVoiceChat}
              disabled={drillPhase !== "active" || isEnding}
              className={cn(
                "w-14 h-14 rounded-full p-0",
                isVoiceChatActive && "bg-green-500 hover:bg-green-600"
              )}
            >
              {isVoiceChatActive ? (
                <Mic className="h-6 w-6" />
              ) : (
                <MicOff className="h-6 w-6" />
              )}
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={handleEndDrill}
              disabled={isEnding}
              className="w-14 h-14 rounded-full p-0"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>

          {/* Status indicator */}
          <div className="mt-4 text-center">
            {drillPhase === "intro" && (
              <p className="text-muted-foreground animate-pulse">
                Listen to the objection...
              </p>
            )}
            {drillPhase === "active" && !isVoiceChatActive && (
              <p className="text-primary">
                Click the mic to respond
              </p>
            )}
            {drillPhase === "active" && isVoiceChatActive && (
              <p className="text-green-400">
                Speak your response...
              </p>
            )}
          </div>
        </div>

        {/* Right side - Transcript */}
        <div className="w-80 border-l border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Conversation
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {transcript.map((entry, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  entry.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    entry.role === "user"
                      ? "bg-primary/20 text-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {entry.content}
                </div>
              </div>
            ))}
          </div>

          {/* Quick tips */}
          {config?.objection.tips && config.objection.tips.length > 0 && drillPhase === "active" && (
            <div className="p-4 border-t border-border bg-muted/30">
              <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Quick Tips
              </p>
              <ul className="space-y-1">
                {config.objection.tips.slice(0, 2).map((tip, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="border-t border-border px-6 py-2 flex items-center justify-center gap-6 text-xs text-muted-foreground/60">
        <span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">M</kbd>{" "}
          Toggle Mic
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd>{" "}
          End Drill
        </span>
      </div>
    </div>
  );
}

function DrillSessionLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg text-muted-foreground">Loading drill session...</p>
    </div>
  );
}

export default function DrillSessionPage() {
  return (
    <Suspense fallback={<DrillSessionLoading />}>
      <DrillSessionContent />
    </Suspense>
  );
}
