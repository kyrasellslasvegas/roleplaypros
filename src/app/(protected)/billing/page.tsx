"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  CreditCard,
  Loader2,
  Crown,
  Zap,
  Building2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/stripe/client";

interface UserProfile {
  subscription_tier: SubscriptionTier;
  subscription_status: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
}

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingPageSkeleton />}>
      <BillingPageContent />
    </Suspense>
  );
}

function BillingPageSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function BillingPageContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const searchParams = useSearchParams();

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select(
            "subscription_tier, subscription_status, current_period_end, trial_ends_at"
          )
          .eq("id", user.id)
          .single();

        setProfile(data as UserProfile);
      }
      setLoading(false);
    }

    loadProfile();
  }, []);

  async function handleUpgrade() {
    setCheckoutLoading(true);
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
      setCheckoutLoading(false);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const { url, error } = await response.json();

      if (error) {
        console.error("Portal error:", error);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error);
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentTier = profile?.subscription_tier || "free";
  const isProOrEnterprise = currentTier === "pro" || currentTier === "enterprise";
  const isTrialing = profile?.subscription_status === "trialing";
  const isPastDue = profile?.subscription_status === "past_due";

  return (
    <div className="space-y-8">
      {/* Success/Cancel Messages */}
      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-green-400">
          <CheckCircle2 className="h-5 w-5" />
          <div>
            <p className="font-medium">Welcome to Pro!</p>
            <p className="text-sm text-green-400/80">
              Your subscription is now active. Enjoy unlimited sessions!
            </p>
          </div>
        </div>
      )}

      {canceled && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-yellow-400">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Checkout canceled</p>
            <p className="text-sm text-yellow-400/80">
              No worries! You can upgrade whenever you&apos;re ready.
            </p>
          </div>
        </div>
      )}

      {isPastDue && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Payment Failed</p>
            <p className="text-sm text-red-400/80">
              Please update your payment method to continue using Pro features.
            </p>
          </div>
          <Button
            onClick={handleManageBilling}
            variant="outline"
            size="sm"
            className="ml-auto border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            Update Payment
          </Button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing settings
        </p>
      </div>

      {/* Current Plan */}
      <Card className="border-primary/20 bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan
                {isTrialing && (
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                    Trial
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isProOrEnterprise
                  ? "You have access to all features"
                  : "Upgrade to unlock unlimited sessions"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {currentTier === "free" && (
                <Badge variant="outline" className="border-gray-500 text-gray-400">
                  Free
                </Badge>
              )}
              {currentTier === "pro" && (
                <Badge className="bg-primary text-primary-foreground">
                  <Crown className="mr-1 h-3 w-3" />
                  Pro
                </Badge>
              )}
              {currentTier === "enterprise" && (
                <Badge className="bg-purple-500 text-white">
                  <Building2 className="mr-1 h-3 w-3" />
                  Enterprise
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">
              ${SUBSCRIPTION_TIERS[currentTier].price || 0}
            </span>
            <span className="text-muted-foreground">/month</span>
          </div>
          {profile?.current_period_end && isProOrEnterprise && (
            <p className="mt-2 text-sm text-muted-foreground">
              {isTrialing ? "Trial ends" : "Next billing date"}:{" "}
              {new Date(profile.current_period_end).toLocaleDateString()}
            </p>
          )}
        </CardContent>
        <CardFooter>
          {isProOrEnterprise ? (
            <Button
              onClick={handleManageBilling}
              variant="outline"
              disabled={portalLoading}
              className="border-gold-500/50 text-primary hover:bg-gold-500/10"
            >
              {portalLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              Manage Billing
            </Button>
          ) : (
            <Button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {checkoutLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Upgrade to Pro
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Pricing Cards */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Free Tier */}
          <Card
            className={`border-primary/20 bg-muted/50 ${
              currentTier === "free" ? "ring-2 ring-primary" : ""
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Free
                {currentTier === "free" && (
                  <Badge variant="outline" className="border-gold-500 text-primary">
                    Current
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Get started with the basics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2">
                {SUBSCRIPTION_TIERS.free.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Pro Tier */}
          <Card
            className={`border-primary/20 bg-muted/50 ${
              currentTier === "pro" ? "ring-2 ring-primary" : ""
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Pro
                </span>
                {currentTier === "pro" && (
                  <Badge className="bg-primary text-primary-foreground">Current</Badge>
                )}
              </CardTitle>
              <CardDescription>For serious agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-3xl font-bold">$49</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2">
                {SUBSCRIPTION_TIERS.pro.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {currentTier === "free" && (
                <Button
                  onClick={handleUpgrade}
                  disabled={checkoutLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {checkoutLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Start 7-Day Free Trial"
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Enterprise Tier */}
          <Card className="border-primary/20 bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-500" />
                Enterprise
              </CardTitle>
              <CardDescription>For teams and brokerages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-3xl font-bold">Custom</span>
              </div>
              <ul className="space-y-2">
                {SUBSCRIPTION_TIERS.enterprise.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-purple-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                asChild
              >
                <a href="mailto:sales@roleplaypros.com">Contact Sales</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* FAQ */}
      <Card className="border-primary/20 bg-muted/50">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Can I cancel anytime?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! You can cancel your subscription at any time. You&apos;ll
              continue to have access until the end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="font-medium">What happens when my trial ends?</h4>
            <p className="text-sm text-muted-foreground">
              Your card will be charged automatically. Cancel before the trial
              ends if you don&apos;t want to continue.
            </p>
          </div>
          <div>
            <h4 className="font-medium">
              What&apos;s included in the free tier?
            </h4>
            <p className="text-sm text-muted-foreground">
              Free users get 3 roleplay sessions per month with beginner
              difficulty. Upgrade to Pro for unlimited sessions and all
              difficulty levels.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
