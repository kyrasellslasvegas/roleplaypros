import { ArrowRight, Shield, Zap, Clock } from "lucide-react";
import { WaitlistForm } from "./waitlist-form";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-24">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-primary/5 to-transparent" />
        <div className="absolute bottom-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 translate-y-1/2 rounded-full bg-primary/20 blur-[150px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-muted via-muted/95 to-background p-8 sm:p-12 lg:p-16">
          {/* Decorative elements */}
          <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[80px]" />
          <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary/15 blur-[60px]" />

          {/* Content */}
          <div className="relative mx-auto max-w-3xl text-center">
            {/* Urgency badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-primary/20 px-4 py-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Only 8 days until early access begins
              </span>
            </div>

            {/* Headline */}
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Don't Wait Until Launch Day
            </h2>
            <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
              The agents who join now will have a{" "}
              <strong className="text-primary">7-day head start</strong>. While
              others are just signing up, you'll already be closing more deals.
            </p>

            {/* Benefits reminder */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/50 p-4">
                <Zap className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-white">
                  Early Access
                </span>
                <span className="text-xs text-muted-foreground">Jan 9th</span>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/50 p-4">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-white">
                  30% Forever
                </span>
                <span className="text-xs text-muted-foreground">Founder Rate</span>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/50 p-4">
                <ArrowRight className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-white">
                  14-Day Trial
                </span>
                <span className="text-xs text-muted-foreground">No CC Required</span>
              </div>
            </div>

            {/* Form */}
            <div className="mt-10">
              <WaitlistForm showName variant="default" />
            </div>

            {/* Final nudge */}
            <p className="mt-6 text-sm text-muted-foreground">
              Join{" "}
              <strong className="text-primary">1,247+ agents</strong> already
              on the waitlist. Your competition is signing up—are you?
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
