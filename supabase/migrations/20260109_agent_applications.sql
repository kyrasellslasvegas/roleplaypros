-- Agent Applications Table Migration
-- Run this in your Supabase SQL Editor to add the agent applications functionality

-- Create the agent_applications table
CREATE TABLE IF NOT EXISTS public.agent_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Personal Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,

  -- Brokerage Information
  brokerage_name TEXT NOT NULL,
  brokerage_address TEXT NOT NULL,
  brokerage_phone TEXT NOT NULL,

  -- License Information
  is_active_agent BOOLEAN NOT NULL DEFAULT true,
  licensed_states TEXT[] NOT NULL,
  license_numbers JSONB NOT NULL,
  years_of_experience INTEGER NOT NULL,

  -- Application Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,

  -- Linked user (populated after approval)
  user_id UUID REFERENCES auth.users(id),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.agent_applications ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for agent application submissions
CREATE POLICY "Anyone can submit an agent application" ON public.agent_applications
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users with admin role to read all applications
-- For now, we'll allow any authenticated user with 'enterprise' tier to be admin
CREATE POLICY "Admins can read all applications" ON public.agent_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND subscription_tier = 'enterprise'
    )
  );

-- Allow admins to update applications (for approval/rejection)
CREATE POLICY "Admins can update applications" ON public.agent_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND subscription_tier = 'enterprise'
    )
  );

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_applications_status ON public.agent_applications(status);
CREATE INDEX IF NOT EXISTS idx_agent_applications_email ON public.agent_applications(email);
CREATE INDEX IF NOT EXISTS idx_agent_applications_created_at ON public.agent_applications(created_at DESC);

-- Trigger for updated_at (uses existing function from schema.sql)
CREATE TRIGGER update_agent_applications_updated_at
  BEFORE UPDATE ON public.agent_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add is_admin column to profiles for better admin management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Update admin policy to also check is_admin flag
DROP POLICY IF EXISTS "Admins can read all applications" ON public.agent_applications;
CREATE POLICY "Admins can read all applications" ON public.agent_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (subscription_tier = 'enterprise' OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "Admins can update applications" ON public.agent_applications;
CREATE POLICY "Admins can update applications" ON public.agent_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (subscription_tier = 'enterprise' OR is_admin = true)
    )
  );
