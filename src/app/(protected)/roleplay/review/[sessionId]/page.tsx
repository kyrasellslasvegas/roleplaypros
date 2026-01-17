"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Loader2,
  Trophy,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Target,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionFeedback, TranscriptEntry } from "@/types/session";

interface SessionData {
  id: string;
  difficulty: string;
  duration_minutes: number;
  score: number | null;
  feedback: SessionFeedback | null;
  transcript: TranscriptEntry[] | null;
  analysis_status: string;
  created_at: string;
  buyer_profile: {
    experienceLevel: string;
    emotionalState: string;
    resistanceLevel: string;
  } | null;
}

export default function ReviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Retry analysis manually
  const retryAnalysis = useCallback(async () => {
    if (!session) return;
    setIsRetrying(true);

    try {
      const response = await fetch("/api/ai/coach/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        // Refetch session data
        const { data } = await supabase
          .from("training_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (data) {
          setSession(data as SessionData);
        }
      }
    } catch (err) {
      console.error("Error retrying analysis:", err);
    } finally {
      setIsRetrying(false);
    }
  }, [session, sessionId, supabase]);

  useEffect(() => {
    async function fetchSession() {
      try {
        const { data, error: fetchError } = await supabase
          .from("training_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (fetchError) throw fetchError;
        setSession(data as SessionData);

        // If still processing, poll for completion (max 20 polls = 60 seconds)
        if (data.analysis_status === "processing") {
          const interval = setInterval(async () => {
            setPollCount(prev => prev + 1);

            const { data: updated } = await supabase
              .from("training_sessions")
              .select("*")
              .eq("id", sessionId)
              .single();

            if (updated && updated.analysis_status !== "processing") {
              setSession(updated as SessionData);
              clearInterval(interval);
            }
          }, 3000);

          // Stop polling after 60 seconds
          setTimeout(() => clearInterval(interval), 60000);

          return () => clearInterval(interval);
        }
      } catch (err) {
        console.error("Error fetching session:", err);
        setError("Failed to load session feedback");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSession();
  }, [sessionId, supabase]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-gold-500" />
        <p className="text-lg text-muted-foreground">Loading your feedback...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg text-red-500">{error || "Session not found"}</p>
        <Button onClick={() => router.push("/roleplay")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Training
        </Button>
      </div>
    );
  }

  if (session.analysis_status === "processing") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-gold-500" />
        <p className="text-lg text-muted-foreground">
          Analyzing your session...
        </p>
        <p className="text-sm text-muted-foreground/60">
          This usually takes about 30 seconds
        </p>
        {pollCount > 10 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Taking longer than expected?
            </p>
            <Button
              variant="outline"
              onClick={retryAnalysis}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Analysis
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  const feedback = session.feedback;

  return (
    <div className="container max-w-5xl py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/roleplay")}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Training
          </Button>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Session Review
          </h1>
          <p className="mt-1 text-muted-foreground">
            {new Date(session.created_at).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {feedback && (
          <div className="text-right">
            <div className="text-5xl font-bold text-gold-500">
              {feedback.overallGrade}
            </div>
            <p className="text-sm text-muted-foreground">Overall Grade</p>
          </div>
        )}
      </div>

      {/* Session info */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Clock className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{session.duration_minutes}</p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">
                {session.transcript?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Exchanges</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Target className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold capitalize">
                {session.difficulty}
              </p>
              <p className="text-xs text-muted-foreground">Difficulty</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Trophy className="h-8 w-8 text-gold-500" />
            <div>
              <p className="text-2xl font-bold">{session.score || "—"}</p>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {feedback ? (
        <>
          {/* Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Session Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{feedback.overallSummary}</p>
            </CardContent>
          </Card>

          {/* Skill grades */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Skill Breakdown</CardTitle>
              <CardDescription>
                Performance across key real estate sales skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {feedback.skillGrades.map((skill) => (
                  <div
                    key={skill.skill}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{skill.skill}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {skill.notes}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "ml-4 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold",
                        skill.grade.startsWith("A")
                          ? "bg-green-500/10 text-green-500"
                          : skill.grade.startsWith("B")
                          ? "bg-blue-500/10 text-blue-500"
                          : skill.grade.startsWith("C")
                          ? "bg-orange-500/10 text-orange-500"
                          : "bg-red-500/10 text-red-500"
                      )}
                    >
                      {skill.grade}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strengths and improvements */}
          <div className="mb-8 grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {feedback.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      <div>
                        {typeof strength === "string" ? (
                          <span className="text-sm text-muted-foreground">{strength}</span>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-foreground">{strength.title}</p>
                            <p className="text-sm text-muted-foreground">{strength.description}</p>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-500" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {feedback.areasForImprovement.map((area, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                      <div>
                        {typeof area === "string" ? (
                          <span className="text-sm text-muted-foreground">{area}</span>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">{area.title}</p>
                              {area.priority === "critical" && (
                                <span className="text-xs bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded">Critical</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{area.description}</p>
                            {area.practiceExercise && (
                              <p className="text-xs text-primary mt-1 italic">Practice: {area.practiceExercise}</p>
                            )}
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Compliance issues */}
          {feedback.complianceIssues.length > 0 && (
            <Card className="mb-8 border-red-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                  Compliance Issues
                </CardTitle>
                <CardDescription>
                  Important items to address for Nevada real estate compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {feedback.complianceIssues.map((issue, i) => (
                    <li
                      key={i}
                      className={cn(
                        "rounded-lg border p-4",
                        issue.severity === "critical"
                          ? "border-red-500/50 bg-red-500/5"
                          : issue.severity === "major"
                          ? "border-orange-500/50 bg-orange-500/5"
                          : "border-yellow-500/50 bg-yellow-500/5"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={cn(
                            "text-xs font-semibold uppercase",
                            issue.severity === "critical"
                              ? "text-red-500"
                              : issue.severity === "major"
                              ? "text-orange-500"
                              : "text-yellow-500"
                          )}
                        >
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">
                        {issue.description}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        <strong>Suggestion:</strong> {issue.suggestion}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Next focus */}
          <Card className="border-gold-500/30 bg-gold-500/5">
            <CardHeader>
              <CardTitle className="text-gold-500">
                Focus for Next Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              {typeof feedback.nextSessionFocus === "string" ? (
                <p className="text-foreground">{feedback.nextSessionFocus}</p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-primary">Primary Focus:</p>
                    <p className="text-foreground">{feedback.nextSessionFocus.primary}</p>
                  </div>
                  {feedback.nextSessionFocus.secondary && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Secondary:</p>
                      <p className="text-sm text-muted-foreground">{feedback.nextSessionFocus.secondary}</p>
                    </div>
                  )}
                  {feedback.nextSessionFocus.drillRecommendation && (
                    <div className="mt-2 p-3 bg-primary/10 rounded-lg">
                      <p className="text-sm font-medium text-primary">Recommended Drill:</p>
                      <p className="text-sm text-foreground">{feedback.nextSessionFocus.drillRecommendation}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coaching Script */}
          {feedback.coachingScript && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Coach&apos;s Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground italic">&ldquo;{feedback.coachingScript}&rdquo;</p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No detailed feedback available for this session.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="mt-8 flex justify-center gap-4">
        <Button variant="outline" onClick={() => router.push("/progress")}>
          View Progress
        </Button>
        <Button variant="gold" onClick={() => router.push("/roleplay")}>
          Start New Session
        </Button>
      </div>
    </div>
  );
}
