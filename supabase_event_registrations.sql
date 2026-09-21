-- SQL Script to set up event_registrations table for October 7, 2026 Event
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  role TEXT,
  sector TEXT,
  interests TEXT[],
  badge_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable RLS for smooth client interaction (matching app standard)
ALTER TABLE public.event_registrations DISABLE ROW LEVEL SECURITY;
