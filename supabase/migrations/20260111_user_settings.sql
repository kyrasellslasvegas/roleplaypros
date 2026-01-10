-- User Settings Migration
-- Stores user preferences for notifications, defaults, and account settings

-- ============================================
-- USER SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,

  -- Notification Preferences
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  email_weekly_summary BOOLEAN NOT NULL DEFAULT true,
  email_session_reminders BOOLEAN NOT NULL DEFAULT true,
  email_product_updates BOOLEAN NOT NULL DEFAULT false,

  -- Practice Reminders
  reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_time TIME NOT NULL DEFAULT '09:00',
  reminder_days TEXT[] NOT NULL DEFAULT ARRAY['mon','tue','wed','thu','fri'],

  -- Default Session Settings
  default_difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (default_difficulty IN ('beginner', 'intermediate', 'advanced')),
  default_duration INTEGER NOT NULL DEFAULT 30 CHECK (default_duration IN (10, 30, 60)),

  -- Display Preferences
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for user_settings
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id
ON public.user_settings(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- AUTO-CREATE SETTINGS ON USER SIGNUP
-- Update the handle_new_user function to also create settings
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, subscription_tier)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'free')
  );

  -- Create user progress
  INSERT INTO public.user_progress (user_id)
  VALUES (NEW.id);

  -- Create user settings with defaults
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Get or create user settings
-- ============================================
CREATE OR REPLACE FUNCTION public.get_or_create_user_settings(p_user_id UUID)
RETURNS public.user_settings AS $$
DECLARE
  v_settings public.user_settings;
BEGIN
  -- Try to get existing settings
  SELECT * INTO v_settings
  FROM public.user_settings
  WHERE user_id = p_user_id;

  -- If not found, create with defaults
  IF v_settings IS NULL THEN
    INSERT INTO public.user_settings (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_settings;
  END IF;

  RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
