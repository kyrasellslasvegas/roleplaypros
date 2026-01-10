import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe/client";
import Stripe from "stripe";

// Service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Webhook events we handle
const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
]);

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Only process relevant events
  if (!relevantEvents.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  try {
    // Log the event for debugging
    await logSubscriptionEvent(event);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function logSubscriptionEvent(event: Stripe.Event) {
  // Get user ID from metadata if available
  let userId: string | null = null;

  if (event.data.object && "metadata" in event.data.object) {
    userId = (event.data.object as { metadata?: { supabase_user_id?: string } }).metadata?.supabase_user_id || null;
  }

  await supabaseAdmin.from("subscription_events").insert({
    user_id: userId,
    stripe_event_id: event.id,
    event_type: event.type,
    event_data: event.data.object as object,
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  const tier = session.metadata?.tier || "pro";

  if (!userId) {
    console.error("No user ID in checkout session metadata");
    return;
  }

  // Get subscription details
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await updateUserSubscription(userId, subscription, tier);
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  const tier = subscription.metadata?.tier || "pro";

  if (!userId) {
    // Try to find user by customer ID
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", subscription.customer as string)
      .single();

    if (profile) {
      await updateUserSubscription(profile.id, subscription, tier);
    }
    return;
  }

  await updateUserSubscription(userId, subscription, tier);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;

  let profileId = userId;

  if (!profileId) {
    // Try to find user by customer ID
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", subscription.customer as string)
      .single();

    profileId = profile?.id;
  }

  if (!profileId) {
    console.error("Could not find user for deleted subscription");
    return;
  }

  // Downgrade to free tier
  await supabaseAdmin
    .from("profiles")
    .update({
      subscription_tier: "free",
      subscription_status: "canceled",
      stripe_subscription_id: null,
      current_period_end: null,
      trial_ends_at: null,
    })
    .eq("id", profileId);

  console.log(`User ${profileId} downgraded to free tier`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Payment succeeded, subscription should already be updated
  console.log(`Payment succeeded for invoice ${invoice.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find user by customer ID
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (profile) {
    // Update subscription status to past_due
    await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: "past_due",
      })
      .eq("id", profile.id);

    console.log(`Payment failed for user ${profile.id}, status set to past_due`);
  }
}

async function updateUserSubscription(
  userId: string,
  subscription: Stripe.Subscription,
  tier: string
) {
  const status = subscription.status;
  // Access current_period_end from subscription items or cast to any for flexibility
  const subData = subscription as unknown as { current_period_end?: number; trial_end?: number | null };
  const currentPeriodEnd = subData.current_period_end
    ? new Date(subData.current_period_end * 1000)
    : new Date();
  const trialEnd = subData.trial_end
    ? new Date(subData.trial_end * 1000)
    : null;

  // Map Stripe status to our status
  let subscriptionStatus: string;
  switch (status) {
    case "active":
      subscriptionStatus = "active";
      break;
    case "trialing":
      subscriptionStatus = "trialing";
      break;
    case "past_due":
      subscriptionStatus = "past_due";
      break;
    case "canceled":
    case "unpaid":
      subscriptionStatus = "canceled";
      break;
    default:
      subscriptionStatus = "active";
  }

  await supabaseAdmin
    .from("profiles")
    .update({
      subscription_tier: tier,
      subscription_status: subscriptionStatus,
      stripe_subscription_id: subscription.id,
      current_period_end: currentPeriodEnd.toISOString(),
      trial_ends_at: trialEnd?.toISOString() || null,
    })
    .eq("id", userId);

  console.log(
    `Updated subscription for user ${userId}: tier=${tier}, status=${subscriptionStatus}`
  );
}
