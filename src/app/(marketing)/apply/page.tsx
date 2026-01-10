import { Metadata } from "next";
import { AgentApplicationForm } from "@/components/applications";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Apply for Early Access | RoleplayPro",
  description:
    "Join RoleplayPro's early access program. Complete your application and start training with AI buyers in minutes.",
};

export default function ApplyPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
          <Sparkles className="h-4 w-4" />
          Early Access Application
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Get Early Access to RoleplayPro
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Complete your application below. We verify all licenses to ensure a
          professional community of real estate agents.
        </p>
      </div>

      {/* Benefits */}
      <div className="mb-8 rounded-xl border border-primary/20 bg-primary/5 p-6">
        <h2 className="mb-3 font-semibold text-foreground">
          Early Access Benefits:
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="text-primary">&#10003;</span>
            7 days free Pro trial (normally $49/month)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">&#10003;</span>
            30% lifetime discount when you upgrade
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">&#10003;</span>
            Unlimited AI roleplay sessions
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">&#10003;</span>
            Real-time coaching feedback
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">&#10003;</span>
            Exclusive early adopter badge
          </li>
        </ul>
      </div>

      {/* Application Form */}
      <AgentApplicationForm />
    </div>
  );
}
