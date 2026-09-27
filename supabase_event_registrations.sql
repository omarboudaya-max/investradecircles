-- SQL Script to set up event_registrations table for October 13, 2026 Event
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  role TEXT,
  sector TEXT,
  photo_url TEXT,
  badge_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'confirmed',
  is_member BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure photo_url and is_member columns exist if table was already created
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS is_member BOOLEAN DEFAULT false;

-- Create Unique Index on Email to prevent duplicate registrations in Supabase
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_registrations_email ON public.event_registrations (lower(email));

-- Disable RLS for smooth client interaction (matching app standard)
ALTER TABLE public.event_registrations DISABLE ROW LEVEL SECURITY;
