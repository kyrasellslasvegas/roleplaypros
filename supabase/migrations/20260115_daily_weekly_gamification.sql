-- ============================================
-- DAILY/WEEKLY FEATURES & GAMIFICATION
-- Migration: 20260115_daily_weekly_gamification.sql
-- ============================================

-- ============================================
-- ACHIEVEMENTS TABLE (Reference/Config)
-- Static achievement definitions
-- ============================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('beginner', 'streak', 'skill', 'volume', 'special')),
  xp_reward INTEGER NOT NULL DEFAULT 50,
  requirement JSONB NOT NULL,
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default achievements
INSERT INTO public.achievements (id, name, description, icon_name, category, xp_reward, requirement, tier, sort_order) VALUES
-- Beginner achievements
('first_session', 'First Blood', 'Complete your first roleplay session', 'Sword', 'beginner', 25, '{"type": "sessions", "count": 1}', 'bronze', 1),
('first_drill', 'Daily Warrior', 'Complete your first daily drill', 'Target', 'beginner', 25, '{"type": "drills", "count": 1}', 'bronze', 2),
('first_grade_b', 'Getting Warmer', 'Achieve a B grade or higher on a session', 'ThermometerSun', 'beginner', 50, '{"type": "min_grade", "grade": "B"}', 'bronze', 3),

-- Streak achievements
('streak_3', 'Consistent', 'Maintain a 3-day practice streak', 'Flame', 'streak', 50, '{"type": "streak", "days": 3}', 'bronze', 10),
('streak_7', '7-Day Warrior', 'Maintain a 7-day practice streak', 'Flame', 'streak', 100, '{"type": "streak", "days": 7}', 'silver', 11),
('streak_14', 'Two Week Terror', 'Maintain a 14-day practice streak', 'Flame', 'streak', 150, '{"type": "streak", "days": 14}', 'silver', 12),
('streak_30', 'Month of Mastery', 'Maintain a 30-day practice streak', 'Flame', 'streak', 300, '{"type": "streak", "days": 30}', 'gold', 13),
('streak_60', 'Iron Will', 'Maintain a 60-day practice streak', 'Flame', 'streak', 500, '{"type": "streak", "days": 60}', 'platinum', 14),

-- Skill achievements
('objection_master', 'Objection Master', 'Achieve an A grade in Objection Handling', 'Shield', 'skill', 150, '{"type": "skill_grade", "skill": "objection_handling", "minGrade": "A"}', 'gold', 20),
('rapport_builder', 'Rapport Builder', 'Achieve an A grade in Building Rapport', 'Heart', 'skill', 150, '{"type": "skill_grade", "skill": "building_rapport", "minGrade": "A"}', 'gold', 21),
('money_maven', 'Money Maven', 'Achieve an A grade in Money Questions', 'DollarSign', 'skill', 150, '{"type": "skill_grade", "skill": "money_questions", "minGrade": "A"}', 'gold', 22),
('deep_diver', 'Deep Diver', 'Achieve an A grade in Deep Questions', 'Layers', 'skill', 150, '{"type": "skill_grade", "skill": "deep_questions", "minGrade": "A"}', 'gold', 23),
('closer', 'The Closer', 'Achieve an A grade in Closing', 'CheckCircle', 'skill', 150, '{"type": "skill_grade", "skill": "closing", "minGrade": "A"}', 'gold', 24),
('frame_master', 'Frame Master', 'Achieve an A grade in Frame Control', 'Frame', 'skill', 150, '{"type": "skill_grade", "skill": "frame_control", "minGrade": "A"}', 'gold', 25),

