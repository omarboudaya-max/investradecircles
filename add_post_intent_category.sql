-- Migration: Add intent_category to Post table in Supabase
-- Run this in your Supabase Project -> SQL Editor

ALTER TABLE public."Post" 
ADD COLUMN IF NOT EXISTS intent_category TEXT DEFAULT 'ANNOUNCEMENT';

-- Create index for faster querying and filtering by intent signal
CREATE INDEX IF NOT EXISTS idx_post_intent_category 
ON public."Post"(intent_category);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
