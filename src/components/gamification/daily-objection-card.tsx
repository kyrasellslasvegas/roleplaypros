"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Target,
  Flame,
  Clock,
  CheckCircle,
  Play,
  Lightbulb,
  Zap,
} from "lucide-react";
import type { DailyObjection } from "@/types/gamification";
import { SKILL_DISPLAY_NAMES } from "@/types/gamification";

interface DailyObjectionCardProps {
  objection: DailyObjection | null;
  onStartDrill: () => void;
  onGenerateObjection?: () => void;
  isLoading?: boolean;
  isGenerating?: boolean;
  className?: string;
}

export function DailyObjectionCard({
  objection,
  onStartDrill,
  onGenerateObjection,
  isLoading = false,
  isGenerating = false,
  className,
}: DailyObjectionCardProps) {
  // No objection yet
  if (!objection) {
    return (
      <Card className={cn("border-primary/20 bg-muted/50", className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Objection of the Day</CardTitle>
              <CardDescription>5-minute voice drill</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {isGenerating
              ? "Generating your personalized objection..."
              : "Generate today's objection to start your daily drill."}
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={onGenerateObjection}
            disabled={isGenerating || !onGenerateObjection}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate Today's Objection
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Objection completed
  if (objection.completed) {
    return (
      <Card className={cn("border-green-500/30 bg-green-500/5", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Daily Drill Complete!</CardTitle>
                <CardDescription>Great work today</CardDescription>
              </div>
            </div>
            {objection.score && (
              <Badge
                className={cn(
                  "text-lg px-3 py-1",
                  objection.score >= 90
                    ? "bg-green-500/20 text-green-400"
                    : objection.score >= 80
                    ? "bg-blue-500/20 text-blue-400"
                    : objection.score >= 70
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-orange-500/20 text-orange-400"
                )}
              >
                {objection.feedback?.grade || `${objection.score}%`}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-sm italic">"{objection.objectionText}"</p>
          </div>
          {objection.feedback && (
            <div className="space-y-2">
              <p className="text-sm">{objection.feedback.summary}</p>
              {objection.feedback.strengths.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-green-400">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{objection.feedback.strengths[0]}</span>
                </div>
              )}
            </div>
          )}
          {objection.xpEarned > 0 && (
            <div className="flex items-center gap-2 text-primary">
              <Zap className="h-4 w-4" />
              <span className="font-semibold">+{objection.xpEarned} XP earned</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Active objection ready to start
  return (
    <Card className={cn("border-primary/20 bg-muted/50", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Objection of the Day</CardTitle>
              <CardDescription>5-minute voice drill</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-blue-500/50 text-blue-400">
              <Clock className="h-3 w-3 mr-1" />5 min
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                objection.difficulty === "beginner"
                  ? "border-green-500/50 text-green-400"
                  : objection.difficulty === "intermediate"
                  ? "border-yellow-500/50 text-yellow-400"
                  : "border-red-500/50 text-red-400"
              )}
            >
              {objection.difficulty}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* The objection */}
        <div className="p-4 rounded-lg bg-muted/30 border border-muted">
          <p className="text-lg font-medium italic">"{objection.objectionText}"</p>
        </div>

        {/* Target skill */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4" />
          <span>
            Targeting:{" "}
            <span className="text-foreground font-medium">
              {SKILL_DISPLAY_NAMES[objection.targetSkill] || objection.targetSkill}
            </span>
          </span>
        </div>

        {/* Context if available */}
        {objection.context && (
          <p className="text-sm text-muted-foreground">{objection.context}</p>
        )}

        {/* Tips */}
        {objection.tips && objection.tips.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span>Quick Tips</span>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {objection.tips.slice(0, 3).map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={onStartDrill}
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              Starting...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start Daily Drill
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
