"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SubscriptionTier } from "@/lib/stripe/client";

interface SubscriptionState {
  tier: SubscriptionTier;
  status: string | null;
  isProOrEnterprise: boolean;
  isTrialing: boolean;
  canStartSession: boolean;
  sessionsUsed: number;
  sessionsLimit: number;
  loading: boolean;
  error: string | null;
}

const FREE_SESSION_LIMIT = 3;

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    tier: "free",
    status: null,
    isProOrEnterprise: false,
    isTrialing: false,
    canStartSession: true,
    sessionsUsed: 0,
    sessionsLimit: FREE_SESSION_LIMIT,
    loading: true,
    error: null,
  });

  const loadSubscription = useCallback(async () => {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState((prev) => ({ ...prev, loading: false, error: "Not authenticated" }));
        return;
      }

      // Get profile with subscription info
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("subscription_tier, subscription_status")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setState((prev) => ({ ...prev, loading: false, error: profileError.message }));
        return;
      }

      const tier = (profile?.subscription_tier || "free") as SubscriptionTier;
      const status = profile?.subscription_status || null;
      const isProOrEnterprise = tier === "pro" || tier === "enterprise";
      const isTrialing = status === "trialing";

      // If Pro/Enterprise, they can always start sessions
      if (isProOrEnterprise && (status === "active" || status === "trialing")) {
        setState({
          tier,
          status,
          isProOrEnterprise: true,
          isTrialing,
          canStartSession: true,
          sessionsUsed: 0,
          sessionsLimit: Infinity,
          loading: false,
          error: null,
        });
        return;
      }

      // For free tier, check usage
      const periodStart = new Date();
      periodStart.setDate(1);
      periodStart.setHours(0, 0, 0, 0);

      const { data: usage } = await supabase
        .from("usage_tracking")
        .select("sessions_used")
        .eq("user_id", user.id)
        .eq("period_start", periodStart.toISOString().split("T")[0])
        .single();

      const sessionsUsed = usage?.sessions_used || 0;
      const canStartSession = sessionsUsed < FREE_SESSION_LIMIT;

      setState({
        tier,
        status,
        isProOrEnterprise: false,
        isTrialing: false,
        canStartSession,
        sessionsUsed,
        sessionsLimit: FREE_SESSION_LIMIT,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, []);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  return {
    ...state,
    refresh: loadSubscription,
  };
}
