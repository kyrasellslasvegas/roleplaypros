import Stripe from "stripe";

// Lazy-initialized Stripe client to avoid build-time errors
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// For backwards compatibility - use getStripe() instead in new code
export const stripe = {
  get customers() { return getStripe().customers; },
  get subscriptions() { return getStripe().subscriptions; },
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get webhooks() { return getStripe().webhooks; },
};

// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: 0,
    sessionsPerMonth: 3,
    features: [
      "3 roleplay sessions per month",
      "Beginner difficulty only",
      "Basic feedback",
    ],
  },
  pro: {
    name: "Pro",
    price: 49,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    sessionsPerMonth: Infinity,
    features: [
      "Unlimited roleplay sessions",
      "All difficulty levels",
      "Advanced AI coaching",
      "Detailed analytics",
      "Priority support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: null, // Custom pricing
    sessionsPerMonth: Infinity,
    features: [
      "Everything in Pro",
      "Team management",
      "Custom scenarios",
      "API access",
      "Dedicated support",
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

// Helper to check if user has active subscription
export function hasActiveSubscription(
  status: string | null,
  tier: SubscriptionTier
): boolean {
  if (tier === "free") return true;
  return status === "active" || status === "trialing";
}

// Helper to check if user can access a feature
export function canAccessFeature(
  tier: SubscriptionTier,
  feature: "unlimited_sessions" | "all_difficulties" | "advanced_coaching"
): boolean {
  switch (feature) {
    case "unlimited_sessions":
      return tier !== "free";
    case "all_difficulties":
      return tier !== "free";
    case "advanced_coaching":
      return tier !== "free";
    default:
      return false;
  }
}