-- Volume achievements
('sessions_10', 'Getting Started', 'Complete 10 roleplay sessions', 'Users', 'volume', 100, '{"type": "sessions", "count": 10}', 'bronze', 30),
('sessions_25', 'Dedicated', 'Complete 25 roleplay sessions', 'Users', 'volume', 150, '{"type": "sessions", "count": 25}', 'silver', 31),
('sessions_50', 'Committed', 'Complete 50 roleplay sessions', 'Users', 'volume', 250, '{"type": "sessions", "count": 50}', 'gold', 32),
('sessions_100', 'Century Club', 'Complete 100 roleplay sessions', 'Trophy', 'volume', 500, '{"type": "sessions", "count": 100}', 'platinum', 33),
('drills_10', 'Drill Sergeant', 'Complete 10 daily drills', 'Target', 'volume', 75, '{"type": "drills", "count": 10}', 'bronze', 34),
('drills_50', 'Drill Master', 'Complete 50 daily drills', 'Target', 'volume', 200, '{"type": "drills", "count": 50}', 'gold', 35),
('practice_hours_10', 'Ten Hour Club', 'Accumulate 10 hours of practice', 'Clock', 'volume', 150, '{"type": "practice_minutes", "minutes": 600}', 'silver', 36),
('practice_hours_50', 'Fifty Hour Club', 'Accumulate 50 hours of practice', 'Clock', 'volume', 400, '{"type": "practice_minutes", "minutes": 3000}', 'platinum', 37),

-- Special achievements
('perfect_compliance', 'By The Book', 'Complete a week with 100% compliance score', 'Scale', 'special', 200, '{"type": "compliance_week", "score": 100}', 'gold', 40),
('well_rounded', 'Well Rounded', 'Achieve B+ or higher in all skills', 'Star', 'special', 300, '{"type": "all_skills", "minGrade": "B+"}', 'gold', 41),
('perfect_session', 'Flawless Victory', 'Achieve an A+ grade on a session', 'Crown', 'special', 250, '{"type": "session_grade", "grade": "A+"}', 'platinum', 42),
('weekly_challenge', 'Challenge Accepted', 'Complete your first weekly challenge', 'Zap', 'special', 100, '{"type": "weekly_challenges", "count": 1}', 'silver', 43),
('weekly_dominator', 'Weekly Dominator', 'Complete 10 weekly challenges', 'Zap', 'special', 300, '{"type": "weekly_challenges", "count": 10}', 'gold', 44)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- GAMIFICATION PROGRESS TABLE
-- Tracks user's XP, level, and achievements
-- ============================================
CREATE TABLE IF NOT EXISTS public.gamification_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  xp_to_next_level INTEGER NOT NULL DEFAULT 100,
  achievements JSONB NOT NULL DEFAULT '[]',
  weekly_challenges_completed INTEGER NOT NULL DEFAULT 0,
  drills_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.gamification_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own gamification progress" ON public.gamification_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification progress" ON public.gamification_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gamification progress" ON public.gamification_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_gamification_user ON public.gamification_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_level ON public.gamification_progress(current_level DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_xp ON public.gamification_progress(total_xp DESC);

-- ============================================
-- WEEKLY CHALLENGES TABLE
-- Rotating weekly challenges
-- ============================================
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirement JSONB NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 200,
  bonus_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(week_start)
);

-- Insert some default weekly challenges (rotating pool)
INSERT INTO public.weekly_challenges (week_start, title, description, requirement, xp_reward, bonus_multiplier) VALUES
(DATE_TRUNC('week', CURRENT_DATE)::DATE, 'Drill Specialist', 'Complete 5 daily drills this week', '{"type": "drills", "count": 5}', 200, 1.5),
(DATE_TRUNC('week', CURRENT_DATE + INTERVAL '1 week')::DATE, 'Session Marathon', 'Complete 3 full roleplay sessions', '{"type": "sessions", "count": 3}', 250, 1.5),
(DATE_TRUNC('week', CURRENT_DATE + INTERVAL '2 weeks')::DATE, 'Grade Climber', 'Achieve a B+ or higher on 2 sessions', '{"type": "min_grades", "grade": "B+", "count": 2}', 300, 2.0),
(DATE_TRUNC('week', CURRENT_DATE + INTERVAL '3 weeks')::DATE, 'Compliance Champion', 'Complete a session with zero compliance violations', '{"type": "clean_compliance", "count": 1}', 200, 1.5)
ON CONFLICT (week_start) DO NOTHING;

-- ============================================
-- DAILY OBJECTIONS TABLE
-- AI-generated daily objections
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_objections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  objection_text TEXT NOT NULL,
  objection_category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  target_skill TEXT NOT NULL,
  tips JSONB NOT NULL DEFAULT '[]',
  context TEXT,
  buyer_scenario JSONB,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  drill_session_id UUID REFERENCES public.training_sessions(id),
  score INTEGER,
  feedback JSONB,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_objections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own daily objections" ON public.daily_objections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own daily objections" ON public.daily_objections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily objections" ON public.daily_objections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can manage all (for cron jobs)
