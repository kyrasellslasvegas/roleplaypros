"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Calendar,
  Trophy,
  Target,
  Clock,
  Flame,
  Zap,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import {
  SkillTrendChart,
  ComplianceGauge,
  CoachingInsights,
} from "@/components/reports";
import { XpProgressBar, LevelBadge, StreakIndicator } from "@/components/gamification";
import type { WeeklyReport, GamificationDashboardData } from "@/types/gamification";
import { cn } from "@/lib/utils";

interface WeeklyReportData {
  report: WeeklyReport;
  previousWeek: {
    skillGrades: Record<string, string>;
    overallGrade: string | null;
    sessionsCount: number;
    xpEarned: number;
  } | null;
  generated: boolean;
}

export default function WeeklyReportPage() {
  const [reportData, setReportData] = useState<WeeklyReportData | null>(null);
  const [gamificationData, setGamificationData] = useState<GamificationDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Calculate week dates
  const getWeekStart = (offset: number): string => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7);
    return monday.toISOString().split("T")[0];
  };

  const weekStart = getWeekStart(currentWeekOffset);

  useEffect(() => {
    loadData();
  }, [currentWeekOffset]);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);

      const [reportRes, gamificationRes] = await Promise.all([
        fetch(`/api/reports/weekly?week=${weekStart}`),
        fetch("/api/gamification/progress"),
      ]);

      if (reportRes.ok) {
        const data = await reportRes.json();
        setReportData(data);
      } else {
        setError("Failed to load weekly report");
      }

      if (gamificationRes.ok) {
        const data = await gamificationRes.json();
        setGamificationData(data);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegenerate() {
    try {
      setIsRegenerating(true);
      setError(null);

      const response = await fetch("/api/reports/weekly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart, force: true }),
      });

      if (response.ok) {
        await loadData();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to regenerate report");
      }
    } catch (err) {
      setError("Failed to regenerate report");
    } finally {
      setIsRegenerating(false);
    }
  }

  const formatWeekRange = (start: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${startDate.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", options)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || "Failed to load report"}</p>
        <Button onClick={loadData}>Try Again</Button>
      </div>
    );
  }

  const { report, previousWeek } = reportData;
  const gradeColor = getGradeColor(report.overallGrade || "C");

  // Calculate week-over-week changes
  const sessionsDiff = previousWeek
    ? report.sessionsCount - previousWeek.sessionsCount
    : 0;
  const xpDiff = previousWeek ? report.xpEarned - previousWeek.xpEarned : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/progress">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Weekly Report</h1>
            <p className="text-muted-foreground">
              Your performance summary and coaching insights
            </p>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 py-2 bg-muted rounded-lg min-w-[180px] text-center">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatWeekRange(weekStart)}</span>
            </div>
            {currentWeekOffset === 0 && (
              <span className="text-xs text-muted-foreground">This Week</span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
            disabled={currentWeekOffset >= 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      {gamificationData && (
        <div className="flex items-center justify-end gap-4">
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

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Overall Grade */}
        <Card className="border-primary/20 bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={cn("text-5xl font-bold", gradeColor)}>
                {report.overallGrade || "N/A"}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overall Grade</p>
                {previousWeek?.overallGrade && (
                  <p className="text-xs text-muted-foreground">
                    was {previousWeek.overallGrade}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{report.sessionsCount}</p>
                <p className="text-sm text-muted-foreground">Sessions</p>
                {sessionsDiff !== 0 && (
                  <p
                    className={cn(
                      "text-xs",
                      sessionsDiff > 0 ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {sessionsDiff > 0 ? "+" : ""}
                    {sessionsDiff} vs last week
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Practice Time */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Clock className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{report.totalPracticeMinutes}</p>
                <p className="text-sm text-muted-foreground">Minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* XP Earned */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  +{report.xpEarned}
                </p>
                <p className="text-sm text-muted-foreground">XP Earned</p>
                {xpDiff !== 0 && (
                  <p
                    className={cn(
                      "text-xs",
                      xpDiff > 0 ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {xpDiff > 0 ? "+" : ""}
                    {xpDiff} vs last week
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Skills */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skill Grades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Skill Performance
              </CardTitle>
              <CardDescription>
                Your grades across all skill areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SkillTrendChart
                skillGrades={report.skillGrades}
                skillChanges={report.skillChanges}
              />
            </CardContent>
          </Card>

          {/* Coaching Insights */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Coaching Insights
                </CardTitle>
                <CardDescription>
                  AI-powered recommendations based on your performance
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Refresh</span>
              </Button>
            </CardHeader>
            <CardContent>
              <CoachingInsights insights={report.coachingInsights} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Compliance & Progress */}
        <div className="space-y-6">
          {/* Compliance Score */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Score</CardTitle>
              <CardDescription>
                Nevada real estate regulation adherence
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ComplianceGauge
                score={report.complianceScore}
                issuesCount={report.complianceIssuesCount}
                size="lg"
              />
            </CardContent>
          </Card>

          {/* Streak Info */}
          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Flame className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-500">
                    {report.streakDays || 0} Days
                  </p>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* XP Progress */}
          {gamificationData && (
            <Card className="border-primary/20 bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Level Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <XpProgressBar
                  currentXp={gamificationData.progress.totalXp}
                  xpToNextLevel={gamificationData.progress.xpToNextLevel}
                  currentLevel={gamificationData.progress.currentLevel}
                  xpProgress={gamificationData.progress.xpProgress}
                  size="sm"
                />
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Keep Improving</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="gold" asChild>
                <Link href="/drills/daily">
                  <Target className="h-4 w-4 mr-2" />
                  Daily Drill
                </Link>
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/roleplay">
                  Start Roleplay Session
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getGradeColor(grade: string): string {
  if (grade.startsWith("A")) return "text-green-500";
  if (grade.startsWith("B")) return "text-blue-500";
  if (grade.startsWith("C")) return "text-yellow-500";
  if (grade.startsWith("D")) return "text-orange-500";
  return "text-red-500";
}
