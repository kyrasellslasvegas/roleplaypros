"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Home,
  RotateCcw,
  Zap,
  Star,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AchievementBadge, LevelBadge } from "@/components/gamification";
import type { DailyObjection, DrillFeedback, Achievement } from "@/types/gamification";

interface ResultsData {
  objection: DailyObjection;
  feedback: DrillFeedback;
  xpEarned: number;
  newLevel?: number;
  previousLevel?: number;
  newAchievements?: Achievement[];
  transcript: Array<{ role: string; content: string }>;
  durationSeconds: number;
}

function DrillResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data");

  const [results, setResults] = useState<ResultsData | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    if (!dataParam) {
      router.push("/drills/daily");
      return;
    }

    try {
      const parsed: ResultsData = JSON.parse(decodeURIComponent(dataParam));
      setResults(parsed);

      // Show level up animation if leveled up
      if (parsed.newLevel && parsed.previousLevel && parsed.newLevel > parsed.previousLevel) {
        setTimeout(() => setShowLevelUp(true), 500);
      }
    } catch (err) {
      console.error("Error parsing results:", err);
      router.push("/drills/daily");
    }
  }, [dataParam, router]);

  if (!results) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { feedback, xpEarned, newAchievements, transcript, durationSeconds, objection } = results;
  const grade = feedback.grade || getGradeFromScore(feedback.overallScore);
  const gradeColor = getGradeColor(grade);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Level Up Modal */}
      {showLevelUp && results.newLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <Card className="w-full max-w-md border-primary/50 bg-background animate-in zoom-in-95">
            <CardContent className="pt-8 pb-6 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 mb-4">
                  <Star className="h-12 w-12 text-primary animate-pulse" />
                </div>
                <h2 className="text-3xl font-bold text-primary mb-2">Level Up!</h2>
                <p className="text-muted-foreground">
                  You've reached Level {results.newLevel}
                </p>
              </div>
              <Button
                onClick={() => setShowLevelUp(false)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-4">
          <Trophy className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Drill Complete!</h1>
        <p className="text-muted-foreground mt-2">
          Here's how you handled the objection
        </p>
      </div>

      {/* Score Card */}
      <Card className="border-primary/20 bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "text-6xl font-bold",
                  gradeColor
                )}
              >
                {grade}
              </div>
              <div>
                <p className="text-lg font-semibold">Overall Performance</p>
                <p className="text-sm text-muted-foreground">
                  {feedback.overallScore}% score
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-center">
              <div>
                <div className="flex items-center gap-1 text-primary">
                  <Zap className="h-5 w-5" />
                  <span className="text-2xl font-bold">+{xpEarned}</span>
                </div>
                <p className="text-xs text-muted-foreground">XP Earned</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-blue-400">
                  <Clock className="h-5 w-5" />
                  <span className="text-2xl font-bold">
                    {Math.floor(durationSeconds / 60)}:{(durationSeconds % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Feedback Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{feedback.summary}</p>
          </CardContent>
        </Card>

        {/* Objection Handled */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Objection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="italic text-muted-foreground">"{objection.objectionText}"</p>
            <div className="mt-2 flex gap-2">
              <Badge variant="outline">{objection.difficulty}</Badge>
              <Badge variant="outline">{objection.targetSkill}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strengths and Improvements */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Strengths */}
        <Card className="border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <CheckCircle className="h-5 w-5" />
              What You Did Well
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feedback.strengths.length > 0 ? (
              <ul className="space-y-2">
                {feedback.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                Keep practicing to identify your strengths!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Improvements */}
        <Card className="border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-500">
              <TrendingUp className="h-5 w-5" />
              Areas to Improve
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feedback.improvement ? (
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 mt-0.5 text-orange-500 flex-shrink-0" />
                <span>{feedback.improvement}</span>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Excellent work! No major improvements needed.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Achievements */}
      {newAchievements && newAchievements.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Trophy className="h-5 w-5" />
              Achievements Unlocked!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {newAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-primary/20"
                >
                  <AchievementBadge
                    achievement={{
                      ...achievement,
                      unlocked: true,
                    }}
                    size="sm"
                  />
                  <div>
                    <p className="font-medium">{achievement.name}</p>
                    <p className="text-xs text-primary">
                      +{achievement.xpReward} XP
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversation Transcript */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
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
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    entry.role === "user"
                      ? "bg-primary/20"
                      : "bg-muted"
                  )}
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    {entry.role === "user" ? "You" : "Buyer"}
                  </p>
                  {entry.content}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/drills/daily">
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again Tomorrow
          </Link>
        </Button>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
          <Link href="/roleplay">
            <ArrowRight className="h-4 w-4 mr-2" />
            Full Roleplay Session
          </Link>
        </Button>
      </div>
    </div>
  );
}

function getGradeFromScore(score: number): string {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 63) return "D";
  if (score >= 60) return "D-";
  return "F";
}

function getGradeColor(grade: string): string {
  if (grade.startsWith("A")) return "text-green-500";
  if (grade.startsWith("B")) return "text-blue-500";
  if (grade.startsWith("C")) return "text-yellow-500";
  if (grade.startsWith("D")) return "text-orange-500";
  return "text-red-500";
}

function DrillResultsLoading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
    </div>
  );
}

export default function DrillResultsPage() {
  return (
    <Suspense fallback={<DrillResultsLoading />}>
      <DrillResultsContent />
    </Suspense>
  );
}
