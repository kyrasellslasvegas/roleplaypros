"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Target,
  TrendingUp,
  Flame,
  Play,
  ArrowRight,
  Clock,
  Award,
  Trophy,
  Zap,
  Loader2,
} from "lucide-react";
import {
  XpProgressBar,
  StreakIndicator,
  LevelBadge,
  DailyObjectionCard,
} from "@/components/gamification";
import type { DailyObjection, GamificationDashboardData } from "@/types/gamification";

interface DashboardData {
  progress: {
    current_streak: number;
    longest_streak: number;
    total_sessions: number;
    total_practice_minutes: number;
    skill_grades: Record<string, { grade: string; trend?: string }>;
    last_practice_date: string | null;
  } | null;
  recentSessions: Array<{
    id: string;
    score: number | null;
    feedback: { overallGrade?: string; overallSummary?: string } | null;
    created_at: string;
    difficulty: string;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [gamificationData, setGamificationData] = useState<GamificationDashboardData | null>(null);
  const [dailyObjection, setDailyObjection] = useState<DailyObjection | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isGeneratingObjection, setIsGeneratingObjection] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        // Fetch all data in parallel
        const [gamificationRes, objectionRes] = await Promise.all([
          fetch("/api/gamification/progress"),
          fetch("/api/drills/daily"),
        ]);

        if (gamificationRes.ok) {
          const data = await gamificationRes.json();
          setGamificationData(data);
        }

        if (objectionRes.ok) {
          const data = await objectionRes.json();
          setDailyObjection(data.objection);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleGenerateObjection() {
    try {
      setIsGeneratingObjection(true);
      const response = await fetch("/api/drills/daily/generate", { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        setDailyObjection(data.objection);
      }
    } catch (error) {
      console.error("Error generating objection:", error);
    } finally {
      setIsGeneratingObjection(false);
    }
  }

  async function handleStartDrill() {
    if (!dailyObjection) return;
    router.push("/drills/daily");
  }

  // Calculate stats from real data
  const stats = gamificationData
    ? [
        {
          name: "Current Streak",
          value: gamificationData.streakInfo.current.toString(),
          unit: "days",
          icon: Flame,
          color: "text-orange-500",
          bgColor: "bg-orange-500/10",
        },
        {
          name: "Level",
          value: gamificationData.progress.currentLevel.toString(),
          unit: gamificationData.progress.totalXp.toLocaleString() + " XP",
          icon: Trophy,
          color: "text-primary",
          bgColor: "bg-primary/10",
        },
        {
          name: "Drills Completed",
          value: gamificationData.progress.drillsCompleted.toString(),
          unit: "total",
          icon: Target,
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
        },
        {
          name: "Weekly Challenges",
          value: gamificationData.progress.weeklyChallengesCompleted.toString(),
          unit: "completed",
          icon: Award,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
        },
      ]
    : [];

  const quickActions = [
    {
      title: "Start Roleplay",
      description: "Practice with an AI buyer",
      href: "/roleplay",
      icon: Users,
      variant: "gold" as const,
    },
    {
      title: "Daily Drill",
      description: "5-minute objection practice",
      href: "/drills/daily",
      icon: Target,
      variant: "outline" as const,
    },
    {
      title: "Achievements",
      description: "View your badges",
      href: "/achievements",
      icon: Trophy,
      variant: "outline" as const,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with XP Progress */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Welcome back
          </h1>
          <p className="mt-1 text-muted-foreground">
            Keep your streak going. Practice makes perfect.
          </p>
        </div>

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
              size="lg"
            />
          </div>
        )}
      </div>

      {/* XP Progress Bar */}
      {gamificationData && (
        <Card className="border-primary/20 bg-muted/50">
          <CardContent className="pt-6">
            <XpProgressBar
              currentXp={gamificationData.progress.totalXp}
              xpToNextLevel={gamificationData.progress.xpToNextLevel}
              currentLevel={gamificationData.progress.currentLevel}
              xpProgress={gamificationData.progress.xpProgress}
            />
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.name}</p>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    {stat.unit}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        {quickActions.map((action) => (
          <Card key={action.title} className="hover-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant={action.variant} className="w-full" asChild>
                <Link href={action.href} className="gap-2">
                  <Play className="h-4 w-4" />
                  Start Now
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Objection & Weekly Challenge */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Objection Card */}
        <DailyObjectionCard
          objection={dailyObjection}
          onStartDrill={handleStartDrill}
          onGenerateObjection={handleGenerateObjection}
          isGenerating={isGeneratingObjection}
        />

        {/* Weekly Challenge */}
        {gamificationData?.weeklyChallenge && (
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                Weekly Challenge
              </CardTitle>
              <CardDescription>
                {gamificationData.weeklyChallenge.daysRemaining} days remaining
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-lg">
                  {gamificationData.weeklyChallenge.title}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {gamificationData.weeklyChallenge.description}
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {gamificationData.weeklyChallenge.progressPercentage}%
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width: `${gamificationData.weeklyChallenge.progressPercentage}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-400">
                  +{gamificationData.weeklyChallenge.xpReward} XP reward
                </span>
                {gamificationData.weeklyChallenge.bonusMultiplier > 1 && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                    {gamificationData.weeklyChallenge.bonusMultiplier}x bonus!
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fallback if no weekly challenge */}
        {!gamificationData?.weeklyChallenge && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
              <CardDescription>Your latest unlocks</CardDescription>
            </CardHeader>
            <CardContent>
              {gamificationData?.recentAchievements &&
              gamificationData.recentAchievements.length > 0 ? (
                <div className="space-y-3">
                  {gamificationData.recentAchievements.slice(0, 3).map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Trophy className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{achievement.name}</p>
                        <p className="text-xs text-muted-foreground">
                          +{achievement.xpReward} XP
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Complete drills and sessions to unlock achievements!
                </p>
              )}
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/achievements">
                  View All Achievements
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Progress CTA */}
      <Card className="border-primary/20">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Track Your Growth</p>
              <p className="text-sm text-muted-foreground">
                View detailed skill grades, compliance scores, and weekly reports
              </p>
            </div>
          </div>
          <Button variant="gold" asChild>
            <Link href="/progress">
              View Progress
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
