"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Trophy, Target, Loader2 } from "lucide-react";
import {
  DailyObjectionCard,
  StreakIndicator,
  XpProgressBar,
  LevelBadge,
} from "@/components/gamification";
import type { DailyObjection, GamificationDashboardData } from "@/types/gamification";

export default function DailyDrillPage() {
  const router = useRouter();
  const [objection, setObjection] = useState<DailyObjection | null>(null);
  const [gamificationData, setGamificationData] = useState<GamificationDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load today's objection and gamification data
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch in parallel
        const [objectionRes, gamificationRes] = await Promise.all([
          fetch("/api/drills/daily"),
          fetch("/api/gamification/progress"),
        ]);

        if (objectionRes.ok) {
          const data = await objectionRes.json();
          setObjection(data.objection);

          // If no objection exists, automatically generate one
          if (data.needsGeneration) {
            await handleGenerateObjection();
          }
        }

        if (gamificationRes.ok) {
          const data = await gamificationRes.json();
          setGamificationData(data);
        }
      } catch (err) {
        console.error("Error loading drill data:", err);
        setError("Failed to load drill data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Generate today's objection
  async function handleGenerateObjection() {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch("/api/drills/daily/generate", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate objection");
      }

      const data = await response.json();
      setObjection(data.objection);
    } catch (err) {
      console.error("Error generating objection:", err);
      setError(err instanceof Error ? err.message : "Failed to generate objection");
    } finally {
      setIsGenerating(false);
    }
  }

  // Start the drill session
  async function handleStartDrill() {
    if (!objection) return;

    try {
      setIsStarting(true);
      setError(null);

      const response = await fetch("/api/drills/daily/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectionId: objection.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start drill");
      }

      const data = await response.json();

      // Navigate to the drill session page with config
      const config = encodeURIComponent(
        JSON.stringify({
          sessionId: data.sessionId,
          heygenToken: data.heygenToken,
          buyerSystemPrompt: data.buyerSystemPrompt,
          objection: data.objection,
        })
      );

      router.push(`/drills/daily/session?config=${config}`);
    } catch (err) {
      console.error("Error starting drill:", err);
      setError(err instanceof Error ? err.message : "Failed to start drill");
      setIsStarting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/drills")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Daily Drill</h1>
            <p className="text-muted-foreground">
              5-minute objection handling practice
            </p>
          </div>
        </div>

        {/* Quick stats */}
        {gamificationData && (
          <div className="flex items-center gap-4">
            <StreakIndicator
              currentStreak={gamificationData.streakInfo.current}
              longestStreak={gamificationData.streakInfo.longest}
              lastPracticeDate={gamificationData.streakInfo.lastPracticeDate}
            />
            <LevelBadge
              level={gamificationData.progress.currentLevel}
              totalXp={gamificationData.progress.totalXp}
            />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400">
          {error}
        </div>
      )}

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main drill card */}
        <div className="lg:col-span-2">
          <DailyObjectionCard
            objection={objection}
            onStartDrill={handleStartDrill}
            onGenerateObjection={handleGenerateObjection}
            isLoading={isStarting}
            isGenerating={isGenerating}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* XP Progress */}
          {gamificationData && (
            <Card className="border-primary/20 bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <XpProgressBar
                  currentXp={gamificationData.progress.totalXp}
                  xpToNextLevel={gamificationData.progress.xpToNextLevel}
                  currentLevel={gamificationData.progress.currentLevel}
                  xpProgress={gamificationData.progress.xpProgress}
                  size="sm"
                />
                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {gamificationData.progress.drillsCompleted}
                    </p>
                    <p className="text-xs text-muted-foreground">Drills Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {gamificationData.streakInfo.longest}
                    </p>
                    <p className="text-xs text-muted-foreground">Longest Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weekly Challenge */}
          {gamificationData?.weeklyChallenge && (
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  Weekly Challenge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{gamificationData.weeklyChallenge.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {gamificationData.weeklyChallenge.description}
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{gamificationData.weeklyChallenge.progressPercentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{
                        width: `${gamificationData.weeklyChallenge.progressPercentage}%`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-blue-400 mt-2">
                  +{gamificationData.weeklyChallenge.xpReward} XP reward
                </p>
              </CardContent>
            </Card>
          )}

          {/* Calendar hint */}
          <Card className="border-muted bg-muted/30">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">New objection daily</p>
                  <p className="text-muted-foreground">
                    Come back tomorrow for a fresh challenge
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
