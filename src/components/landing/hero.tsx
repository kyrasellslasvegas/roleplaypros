import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Mic, Brain, Rocket } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-gold-500/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-primary/10 px-4 py-1.5">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Nevada Compliant Training
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Master Real Estate Sales with{" "}
            <span className="text-primary font-semibold">AI Roleplay</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
            Practice with realistic AI buyers. Get instant feedback from AI
            coaches. Stay compliant with Nevada real estate law. Become the
            agent who closes every deal.
          </p>

          {/* Pre-launch banner */}
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-primary/10 px-4 py-2">
            <Rocket className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Launching January 16, 2026 — Join the waitlist for early access
            </span>
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="xl" variant="gold" asChild>
              <Link href="/waitlist" className="gap-2">
                Join the Waitlist
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="#demo" className="gap-2">
                <Play className="h-4 w-4" />
                Watch Demo
              </Link>
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full border-2 border-background bg-gradient-to-br from-primary to-primary"
                />
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg
                    key={i}
                    className="h-5 w-5 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Trusted by <strong className="text-foreground">500+</strong>{" "}
                Nevada agents
              </p>
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-20 grid gap-8 sm:grid-cols-3">
          <div className="hover-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">
              Real-Time Voice AI
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Practice with AI buyers who talk, interrupt, and react like real
              humans
            </p>
          </div>

          <div className="hover-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">AI Sales Coach</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get instant feedback on every word. Fix mistakes before they cost
              you deals
            </p>
          </div>

          <div className="hover-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Compliance Guard</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Never violate Nevada real estate law. Real-time compliance
              monitoring
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
