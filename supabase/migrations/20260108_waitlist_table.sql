-- Waitlist Table Migration
-- Run this in your Supabase SQL Editor to add the waitlist functionality

-- Create the waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  source TEXT DEFAULT 'waitlist_page',
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address TEXT,
  user_agent TEXT,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for waitlist signups (no auth required)
CREATE POLICY "Anyone can join waitlist" ON public.waitlist
  FOR INSERT WITH CHECK (true);

-- Allow reading count for waitlist counter (anonymous)
CREATE POLICY "Anyone can count waitlist" ON public.waitlist
  FOR SELECT USING (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist(created_at DESC);

-- Enable realtime for waitlist counter (live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.waitlist;

-- Optional: Add some seed data for testing the counter
-- INSERT INTO public.waitlist (email, name) VALUES
--   ('test1@example.com', 'Test Agent 1'),
--   ('test2@example.com', 'Test Agent 2'),
--   ('test3@example.com', 'Test Agent 3');
