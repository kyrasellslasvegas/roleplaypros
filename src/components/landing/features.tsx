import {
  Mic,
  Brain,
  Shield,
  Target,
  TrendingUp,
  FileCheck,
  Users,
  Zap,
  Clock,
} from "lucide-react";

const features = [
  {
    name: "AI Buyer Roleplay",
    description:
      "Practice with AI buyers featuring realistic personalities. First-time buyers, investors, skeptics - each with unique objections and behaviors.",
    icon: Users,
  },
  {
    name: "Real-Time Voice Conversations",
    description:
      "Natural voice conversations with interruptions, pauses, and human-like reactions. The AI buyer responds to your tone, confidence, and word choice.",
    icon: Mic,
  },
  {
    name: "AI Sales Coach",
    description:
      "Get immediate feedback after each session. Learn what you said wrong, what you missed, and exactly how to fix it. Firm, direct, focused on results.",
    icon: Brain,
  },
  {
    name: "Nevada Compliance Guard",
    description:
      "Real-time monitoring for legal, ethical, and licensing violations. Know instantly when you cross a line before it costs you your license.",
    icon: Shield,
  },
  {
    name: "5-Phase Script System",
    description:
      "Master the proven sales process: Rapport, Money Questions, Deep Questions, Frame, and Close. Teleprompter-guided scripts for every scenario.",
    icon: FileCheck,
  },
  {
    name: "Daily Objection Drills",
    description:
      "5-minute daily drills on the 'Objection of the Day'. Handle price objections, trust issues, and competition concerns with confidence.",
    icon: Target,
  },
  {
    name: "Progress Tracking",
    description:
      "Weekly skill grades, compliance scores, and streak tracking. Visual proof that you are improving with every session.",
    icon: TrendingUp,
  },
  {
    name: "3 Difficulty Levels",
    description:
      "Start with guided scripts at Beginner level. Graduate to no-script Advanced mode where the AI buyer tests your every move.",
    icon: Zap,
  },
  {
    name: "Flexible Sessions",
    description:
      "Choose 10-minute quick practices, 30-minute standard sessions, or full 60-minute buyer conversations. Train on your schedule.",
    icon: Clock,
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold text-primary">
            Everything You Need
          </h2>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Train Like a Top Producer
          </p>
          <p className="mt-4 text-lg text-muted-foreground">
            Every tool you need to master real estate sales conversations.
            Practice until perfect. Then practice more.
          </p>
        </div>

        {/* Features grid */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.name} className="hover-card p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{feature.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Hook categories showcase */}
        <div className="mx-auto mt-24 max-w-4xl">
          <h3 className="text-center font-display text-2xl font-bold">
            Feedback That Hits Different
          </h3>
          <p className="mt-2 text-center text-muted-foreground">
            Our AI Sales Coach uses proven psychological hooks to drive behavior
            change
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <span className="text-sm font-semibold text-red-500">Fear</span>
              <p className="mt-1 text-sm text-muted-foreground">
                &quot;This is why you&apos;re losing deals&quot;
              </p>
            </div>

            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
              <span className="text-sm font-semibold text-orange-500">
                Shame
              </span>
              <p className="mt-1 text-sm text-muted-foreground">
                &quot;You said this... and it killed trust&quot;
              </p>
            </div>

            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
              <span className="text-sm font-semibold text-blue-500">
                Curiosity
              </span>
              <p className="mt-1 text-sm text-muted-foreground">
                &quot;Try this objection without folding&quot;
              </p>
            </div>

            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
              <span className="text-sm font-semibold text-purple-500">
                Authority
              </span>
              <p className="mt-1 text-sm text-muted-foreground">
                &quot;Nevada agents - this disclosure timing matters&quot;
              </p>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 sm:col-span-2 lg:col-span-2">
              <span className="text-sm font-semibold text-primary">Drama</span>
              <p className="mt-1 text-sm text-muted-foreground">
                Buyer: &quot;Why should I trust you?&quot; Agent: ...
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