CREATE POLICY "Service role manages all objections" ON public.daily_objections
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_objections_user_date ON public.daily_objections(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_objections_incomplete ON public.daily_objections(user_id, completed) WHERE completed = false;

-- ============================================
-- WEEKLY REPORTS TABLE
-- Aggregated weekly statistics
-- ============================================
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  sessions_count INTEGER NOT NULL DEFAULT 0,
  drills_count INTEGER NOT NULL DEFAULT 0,
  total_practice_minutes INTEGER NOT NULL DEFAULT 0,
  skill_grades JSONB NOT NULL DEFAULT '{}',
  skill_changes JSONB NOT NULL DEFAULT '{}',
  compliance_score INTEGER,
  compliance_issues_count INTEGER NOT NULL DEFAULT 0,
  coaching_insights JSONB NOT NULL DEFAULT '[]',
  streak_days INTEGER,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  overall_grade TEXT,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own weekly reports" ON public.weekly_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly reports" ON public.weekly_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly reports" ON public.weekly_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can manage all (for cron jobs)
CREATE POLICY "Service role manages all reports" ON public.weekly_reports
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_week ON public.weekly_reports(user_id, week_start DESC);

-- ============================================
-- USER WEEKLY CHALLENGE PROGRESS TABLE
-- Tracks user progress on weekly challenges
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  progress JSONB NOT NULL DEFAULT '{}',
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own challenge progress" ON public.user_challenge_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own challenge progress" ON public.user_challenge_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenge progress" ON public.user_challenge_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MODIFY TRAINING SESSIONS TABLE
-- Add drill-related columns
-- ============================================
ALTER TABLE public.training_sessions
ADD COLUMN IF NOT EXISTS is_drill BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS drill_type TEXT CHECK (drill_type IN ('daily_objection', 'top10', 'compliance', NULL)),
ADD COLUMN IF NOT EXISTS xp_earned INTEGER NOT NULL DEFAULT 0;

-- ============================================
-- UPDATE HANDLE_NEW_USER FUNCTION
-- Also create gamification_progress for new users
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

  -- Create gamification progress
  INSERT INTO public.gamification_progress (user_id, total_xp, current_level, xp_to_next_level, achievements)
  VALUES (NEW.id, 0, 1, 100, '[]');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get current week's challenge
CREATE OR REPLACE FUNCTION public.get_current_weekly_challenge()
RETURNS public.weekly_challenges AS $$
DECLARE
  challenge public.weekly_challenges;
BEGIN
  SELECT * INTO challenge
  FROM public.weekly_challenges
  WHERE week_start <= CURRENT_DATE
    AND week_start > CURRENT_DATE - INTERVAL '7 days'
    AND active = true
  ORDER BY week_start DESC
  LIMIT 1;

  RETURN challenge;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
  level INTEGER := 1;
  xp_needed INTEGER := 100;
BEGIN
  WHILE xp >= xp_needed AND level < 50 LOOP
    level := level + 1;
    -- Exponential curve: each level requires more XP
    xp_needed := xp_needed + (level * 50);
  END LOOP;
  RETURN level;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate XP needed for next level
CREATE OR REPLACE FUNCTION public.calculate_xp_for_level(target_level INTEGER)
RETURNS INTEGER AS $$
DECLARE
  total_xp INTEGER := 0;
  lvl INTEGER := 1;
BEGIN
  WHILE lvl < target_level AND lvl < 50 LOOP
    total_xp := total_xp + (lvl * 50) + 50;
    lvl := lvl + 1;
  END LOOP;
  RETURN total_xp;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get today's objection for a user (or null if none)
CREATE OR REPLACE FUNCTION public.get_todays_objection(p_user_id UUID)
RETURNS public.daily_objections AS $$
DECLARE
  objection public.daily_objections;
BEGIN
  SELECT * INTO objection
  FROM public.daily_objections
  WHERE user_id = p_user_id
    AND date = CURRENT_DATE;

  RETURN objection;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timestamp triggers for new tables
CREATE TRIGGER update_gamification_progress_updated_at
  BEFORE UPDATE ON public.gamification_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_challenge_progress_updated_at
  BEFORE UPDATE ON public.user_challenge_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
