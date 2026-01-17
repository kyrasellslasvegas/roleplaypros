import {
  Calendar,
  Percent,
  Crown,
  Gift,
  Clock,
  Zap,
} from "lucide-react";

const incentives = [
  {
    icon: Calendar,
    title: "7 Days Early Access",
    description:
      "Be among the first to experience Roleplay Pros before anyone else. Start training on January 9th while others wait until the 16th.",
    highlight: "Jan 9th Access",
  },
  {
    icon: Percent,
    title: "30% Lifetime Discount",
    description:
      "Lock in our Founder's Rate forever. Pay just $34/month instead of $49—saving you $180 every year for life.",
    highlight: "Save $180/year",
  },
  {
    icon: Clock,
    title: "Extended 14-Day Trial",
    description:
      "Get double the trial time to explore every feature. No credit card required. Cancel anytime if it's not for you.",
    highlight: "14 Days Free",
  },
  {
    icon: Crown,
    title: "Exclusive Buyer Personas",
    description:
      "Access 5 premium AI buyer personalities only available to founding members. Practice with the most challenging scenarios.",
    highlight: "5 Exclusive Personas",
  },
];

export function IncentivesSection() {
  return (
    <section className="relative py-24">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold-500/5 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5">
            <Gift className="h-4 w-4 text-gold-500" />
            <span className="text-sm font-medium text-gold-500">
              Founding Member Benefits
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Join Now & Get{" "}
            <span className="text-gradient-gold">Exclusive Rewards</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Early supporters get special perks that will never be offered again.
            These benefits are only for our founding members.
          </p>
        </div>

        {/* Incentives grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {incentives.map((incentive, index) => (
            <div
              key={incentive.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-gold-500/50 hover:shadow-lg hover:shadow-gold-500/10"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold-500/0 via-gold-500/5 to-gold-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Number badge */}
              <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gold-500/10 text-sm font-bold text-gold-500">
                {index + 1}
              </div>

              {/* Content */}
              <div className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/20">
                  <incentive.icon className="h-6 w-6 text-gold-500" />
                </div>

                <div className="mb-2 inline-block rounded-full bg-gold-500/20 px-2 py-0.5 text-xs font-semibold text-gold-500">
                  {incentive.highlight}
                </div>

                <h3 className="font-display text-xl font-bold text-foreground">
                  {incentive.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {incentive.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Urgency banner */}
        <div className="mt-12 flex items-center justify-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-gold-500/30 bg-obsidian-900/50 px-6 py-3 backdrop-blur-sm">
            <Zap className="h-5 w-5 text-gold-500" />
            <span className="text-sm font-medium text-foreground">
              <strong className="text-gold-500">Limited offer:</strong> First
              500 members only. Don't miss out.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
