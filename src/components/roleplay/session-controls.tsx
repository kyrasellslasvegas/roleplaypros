"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhoneOff, Pause, Play, Hand, CirclePlay, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionControlsProps {
  isVoiceChatActive: boolean;
  isAvatarSpeaking: boolean;
  isPaused: boolean;
  hasSessionStarted: boolean;
  onBeginSession: () => void;
  onToggleVoiceChat: () => void;
  onInterrupt: () => void;
  onTogglePause: () => void;
  onEndSession: () => void;
  disabled?: boolean;
}

export function SessionControls({
  isVoiceChatActive,
  isAvatarSpeaking,
  isPaused,
  hasSessionStarted,
  onBeginSession,
  onToggleVoiceChat,
  onInterrupt,
  onTogglePause,
  onEndSession,
  disabled = false,
}: SessionControlsProps) {
  const [showEndDialog, setShowEndDialog] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Begin button - shows when session hasn't started */}
        {!hasSessionStarted ? (
          <Button
            size="lg"
            onClick={onBeginSession}
            disabled={disabled}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white border-green-600 px-8"
          >
            <CirclePlay className="h-5 w-5" />
            <span>Begin</span>
          </Button>
        ) : (
          <>
            {/* Mic status indicator */}
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 transition-all",
                isVoiceChatActive
                  ? "bg-green-600/20 border border-green-500/50"
                  : "bg-muted"
              )}
            >
              <Mic
                className={cn(
                  "h-5 w-5",
                  isVoiceChatActive ? "text-green-500 animate-pulse" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  isVoiceChatActive ? "text-green-500" : "text-muted-foreground"
                )}
              >
                {isVoiceChatActive ? "Mic Active" : "Mic Off"}
              </span>
            </div>

            {/* Interrupt button - only when avatar is speaking */}
            {isAvatarSpeaking && (
              <Button
                variant="outline"
                size="lg"
                onClick={onInterrupt}
                disabled={disabled}
                className="gap-2 border-orange-500 text-orange-500 hover:bg-orange-500/10"
              >
                <Hand className="h-5 w-5" />
                <span>Interrupt</span>
              </Button>
            )}

            {/* Pause/Resume */}
            <Button
              variant="outline"
              size="lg"
              onClick={onTogglePause}
              disabled={disabled}
              className="gap-2"
            >
              {isPaused ? (
                <>
                  <Play className="h-5 w-5" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="h-5 w-5" />
                  <span>Pause</span>
                </>
              )}
            </Button>

            {/* End session */}
            <Button
              variant="destructive"
              size="lg"
              onClick={() => setShowEndDialog(true)}
              disabled={disabled}
              className="gap-2"
            >
              <PhoneOff className="h-5 w-5" />
              <span>End Session</span>
            </Button>
          </>
        )}
      </div>

      {/* End session confirmation dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Training Session?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this roleplay session? Your progress
              will be saved and you&apos;ll receive feedback and analysis on your performance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Continue Session
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowEndDialog(false);
                onEndSession();
              }}
            >
              End Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
