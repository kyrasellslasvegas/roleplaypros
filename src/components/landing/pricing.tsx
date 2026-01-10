import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Free",
    id: "free",
    price: { monthly: "$0", annually: "$0" },
    description: "Try the basics. See what AI roleplay can do.",
    features: [
      { text: "3 roleplay sessions per month", included: true },
      { text: "Beginner difficulty only", included: true },
      { text: "Basic AI buyer personalities", included: true },
      { text: "Session summaries", included: true },
      { text: "AI Sales Coach feedback", included: false },
      { text: "Compliance Guard", included: false },
      { text: "Advanced buyer profiles", included: false },
      { text: "Progress tracking", included: false },
    ],
    cta: "Get Started Free",
    featured: false,
  },
  {
    name: "Pro",
    id: "pro",
    price: { monthly: "$49", annually: "$39" },
    description: "Everything you need to become a top producer.",
    features: [
      { text: "Unlimited roleplay sessions", included: true },
      { text: "All difficulty levels", included: true },
      { text: "All AI buyer personalities", included: true },
      { text: "AI Sales Coach feedback", included: true },
      { text: "Compliance Guard", included: true },
      { text: "Daily objection drills", included: true },
      { text: "Weekly skill grades", included: true },
      { text: "Progress tracking + streaks", included: true },
    ],
    cta: "Start Pro Trial",
    featured: true,
  },
  {
    name: "Enterprise",
    id: "enterprise",
    price: { monthly: "Custom", annually: "Custom" },
    description: "For brokerages and teams who want the best.",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Team dashboard", included: true },
      { text: "Custom buyer scenarios", included: true },
      { text: "Brokerage branding", included: true },
      { text: "API access", included: true },
      { text: "Dedicated support", included: true },
      { text: "Custom compliance rules", included: true },
      { text: "Onboarding + training", included: true },
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 sm:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold text-primary">Pricing</h2>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Invest in Your Success
          </p>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that fits your goals. All plans include a 7-day free
            trial.
          </p>
        </div>

        {/* Pricing grid */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                "rounded-2xl p-8 ring-1",
                tier.featured
                  ? "bg-gradient-to-b from-primary/10 to-transparent ring-primary/50 scale-105"
                  : "bg-card ring-border"
              )}
            >
              {tier.featured && (
                <p className="mb-4 text-center text-sm font-semibold text-primary">
                  Most Popular
                </p>
              )}

              <h3 className="text-lg font-semibold text-foreground">
                {tier.name}
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                {tier.description}
              </p>

              <div className="mt-6">
                <span className="text-4xl font-bold text-foreground">
                  {tier.price.monthly}
                </span>
                {tier.price.monthly !== "Custom" && (
                  <span className="text-muted-foreground">/month</span>
                )}
              </div>

              <ul className="mt-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="h-5 w-5 shrink-0 text-primary" />
                    ) : (
                      <X className="h-5 w-5 shrink-0 text-muted-foreground/50" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        feature.included
                          ? "text-foreground"
                          : "text-muted-foreground/50"
                      )}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-8 w-full"
                variant={tier.featured ? "gold" : "outline"}
                asChild
              >
                <Link
                  href={
                    tier.id === "enterprise"
                      ? "/contact"
                      : `/signup?plan=${tier.id}`
                  }
                >
                  {tier.cta}
                </Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Money-back guarantee */}
        <p className="mt-12 text-center text-sm text-muted-foreground">
          30-day money-back guarantee. No questions asked.
        </p>
      </div>
    </section>
  );
}
