"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Crown, Loader2, Zap } from "lucide-react";
import { SUBSCRIPTION_TIERS } from "@/lib/stripe/client";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: "session_limit" | "feature_locked" | "general";
  sessionsUsed?: number;
  sessionsLimit?: number;
}

export function UpgradeModal({
  open,
  onOpenChange,
  reason = "general",
  sessionsUsed = 0,
  sessionsLimit = 3,
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "pro" }),
      });

      const { url, error } = await response.json();

      if (error) {
        console.error("Checkout error:", error);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
    } finally {
      setLoading(false);
    }
  }

  const getTitle = () => {
    switch (reason) {
      case "session_limit":
        return "You've reached your session limit";
      case "feature_locked":
        return "This feature requires Pro";
      default:
        return "Upgrade to Pro";
    }
  };

  const getDescription = () => {
    switch (reason) {
      case "session_limit":
        return `You've used ${sessionsUsed} of ${sessionsLimit} free sessions this month. Upgrade to Pro for unlimited sessions.`;
      case "feature_locked":
        return "Unlock all difficulty levels, advanced coaching, and unlimited sessions.";
      default:
        return "Take your sales training to the next level with unlimited access.";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-primary/20 bg-background sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-6 w-6 text-primary" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Price */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-foreground">$49</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="mt-1 text-sm text-primary">Start with a 7-day free trial</p>
          </div>

          {/* Features */}
          <ul className="space-y-2">
            {SUBSCRIPTION_TIERS.pro.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="lg"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Start Free Trial
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
