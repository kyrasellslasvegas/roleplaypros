"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SessionProvider, useSession } from "@/context/session-context";
import { useHeygenAvatar } from "@/hooks/use-heygen-avatar";
import { useAICoach } from "@/hooks/use-ai-coach";
import { useComplianceMonitor } from "@/hooks/use-compliance-monitor";
import { AvatarVideo } from "@/components/roleplay/avatar-video";
import { SessionControls } from "@/components/roleplay/session-controls";
import { TranscriptPanel } from "@/components/roleplay/transcript-panel";
import { CoachWhisper } from "@/components/roleplay/coach-whisper";
import { SessionTimer } from "@/components/roleplay/session-timer";
import { Teleprompter } from "@/components/roleplay/teleprompter";
import { PhaseIndicatorCompact } from "@/components/roleplay/phase-indicator";
import { ComplianceAlert, ComplianceStatus } from "@/components/roleplay/compliance-alert";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionConfig, SessionPhase } from "@/types/session";

function SessionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configParam = searchParams.get("config");

  const {
    state,
    setConfig,
    startSession,
    setStatus,
    addTranscriptEntry,
    addCoachSuggestion,
    dismissSuggestion,
    updateElapsed,
    setPhase,
    addComplianceViolation,
    dismissComplianceViolation,
    setError,
  } = useSession();

  const [isInitializing, setIsInitializing] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasSessionStarted, setHasSessionStarted] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const lastUserMessageRef = useRef<string>("");
  const isProcessingRef = useRef(false);
  const speakingStartRef = useRef<number | null>(null);

  // Compliance monitor hook
  const compliance = useComplianceMonitor({
    onViolation: (violation) => {
      addComplianceViolation(violation);
    },
  });

  // HeyGen avatar hook
  const avatar = useHeygenAvatar({
    onUserMessage: handleUserMessage,
    onAvatarSpeakingChange: (speaking) => {
      if (!speaking && lastUserMessageRef.current) {
        // Avatar finished speaking
      }
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  // AI Coach hook
  const coach = useAICoach({
    onSuggestion: (suggestion) => {
      addCoachSuggestion(suggestion);
    },
  });

  // Handle user speech from HeyGen
  async function handleUserMessage(text: string) {
    if (!text.trim() || isProcessingRef.current) return;
    if (text === lastUserMessageRef.current) return;

    lastUserMessageRef.current = text;
    isProcessingRef.current = true;

    try {
      // Add user message to transcript
      addTranscriptEntry("user", text);

      // Check for compliance violations in user's speech
      compliance.checkMessage(text, state.transcript.length);

      // Calculate speaking duration for interruption logic
      const speakingDuration = speakingStartRef.current
        ? Math.floor((Date.now() - speakingStartRef.current) / 1000)
        : 0;

      // Get AI buyer response
      const response = await fetch("/api/ai/buyer/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          userMessage: text,
          conversationHistory: state.transcript,
          buyerProfile: state.config?.buyerProfile,
          currentPhase: state.currentPhase,
          agentSpeakingDuration: speakingDuration,
          silenceDuration: 0,
          checkInterruption: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get buyer response");
      }

      const data = await response.json();

      // Add buyer response to transcript
      addTranscriptEntry("ai_buyer", data.response);

      // Handle phase advancement
      if (data.shouldAdvancePhase && data.nextPhase) {
        setPhase(data.nextPhase);
      }

      // Make avatar speak the response
      await avatar.speak(data.response, data.emotion);

      // Reset speaking start time
      speakingStartRef.current = Date.now();
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
        router.push("/roleplay");
        return;
      }

      try {
        // Parse config from URL
        const config: SessionConfig = JSON.parse(decodeURIComponent(configParam));
        setConfig(config);

        // Start session on server
        const response = await fetch("/api/ai/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to start session");
        }

        const { sessionId, heygenToken } = await response.json();
        startSession(sessionId);

        // Connect to HeyGen avatar
        await avatar.startSession(heygenToken);
        setStatus("active");

        // Connect AI coach (only for intermediate/advanced)
        if (config.difficulty !== "beginner") {
          coach.connect(sessionId);
        }

        speakingStartRef.current = Date.now();
        setIsInitializing(false);
      } catch (error) {
        console.error("Session initialization error:", error);
        setError(error instanceof Error ? error.message : "Failed to initialize session");
        setIsInitializing(false);
      }
    }

    initializeSession();

    return () => {
      coach.disconnect();
    };
  }, [configParam]);

  // Handle Begin Session - starts mic and timer
  const handleBeginSession = useCallback(async () => {
    setHasSessionStarted(true);
    setIsTimerRunning(true);

    // Auto-start voice chat when Begin is pressed
    await avatar.startVoiceChat();
    setIsVoiceChatActive(true);
    speakingStartRef.current = Date.now();
  }, [avatar]);

  // Handle voice chat toggle
  const handleToggleVoiceChat = useCallback(async () => {
    if (isVoiceChatActive) {
      avatar.stopVoiceChat();
      setIsVoiceChatActive(false);
    } else {
      await avatar.startVoiceChat();
      setIsVoiceChatActive(true);
      speakingStartRef.current = Date.now();
    }
  }, [isVoiceChatActive, avatar]);

  // Handle pause/resume - turns off mic when pausing
  const handleTogglePause = useCallback(() => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    setIsTimerRunning(!newPausedState);

    // Turn off mic when pausing
    if (newPausedState && isVoiceChatActive) {
      avatar.stopVoiceChat();
      setIsVoiceChatActive(false);
    }
  }, [isPaused, isVoiceChatActive, avatar]);

  // Handle end session - turns off mic and begins analysis
  const handleEndSession = useCallback(async () => {
    setStatus("ending");
    setIsTimerRunning(false);

    // Turn off mic
    if (isVoiceChatActive) {
      avatar.stopVoiceChat();
      setIsVoiceChatActive(false);
    }

    // Stop avatar and coach
    avatar.endSession();
    coach.disconnect();

    try {
      // Save session and begin analysis
      const response = await fetch("/api/ai/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          transcript: state.transcript,
          coachSuggestions: state.coachSuggestions,
          actualDurationSeconds: state.elapsedSeconds,
        }),
      });

      if (response.ok) {
        const { feedbackUrl } = await response.json();
        router.push(feedbackUrl);
      } else {
        router.push("/roleplay");
      }
    } catch (error) {
      console.error("Error ending session:", error);
      router.push("/roleplay");
    }
  }, [state, avatar, coach, router, setStatus, isVoiceChatActive]);

  // Handle phase advancement from teleprompter
  const handleAdvancePhase = useCallback(() => {
    const phaseOrder: SessionPhase[] = [
      "rapport",
      "money_questions",
      "deep_questions",
      "frame",
      "close",
    ];
    const currentIndex = phaseOrder.indexOf(state.currentPhase);
    if (currentIndex < phaseOrder.length - 1) {
      setPhase(phaseOrder[currentIndex + 1]);
    }
  }, [state.currentPhase, setPhase]);

  // Toggle fullscreen
  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Handle timer tick - only tick when timer is running
  const handleTimerTick = useCallback((seconds: number) => {
    if (isTimerRunning) {
      updateElapsed(seconds);
    }
  }, [isTimerRunning, updateElapsed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (hasSessionStarted) {
            handleTogglePause();
          }
          break;
        case "m":
          if (hasSessionStarted) {
            handleToggleVoiceChat();
          }
          break;
        case "Escape":
          if (isFullscreen) setIsFullscreen(false);
          break;
        case "f":
          handleToggleFullscreen();
          break;
        case "Enter":
          if (!hasSessionStarted) {
            handleBeginSession();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTogglePause, handleToggleVoiceChat, handleToggleFullscreen, handleBeginSession, isFullscreen, hasSessionStarted]);

  // Loading state
  if (isInitializing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">
          Setting up your training session...
        </p>
        <p className="text-sm text-muted-foreground/60">
          Connecting to AI buyer avatar
        </p>
      </div>
    );
  }

  // Error state
  if (state.status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg text-red-500">{state.error}</p>
        <Button onClick={() => router.push("/roleplay")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Setup
        </Button>
      </div>
    );
  }

  const isBeginner = state.config?.difficulty === "beginner";

  return (
    <div className={cn(
      "flex h-screen flex-col bg-background",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/roleplay")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              AI Buyer Roleplay
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-sm text-muted-foreground capitalize">
                {state.config?.difficulty}
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-sm text-muted-foreground capitalize">
                {state.config?.buyerProfile.personality} buyer
              </span>
            </div>
          </div>
        </div>

        {/* Center - Phase indicator and timer */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl mx-8">
          <PhaseIndicatorCompact currentPhase={state.currentPhase} />
          <SessionTimer
            durationMinutes={state.config?.durationMinutes || 30}
            elapsedSeconds={state.elapsedSeconds}
            isPaused={!isTimerRunning}
            onTick={handleTimerTick}
            className="w-full"
          />
        </div>

        {/* Right - Status and controls */}
        <div className="flex items-center gap-3">
          <ComplianceStatus violationCount={compliance.getViolationCount()} />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleFullscreen}
            className="h-8 w-8 p-0"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left side - Teleprompter (Beginner only) */}
        {isBeginner && (
          <div className="w-80 border-r border-border p-4 overflow-hidden">
            <Teleprompter
              currentPhase={state.currentPhase}
              buyerProfile={state.config?.buyerProfile!}
              transcript={state.transcript}
              onAdvancePhase={handleAdvancePhase}
              className="h-full"
            />
          </div>
        )}

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

          {/* Ready to begin overlay */}
          {!hasSessionStarted && (
            <div className="absolute inset-4 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">Ready to Begin</p>
                <p className="mt-2 text-white/70 mb-4">
                  Click the Begin button or press Enter to start your session
                </p>
                <p className="text-sm text-white/50">
                  Your microphone will activate automatically
                </p>
              </div>
            </div>
          )}

          {/* Paused overlay */}
          {isPaused && hasSessionStarted && (
            <div className="absolute inset-4 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">Session Paused</p>
                <p className="mt-2 text-white/70">
                  Press Space or click Resume to continue
                </p>
              </div>
            </div>
          )}

          {/* Compliance alerts - floating */}
          <div className="absolute top-6 left-6 right-6 z-10">
            <ComplianceAlert
              violations={state.complianceViolations}
              onDismiss={dismissComplianceViolation}
            />
          </div>

          {/* Controls bar */}
          <div className="mt-4 flex justify-center">
            <SessionControls
              isVoiceChatActive={isVoiceChatActive}
              isAvatarSpeaking={avatar.isAvatarSpeaking}
              isPaused={isPaused}
              hasSessionStarted={hasSessionStarted}
              onBeginSession={handleBeginSession}
              onToggleVoiceChat={handleToggleVoiceChat}
              onInterrupt={avatar.interrupt}
              onTogglePause={handleTogglePause}
              onEndSession={handleEndSession}
              disabled={state.status === "ending"}
            />
          </div>
        </div>

        {/* Right side - Coach and transcript */}
        <div className="w-96 flex flex-col gap-4 p-4 border-l border-border overflow-hidden">
          {/* Coach whispers (non-beginner only) */}
          {!isBeginner && (
            <div className="shrink-0">
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                AI Coach
                <span className="text-xs font-normal text-muted-foreground/60">
                  (Firm, Direct)
                </span>
              </h3>
              <CoachWhisper
                suggestions={state.coachSuggestions}
                onDismiss={dismissSuggestion}
              />
              {state.coachSuggestions.filter((s) => !s.dismissed).length === 0 && (
                <p className="text-sm text-muted-foreground/60 italic">
                  Coaching tips will appear here...
                </p>
              )}
            </div>
          )}

          {/* Transcript */}
          <TranscriptPanel
            transcript={state.transcript}
            className="flex-1 min-h-0"
          />
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="border-t border-border px-6 py-2 flex items-center justify-center gap-6 text-xs text-muted-foreground/60">
        {!hasSessionStarted ? (
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> Begin Session</span>
        ) : (
          <>
            <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Space</kbd> Pause</span>
            <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">M</kbd> Toggle Mic</span>
          </>
        )}
        <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">F</kbd> Fullscreen</span>
        <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> Exit Fullscreen</span>
      </div>
    </div>
  );
}

function SessionPageLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg text-muted-foreground">Loading session...</p>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<SessionPageLoading />}>
      <SessionProvider>
        <SessionPageContent />
      </SessionProvider>
    </Suspense>
  );
}
