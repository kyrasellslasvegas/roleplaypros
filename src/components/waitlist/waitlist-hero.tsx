import { Sparkles, Rocket } from "lucide-react";
import { CountdownTimer } from "./countdown-timer";
import { WaitlistForm } from "./waitlist-form";
import { WaitlistCounter } from "./waitlist-counter";

// Launch date: January 16, 2026 at 12:01 PM PST
// PST is UTC-8, so 12:01 PM PST = 20:01 UTC
const LAUNCH_DATE = new Date("2026-01-16T20:01:00.000Z");

// Early access date: January 9, 2026 (7 days before)
const EARLY_ACCESS_DATE = new Date("2026-01-09T20:01:00.000Z");

export function WaitlistHero() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-gold-500/10 via-transparent to-transparent" />

        {/* Animated glow orbs */}
        <div className="absolute left-1/4 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[150px] animate-pulse" />
        <div
          className="absolute right-1/4 top-1/3 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-primary/15 blur-[120px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-[130px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(212, 175, 55, 0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(212, 175, 55, 0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Pre-launch badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-primary/10 px-5 py-2 backdrop-blur-sm">
            <Rocket className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              Launching January 16, 2026
            </span>
          </div>

          {/* Main headline */}
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            The Future of{" "}
            <span className="relative">
              <span className="text-primary font-semibold">Real Estate Training</span>
              <Sparkles className="absolute -right-8 -top-2 h-6 w-6 text-primary animate-pulse" />
            </span>{" "}
            is Almost Here
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Practice with AI buyers that look, sound, and react like real
            humans. Get instant coaching. Stay compliant. Become the agent who{" "}
            <strong className="text-foreground">closes every deal</strong>.
          </p>

          {/* Waitlist counter */}
          <div className="mt-8 flex justify-center">
            <WaitlistCounter />
          </div>

          {/* Countdown section */}
          <div className="mt-12">
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Official Launch In
            </p>
            <CountdownTimer targetDate={LAUNCH_DATE} />
          </div>

          {/* Early access callout */}
          <div className="mt-10 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <div className="text-center sm:text-left">
                <p className="font-display text-lg font-bold text-foreground">
                  Waitlist members get{" "}
                  <span className="text-primary">7 days early access</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start training on January 9th—a full week before everyone else.
                </p>
              </div>
            </div>
          </div>

          {/* Signup form */}
          <div className="mt-10">
            <WaitlistForm variant="compact" />
          </div>

          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Free to join
            </span>
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Unsubscribe anytime
            </span>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
