import {
  Video,
  Brain,
  Target,
  Shield,
  TrendingUp,
  Dumbbell,
  MessageSquare,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Video,
    title: "AI Video Avatars",
    description:
      "Practice with realistic AI buyers powered by HeyGen. See facial expressions, body language, and natural reactions in real-time.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "AI Sales Coach",
    description:
      "Get whispered coaching suggestions during live sessions. Your AI coach knows exactly when to guide you and when to let you shine.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Target,
    title: "Adaptive Difficulty",
    description:
      "Start with guided scripts, progress to hints-only, then go full improvisation. The AI adapts to challenge you at the right level.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Shield,
    title: "Compliance Guard",
    description:
      "Never worry about violating Nevada real estate law. Real-time monitoring catches compliance issues before they become problems.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Dumbbell,
    title: "Daily Objection Drills",
    description:
      "5-minute focused practice on the objections that trip up most agents. Build muscle memory for handling 'I need to think about it.'",
    gradient: "from-gold-500 to-amber-500",
  },
  {
    icon: MessageSquare,
    title: "Buyer Personalities",
    description:
      "Practice with skeptical engineers, emotional first-timers, aggressive negotiators, and more. Every buyer reacts differently.",
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description:
      "Track your improvement over time. See which objections you've mastered and which need more work. Celebrate your wins.",
    gradient: "from-teal-500 to-cyan-500",
  },
  {
    icon: TrendingUp,
    title: "Performance Grades",
    description:
      "Get letter grades (A-F) across key sales skills. Watch yourself progress from a B- in rapport to an A+ closer.",
    gradient: "from-rose-500 to-pink-500",
  },
];

export function FeaturesPreview() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Everything You Need to{" "}
            <span className="text-gradient-gold">Close More Deals</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            RoleplayPro combines cutting-edge AI with proven sales methodology.
            Here's a preview of what's coming.
          </p>
        </div>

        {/* Features grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:border-gold-500/30"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Hover glow */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-gold-500/0 via-gold-500/10 to-gold-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              {/* Icon */}
              <div
                className={`relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5`}
              >
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-card">
                  <feature.icon className="h-5 w-5 text-foreground" />
                </div>
              </div>

              {/* Content */}
              <h3 className="relative font-display text-lg font-bold text-foreground">
                {feature.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>

              {/* Corner accent */}
              <div className="absolute bottom-0 right-0 h-16 w-16 translate-x-8 translate-y-8 rounded-full bg-gradient-to-br from-gold-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>

        {/* Coming soon badge */}
        <div className="mt-12 text-center">
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-500" />
            </span>
            More features launching throughout 2026
          </p>
        </div>
      </div>
    </section>
  );
}
