import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, Mail, MessageSquare, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Application Received | Roleplay Pros",
  description: "Your early access application has been received. We're verifying your license information.",
};

export default function ConfirmationPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        {/* Success Icon */}
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>

        {/* Header */}
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Application Received!
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Thank you for applying to Roleplay Pros&apos;s early access program.
        </p>
      </div>

      {/* Verification Info Card */}
      <Card className="mt-8 border-primary/20 bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                License Verification in Progress
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Our team is reviewing your application and verifying your real estate
                license information. This typically takes <strong className="text-primary">up to 1 hour</strong> during
                business hours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What to Expect */}
      <div className="mt-8 space-y-4">
        <h3 className="text-center font-semibold text-foreground">
          What happens next?
        </h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-primary/10 bg-muted/30 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              1
            </div>
            <div>
              <p className="font-medium text-foreground">We verify your license</p>
              <p className="text-sm text-muted-foreground">
                Our team confirms your real estate license is active and in good standing
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-primary/10 bg-muted/30 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              2
            </div>
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-foreground">Check your email</p>
                <p className="text-sm text-muted-foreground">
                  You&apos;ll receive a &quot;You&apos;re Approved&quot; email with a magic link to access your dashboard
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-primary/10 bg-muted/30 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              3
            </div>
            <div className="flex items-start gap-2">
              <MessageSquare className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-foreground">Get a text notification</p>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll also send you an SMS so you know the moment you&apos;re approved
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-primary/10 bg-muted/30 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              4
            </div>
            <div>
              <p className="font-medium text-foreground">Start training!</p>
              <p className="text-sm text-muted-foreground">
                Click the magic link and start your first AI roleplay session immediately
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          Want to learn more while you wait?
        </p>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/">
            Explore Roleplay Pros Features
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Support */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Questions? Contact us at{" "}
        <a
          href="mailto:support@roleplaypros.com"
          className="text-primary hover:underline"
        >
          support@roleplaypros.com
        </a>
      </p>
    </div>
  );
}
