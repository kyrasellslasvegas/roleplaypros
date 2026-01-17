"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SessionProvider, useSession } from "@/context/session-context";
import { useCustomAvatar } from "@/hooks/use-custom-avatar";
import { useAICoach } from "@/hooks/use-ai-coach";
import { useComplianceMonitor } from "@/hooks/use-compliance-monitor";
import { CustomAvatar } from "@/components/roleplay/custom-avatar";
import { SessionControls } from "@/components/roleplay/session-controls";
import { TranscriptPanel } from "@/components/roleplay/transcript-panel";
import { CoachWhisper } from "@/components/roleplay/coach-whisper";
import { SessionTimer } from "@/components/roleplay/session-timer";
import { Teleprompter } from "@/components/roleplay/teleprompter";
import { PhaseIndicatorCompact } from "@/components/roleplay/phase-indicator";
import { ComplianceAlert, ComplianceStatus } from "@/components/roleplay/compliance-alert";
import { SessionCountdown } from "@/components/roleplay/session-countdown";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionConfig, SessionPhase } from "@/types/session";
import { PERSONALITY_VOICE_MAP, type TTSVoice } from "@/types/avatar";

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
  const [showCountdown, setShowCountdown] = useState(false);

  const lastUserMessageRef = useRef<string>("");
  const isProcessingRef = useRef(false);
  const speakingStartRef = useRef<number | null>(null);

  // Compliance monitor hook
  const compliance = useComplianceMonitor({
    onViolation: (violation) => {
      addComplianceViolation(violation);
    },
  });

  // Get personality voice for TTS
  const personalityVoice: TTSVoice = state.config?.buyerProfile?.personality
    ? PERSONALITY_VOICE_MAP[state.config.buyerProfile.personality] || "nova"
    : "nova";

  // Custom avatar hook (realtime avatar)
  const avatar = useCustomAvatar({
    onUserMessage: handleUserMessage,
    onAvatarSpeakingChange: (speaking) => {
      if (!speaking && lastUserMessageRef.current) {
        // Avatar finished speaking
      }
    },
    onError: (error) => {
      console.error("Avatar error:", error.message);
      setError(`Avatar connection error: ${error.message}`);
    },
    personalityVoice,
  });

  // AI Coach hook
  const coach = useAICoach({
    onSuggestion: (suggestion) => {
      addCoachSuggestion(suggestion);
    },
  });

  // Handle user speech from the realtime avatar
  async function handleUserMessage(text: string) {
    console.log("handleUserMessage called with:", text);

    if (!text.trim()) {
      console.log("Empty text, ignoring");
      return;
    }
    if (isProcessingRef.current) {
      console.log("Already processing, ignoring");
      return;
    }
    if (text === lastUserMessageRef.current) {
      console.log("Duplicate message, ignoring");
      return;
    }

    lastUserMessageRef.current = text;
    isProcessingRef.current = true;

    try {
      console.log("Processing user message, adding to transcript");
      // Add user message to transcript
      addTranscriptEntry("user", text);

      // Check for compliance violations in user's speech
      compliance.checkMessage(text, state.transcript.length);

      // Calculate speaking duration for interruption logic
      const speakingDuration = speakingStartRef.current
        ? Math.floor((Date.now() - speakingStartRef.current) / 1000)
        : 0;

      console.log("Calling buyer respond API...");
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
          difficulty: state.config?.difficulty,
          agentSpeakingDuration: speakingDuration,
          silenceDuration: 0,
          checkInterruption: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Buyer respond API error:", response.status, errorText);
        throw new Error(`Failed to get buyer response: ${response.status}`);
      }

      const data = await response.json();
      console.log("Buyer response received:", data.response?.substring(0, 50));

      // Add buyer response to transcript
      addTranscriptEntry("ai_buyer", data.response);

      // Handle phase advancement
      if (data.shouldAdvancePhase && data.nextPhase) {
        console.log("Advancing phase to:", data.nextPhase);
        setPhase(data.nextPhase);
      }

      // Make avatar speak the response
      console.log("Making avatar speak the response...");
      await avatar.speak(data.response, data.emotion);
      console.log("Avatar speak completed");

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

        const { sessionId, avatarImageUrl } = await response.json();
        startSession(sessionId);

        // Connect to custom avatar (no external token needed)
        await avatar.startSession(avatarImageUrl);
        setStatus("active");

        // Connect AI coach for all users
        coach.connect(sessionId);

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

  // Handle Begin Session - shows countdown then starts session
  const handleBeginSession = useCallback(async () => {
    console.log("Begin session pressed, avatar status:", avatar.status);

    // Check if avatar is connected before starting
    if (avatar.status !== "connected" && avatar.status !== "listening" && avatar.status !== "speaking") {
      setError("Avatar not ready. Please wait for connection or refresh the page.");
      return;
    }

    // Show countdown before starting session
    setShowCountdown(true);
  }, [avatar, setError]);

  // Handle countdown complete - actually start the session with mic
  const handleCountdownComplete = useCallback(async () => {
    setShowCountdown(false);
    setHasSessionStarted(true);
    setIsTimerRunning(true);
    speakingStartRef.current = Date.now();

    // Start voice chat (microphone)
    try {
      await avatar.startVoiceChat();
      setIsVoiceChatActive(true);
      console.log("Voice chat started successfully");

      // Have the AI buyer speak first to start the conversation
      setTimeout(async () => {
        try {
          const response = await fetch("/api/ai/buyer/respond", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: state.sessionId,
              userMessage: "[SESSION_START]",
              conversationHistory: [],
              buyerProfile: state.config?.buyerProfile,
              currentPhase: "rapport",
              difficulty: state.config?.difficulty,
              agentSpeakingDuration: 0,
              silenceDuration: 0,
              checkInterruption: false,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log("Initial buyer greeting:", data.response);
            addTranscriptEntry("ai_buyer", data.response);

            // Make avatar speak the greeting
            await avatar.speak(data.response, data.emotion);
          }
        } catch (err) {
          console.error("Failed to get initial buyer greeting:", err);
        }
      }, 300);
    } catch (err) {
      console.error("Failed to start voice chat:", err);
      setError("Failed to start voice chat. Please refresh and try again.");
    }
  }, [avatar, setError, state.sessionId, state.config?.buyerProfile, state.config?.difficulty, addTranscriptEntry]);

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
    // Validate transcript before ending
    const transcriptCount = state.transcript.length;
    console.log(`Ending session with ${transcriptCount} transcript entries`);

    if (transcriptCount < 2) {
      // Warn user about insufficient transcript
      const confirmEnd = window.confirm(
        `You have only ${transcriptCount} conversation exchange${transcriptCount !== 1 ? "s" : ""}. ` +
        `For a meaningful performance report, you need at least 2 exchanges. ` +
        `\n\nEnd session anyway?`
      );
      if (!confirmEnd) return;
    }

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
      console.log("Saving session with transcript:", state.transcript.length, "entries");

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
        const { feedbackUrl, analysisStatus } = await response.json();
        console.log("Session saved, analysis status:", analysisStatus);
        router.push(feedbackUrl);
      } else {
        const errorData = await response.json();
        console.error("Failed to save session:", errorData);
        setError(`Failed to save session: ${errorData.error || "Unknown error"}`);
        router.push("/roleplay");
      }
    } catch (error) {
      console.error("Error ending session:", error);
      router.push("/roleplay");
    }
  }, [state, avatar, coach, router, setStatus, isVoiceChatActive, setError]);

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
          if (!hasSessionStarted && !showCountdown) {
            handleBeginSession();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTogglePause, handleToggleVoiceChat, handleToggleFullscreen, handleBeginSession, isFullscreen, hasSessionStarted, showCountdown]);

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
              <span className="text-muted-foreground/40">|</span>
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
        {/* Left side - Teleprompter with scripts */}
        <div className="w-80 border-r border-border p-4 overflow-hidden">
          <Teleprompter
            currentPhase={state.currentPhase}
            buyerProfile={state.config?.buyerProfile!}
            transcript={state.transcript}
            onAdvancePhase={handleAdvancePhase}
            className="h-full"
          />
        </div>

        {/* Center - Avatar video */}
        <div className="flex-1 flex flex-col p-4">
          {/* Avatar container with overlays */}
          <div className="relative flex-1 min-h-0">
            {/* Custom Avatar */}
            <CustomAvatar
              status={avatar.status}
              isUserSpeaking={avatar.isUserSpeaking}
              isAvatarSpeaking={avatar.isAvatarSpeaking}
              isMicActive={isVoiceChatActive}
              avatarImageUrl={avatar.avatarImageUrl}
              audioLevel={avatar.audioLevel}
              error={avatar.error}
              className="h-full"
            />

            {/* Ready to begin overlay */}
            {!hasSessionStarted && !showCountdown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
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

            {/* Countdown overlay */}
            {showCountdown && (
              <SessionCountdown onComplete={handleCountdownComplete} />
            )}

            {/* Paused overlay */}
            {isPaused && hasSessionStarted && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
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
          </div>

          {/* Controls bar - outside avatar container, always visible */}
          <div className="mt-4 flex justify-center relative z-20 shrink-0">
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
          {/* Coach whispers */}
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
