-- Stripe Billing Integration Migration
-- Adds Stripe-related columns to profiles and creates usage tracking table

-- ============================================
-- ADD STRIPE COLUMNS TO PROFILES
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Add is_admin column if it doesn't exist (for admin panel access)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- ============================================
-- USAGE TRACKING TABLE
-- Tracks session usage for free tier limits
-- ============================================
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  sessions_used INTEGER NOT NULL DEFAULT 0,
  drill_completions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);

-- Enable Row Level Security
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for usage_tracking
CREATE POLICY "Users can view own usage" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON public.usage_tracking
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can manage all usage (for API routes)
CREATE POLICY "Service role can manage all usage" ON public.usage_tracking
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period
ON public.usage_tracking(user_id, period_start);

-- Trigger for updated_at
CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SUBSCRIPTION EVENTS TABLE
-- Logs all Stripe webhook events for debugging
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access subscription events
CREATE POLICY "Service role can manage subscription events" ON public.subscription_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_subscription_events_user
ON public.subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type
ON public.subscription_events(event_type);

-- ============================================
-- HELPER FUNCTION: Get current billing period start
-- ============================================
CREATE OR REPLACE FUNCTION public.get_billing_period_start()
RETURNS DATE AS $$
BEGIN
  -- Returns the first day of the current month
  RETURN DATE_TRUNC('month', CURRENT_DATE)::DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTION: Get or create usage record
-- ============================================
CREATE OR REPLACE FUNCTION public.get_or_create_usage(p_user_id UUID)
RETURNS public.usage_tracking AS $$
DECLARE
  v_period_start DATE;
  v_usage public.usage_tracking;
BEGIN
  v_period_start := public.get_billing_period_start();

  -- Try to get existing record
  SELECT * INTO v_usage
  FROM public.usage_tracking
  WHERE user_id = p_user_id AND period_start = v_period_start;

  -- If not found, create one
  IF v_usage IS NULL THEN
    INSERT INTO public.usage_tracking (user_id, period_start, sessions_used, drill_completions)
    VALUES (p_user_id, v_period_start, 0, 0)
    RETURNING * INTO v_usage;
  END IF;

  RETURN v_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Increment session usage
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_session_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_period_start DATE;
  v_new_count INTEGER;
BEGIN
  v_period_start := public.get_billing_period_start();

  INSERT INTO public.usage_tracking (user_id, period_start, sessions_used)
  VALUES (p_user_id, v_period_start, 1)
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET
    sessions_used = public.usage_tracking.sessions_used + 1,
    updated_at = NOW()
  RETURNING sessions_used INTO v_new_count;

  RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Check if user can start session
-- Returns true if user has remaining sessions or is Pro/Enterprise
-- ============================================
CREATE OR REPLACE FUNCTION public.can_start_session(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_status TEXT;
  v_usage INTEGER;
  v_free_limit INTEGER := 3; -- Free tier gets 3 sessions per month
BEGIN
  -- Get user's subscription tier and status
  SELECT subscription_tier, COALESCE(subscription_status, 'active')
  INTO v_tier, v_status
  FROM public.profiles
  WHERE id = p_user_id;

  -- Pro and Enterprise have unlimited access
  IF v_tier IN ('pro', 'enterprise') AND v_status IN ('active', 'trialing') THEN
    RETURN true;
  END IF;

  -- For free tier, check usage
  SELECT sessions_used INTO v_usage
  FROM public.usage_tracking
  WHERE user_id = p_user_id AND period_start = public.get_billing_period_start();

  -- If no usage record, they haven't used any sessions
  IF v_usage IS NULL THEN
    RETURN true;
  END IF;

  -- Check against limit
  RETURN v_usage < v_free_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
