import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Flame,
  Clock,
  Award,
  Target,
  Users,
  CheckCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const overallStats = {
  currentStreak: 7,
  longestStreak: 14,
  totalSessions: 47,
  totalPracticeMinutes: 1420,
  overallGrade: "B+",
  weeklyChange: "+5%",
};

const skillGrades = [
  { skill: "Building Rapport", grade: "A", trend: "up", sessions: 12 },
  { skill: "Money Questions", grade: "B+", trend: "up", sessions: 8 },
  { skill: "Deep Questions", grade: "B", trend: "stable", sessions: 10 },
  { skill: "Frame Control", grade: "C+", trend: "up", sessions: 6 },
  { skill: "Closing", grade: "B-", trend: "down", sessions: 11 },
  { skill: "Objection Handling", grade: "B", trend: "up", sessions: 15 },
];

const complianceScore = {
  score: 94,
  violations: 2,
  warnings: 5,
  lastViolation: "Missed agency disclosure timing",
};

const weeklyProgress = [
  { day: "Mon", sessions: 2, minutes: 45 },
  { day: "Tue", sessions: 1, minutes: 30 },
  { day: "Wed", sessions: 3, minutes: 60 },
  { day: "Thu", sessions: 2, minutes: 40 },
  { day: "Fri", sessions: 1, minutes: 20 },
  { day: "Sat", sessions: 0, minutes: 0 },
  { day: "Sun", sessions: 2, minutes: 35 },
];

const recentSessions = [
  {
    date: "Today",
    type: "Roleplay",
    duration: "30 min",
    grade: "A-",
    buyer: "First-time buyer, skeptical",
  },
  {
    date: "Yesterday",
    type: "Daily Drill",
    duration: "5 min",
    grade: "B+",
    buyer: "Commission objection",
  },
  {
    date: "2 days ago",
    type: "Roleplay",
    duration: "45 min",
    grade: "B",
    buyer: "Investor, dominant",
  },
  {
    date: "3 days ago",
    type: "Compliance",
    duration: "10 min",
    grade: "A",
    buyer: "Disclosure timing drill",
  },
];

const coachingInsights = [
  {
    type: "fear",
    title: "This is why you're losing deals",
    insight:
      "You asked 0 qualifying questions about budget in 3 of your last 5 sessions. Buyers who aren't qualified waste your time.",
    color: "red",
  },
  {
    type: "shame",
    title: "You said this... and it killed trust",
    insight:
      '"Let me tell you about all my certifications..." - Nobody cares about your certifications. They care about their problem.',
    color: "orange",
  },
  {
    type: "curiosity",
    title: "Try this objection without folding",
    insight:
      'When they say "I need to think about it", you cave 80% of the time. Try: "What specifically needs more thought?"',
    color: "blue",
  },
];

export default function ProgressPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Your Progress
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track your improvement and identify areas to focus on
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-orange-500/10 p-3">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold text-foreground">
                {overallStats.currentStreak}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  days
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold text-foreground">
                {overallStats.totalSessions}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-gold-500/10 p-3">
              <Award className="h-6 w-6 text-gold-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overall Grade</p>
              <p className="text-2xl font-bold text-foreground">
                {overallStats.overallGrade}{" "}
                <span className="text-sm font-normal text-green-500">
                  {overallStats.weeklyChange}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-green-500/10 p-3">
              <Clock className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Practice Time</p>
              <p className="text-2xl font-bold text-foreground">
                {Math.round(overallStats.totalPracticeMinutes / 60)}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  hours
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Skill Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-gold-500" />
              Skill Grades
            </CardTitle>
            <CardDescription>Your performance by skill area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {skillGrades.map((item) => (
                <div
                  key={item.skill}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg font-bold",
                        item.grade.startsWith("A")
                          ? "bg-green-500/10 text-green-500"
                          : item.grade.startsWith("B")
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-orange-500/10 text-orange-500"
                      )}
                    >
                      {item.grade}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.skill}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.sessions} sessions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {item.trend === "up" && (
                      <ArrowUp className="h-4 w-4 text-green-500" />
                    )}
                    {item.trend === "down" && (
                      <ArrowDown className="h-4 w-4 text-red-500" />
                    )}
                    {item.trend === "stable" && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-gold-500" />
              Compliance Score
            </CardTitle>
            <CardDescription>Nevada real estate law adherence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-6">
              <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-green-500/20">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-foreground">
                      {complianceScore.score}
                    </span>
                    <span className="text-lg text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">
                  {complianceScore.violations}
                </p>
                <p className="text-sm text-muted-foreground">Violations</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500">
                  {complianceScore.warnings}
                </p>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-red-500/5 border border-red-500/20 p-3">
              <p className="text-sm text-red-500">
                Last violation: {complianceScore.lastViolation}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gold-500" />
            This Week&apos;s Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between gap-2">
            {weeklyProgress.map((day) => (
              <div key={day.day} className="flex-1 text-center">
                <div className="mb-2 text-xs text-muted-foreground">
                  {day.day}
                </div>
                <div
                  className={cn(
                    "mx-auto h-24 w-full max-w-8 rounded-lg",
                    day.sessions > 0 ? "bg-gold-500" : "bg-muted"
                  )}
                  style={{
                    height: `${Math.max(20, day.minutes)}px`,
                    opacity: day.sessions > 0 ? 0.3 + day.sessions * 0.25 : 0.3,
                  }}
                />
                <div className="mt-2 text-sm font-medium text-foreground">
                  {day.sessions}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSessions.map((session, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/10">
                    {session.type === "Roleplay" ? (
                      <Users className="h-5 w-5 text-gold-500" />
                    ) : session.type === "Daily Drill" ? (
                      <Target className="h-5 w-5 text-gold-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-gold-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{session.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.buyer}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "font-bold",
                      session.grade.startsWith("A")
                        ? "text-green-500"
                        : session.grade.startsWith("B")
                          ? "text-blue-500"
                          : "text-orange-500"
                    )}
                  >
                    {session.grade}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {session.date} - {session.duration}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coaching Insights */}
      <div className="grid gap-4 sm:grid-cols-3">
        {coachingInsights.map((insight, index) => (
          <Card
            key={index}
            className={cn(
              "border",
              insight.color === "red"
                ? "border-red-500/20 bg-red-500/5"
                : insight.color === "orange"
                  ? "border-orange-500/20 bg-orange-500/5"
                  : "border-blue-500/20 bg-blue-500/5"
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle
                className={cn(
                  "text-sm",
                  insight.color === "red"
                    ? "text-red-500"
                    : insight.color === "orange"
                      ? "text-orange-500"
                      : "text-blue-500"
                )}
              >
                {insight.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{insight.insight}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
