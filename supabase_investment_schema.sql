-- Supabase Schema for Investment Map & Opportunities
-- Execute this SQL in your Supabase SQL Editor if you want to store investment map data in Supabase tables.

-- 1. Governorate
CREATE TABLE IF NOT EXISTS public."Governorate" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  code TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Sector
CREATE TABLE IF NOT EXISTS public."Sector" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. InvestmentProject
CREATE TABLE IF NOT EXISTS public."InvestmentProject" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_code TEXT,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  promoter_name TEXT,
  city TEXT,
  governorate_id TEXT REFERENCES public."Governorate"(id) ON DELETE SET NULL,
  sector_id TEXT REFERENCES public."Sector"(id) ON DELETE SET NULL,
  investment_required NUMERIC DEFAULT 0,
  equity_required NUMERIC DEFAULT 0,
  debt_required NUMERIC DEFAULT 0,
  minimum_ticket NUMERIC DEFAULT 0,
  maximum_ticket NUMERIC DEFAULT 0,
  expected_roi NUMERIC DEFAULT 0,
  project_duration INTEGER DEFAULT 12,
  jobs_created INTEGER DEFAULT 0,
  investment_stage TEXT DEFAULT 'EXPANSION',
  project_type TEXT DEFAULT 'INDUSTRIAL',
  seeking TEXT[] DEFAULT '{}',
  target_markets TEXT[] DEFAULT '{}',
  export_potential TEXT DEFAULT 'MEDIUM',
  infrastructure_available BOOLEAN DEFAULT true,
  land_available BOOLEAN DEFAULT true,
  strategic_value TEXT,
  description TEXT,
  is_verified BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  project_status TEXT DEFAULT 'PUBLISHED',
  email TEXT,
  phone TEXT,
  website TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ProjectView
CREATE TABLE IF NOT EXISTS public."ProjectView" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT REFERENCES public."InvestmentProject"(id) ON DELETE CASCADE,
  governorate_id TEXT,
  sector_id TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT DEFAULT 'VIEW',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. SavedInvestment
CREATE TABLE IF NOT EXISTS public."SavedInvestment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES public."InvestmentProject"(id) ON DELETE CASCADE,
  project_title TEXT,
  governorate_name TEXT,
  sector_name TEXT,
  investment_required NUMERIC,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. InvestorInterest
CREATE TABLE IF NOT EXISTS public."InvestorInterest" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT REFERENCES public."InvestmentProject"(id) ON DELETE CASCADE,
  project_title TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  investor_name TEXT NOT NULL,
  investor_email TEXT NOT NULL,
  investor_phone TEXT,
  investor_type TEXT,
  interest_type TEXT,
  proposed_amount NUMERIC,
  message TEXT,
  mode TEXT DEFAULT 'interest',
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable Row Level Security initially to match the main project setup
ALTER TABLE public."Governorate" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Sector" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."InvestmentProject" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProjectView" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."SavedInvestment" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."InvestorInterest" DISABLE ROW LEVEL SECURITY;
