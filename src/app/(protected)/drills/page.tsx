import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Target, Clock, Play, CheckCircle, Lock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const todaysObjection = {
  title: "Why should I trust you?",
  category: "Trust Building",
  difficulty: "Intermediate",
  description:
    "The buyer is skeptical about your expertise. They've been burned by agents before or prefer doing their own research online.",
  tips: [
    "Don't get defensive - acknowledge their concern",
    "Share a specific success story (not generic stats)",
    "Ask what would make them feel comfortable",
    "Avoid over-explaining your credentials",
  ],
  completed: false,
};

const top10Objections = [
  {
    id: 1,
    objection: '"I need to think about it"',
    solution: "Use the takeaway close. Ask what specifically they need to think about.",
    prompt: "What part of this decision feels uncertain to you right now?",
    completed: true,
  },
  {
    id: 2,
    objection: '"I\'m working with another agent"',
    solution: "Respect the relationship. Ask about their experience and timeline.",
    prompt: "That's great you have representation. What's been your experience so far?",
    completed: true,
  },
  {
    id: 3,
    objection: '"Your commission is too high"',
    solution: "Shift focus from cost to value. Quantify what you bring.",
    prompt: "I understand cost matters. Let me show you exactly what you get for that investment.",
    completed: false,
  },
  {
    id: 4,
    objection: '"I want to see more properties"',
    solution: "Qualify the real concern. Are they unsure about what they want?",
    prompt: "Help me understand - what's missing from what we've seen so far?",
    completed: false,
  },
  {
    id: 5,
    objection: '"The market is too volatile"',
    solution: "Acknowledge the concern. Provide local data, not national news.",
    prompt: "You're right to be cautious. Let me show you what's actually happening in your target area.",
    completed: false,
  },
  {
    id: 6,
    objection: '"I\'m not ready to make a decision"',
    solution: "Identify the blocker. Is it timing, finances, or fear?",
    prompt: "I hear you. What would need to change for you to feel ready?",
    completed: false,
  },
  {
    id: 7,
    objection: '"I need to talk to my spouse"',
    solution: "Respect the partnership. Offer to include them in the conversation.",
    prompt: "Absolutely. Would it be helpful if I walked through this with both of you together?",
    completed: false,
  },
  {
    id: 8,
    objection: '"Why should I trust you?"',
    solution: "Don't list credentials. Share a relevant story and ask what they need.",
    prompt: "Fair question. What would help you feel confident working with me?",
    completed: false,
  },
  {
    id: 9,
    objection: '"I can find properties myself online"',
    solution: "Agree with them. Then show your unique value beyond property search.",
    prompt: "You're right - anyone can search online. What you can't find is...",
    completed: false,
  },
  {
    id: 10,
    objection: '"What\'s your experience?"',
    solution: "Answer briefly, then redirect to their needs.",
    prompt: "I've closed X deals in your area. More importantly, tell me about your situation.",
    completed: false,
  },
];

const nevadaDrills = [
  { name: "Agency Disclosure Timing", completed: true, locked: false },
  { name: "Property Condition Disclosures", completed: false, locked: false },
  { name: "Lead-Based Paint Requirements", completed: false, locked: false },
  { name: "HOA Disclosure Requirements", completed: false, locked: true },
  { name: "Dual Agency Rules", completed: false, locked: true },
];

export default function DrillsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Daily Drills
        </h1>
        <p className="mt-1 text-muted-foreground">
          5-minute focused practice on the most common objections
        </p>
      </div>

      {/* Objection of the Day */}
      <Card className="border-gold-500/30 bg-gradient-to-br from-gold-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-gold-500" />
                Objection of the Day
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4" />
                5 minute drill
              </CardDescription>
            </div>
            {todaysObjection.completed ? (
              <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-500">
                <CheckCircle className="h-4 w-4" />
                Completed
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-sm text-orange-500">
                <Target className="h-4 w-4" />
                Not Started
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xl font-medium text-foreground">
              &quot;{todaysObjection.title}&quot;
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {todaysObjection.description}
            </p>
          </div>

          <div className="flex gap-4 text-sm">
            <div className="rounded-full bg-gold-500/10 px-3 py-1 text-gold-500">
              {todaysObjection.category}
            </div>
            <div className="rounded-full bg-blue-500/10 px-3 py-1 text-blue-500">
              {todaysObjection.difficulty}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="font-medium text-foreground mb-2">Quick Tips</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {todaysObjection.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-gold-500">-</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <Button variant="gold" size="lg" className="w-full gap-2">
            <Play className="h-5 w-5" />
            Start Daily Drill
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Top 10 Objections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-gold-500" />
              Top 10 Buyer Objections
            </CardTitle>
            <CardDescription>
              Master these and you&apos;ll close more deals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top10Objections.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-lg border p-4 transition-colors",
                    item.completed
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-border hover:border-gold-500/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {item.objection}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.solution}
                      </p>
                    </div>
                    {item.completed ? (
                      <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                    ) : (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/drills/${item.id}`}>Practice</Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nevada Disclosure Drill Pack */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-gold-500" />
              Nevada Disclosure Drill Pack
            </CardTitle>
            <CardDescription>
              Stay compliant with state requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nevadaDrills.map((drill, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-4",
                    drill.locked
                      ? "border-border bg-muted/30 opacity-60"
                      : drill.completed
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-border hover:border-gold-500/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {drill.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : drill.locked ? (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    )}
                    <span
                      className={cn(
                        "font-medium",
                        drill.locked ? "text-muted-foreground" : "text-foreground"
                      )}
                    >
                      {drill.name}
                    </span>
                  </div>
                  {!drill.locked && !drill.completed && (
                    <Button variant="ghost" size="sm">
                      Start
                    </Button>
                  )}
                  {drill.locked && (
                    <span className="text-xs text-muted-foreground">
                      Pro only
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-gold-500/30 bg-gold-500/5 p-4">
              <p className="text-sm text-foreground">
                Unlock all compliance drills with Pro
              </p>
              <Button variant="gold" size="sm" className="mt-2" asChild>
                <Link href="/signup?plan=pro">Upgrade to Pro</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
