-- Supabase Schema Initialization for Investraders
-- You can copy and paste this into the Supabase SQL Editor

-- 1. profiles (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  headline TEXT,
  location TEXT,
  bio TEXT,
  user_type TEXT,
  business_type TEXT,
  role TEXT DEFAULT 'user',
  reputation INTEGER DEFAULT 0,
  is_onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Circle
CREATE TABLE public."Circle" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  privacy TEXT DEFAULT 'public',
  tags TEXT[],
  website_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_label TEXT,
  member_ids UUID[] DEFAULT '{}',
  moderator_ids UUID[] DEFAULT '{}',
  created_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ai_cached_data JSONB DEFAULT NULL,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CircleInvite
CREATE TABLE public."CircleInvite" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES public."Circle"(id) ON DELETE CASCADE,
  circle_name TEXT,
  inviter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  inviter_name TEXT,
  invitee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT,
  status TEXT DEFAULT 'pending',
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CircleEvent
CREATE TABLE public."CircleEvent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES public."Circle"(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  session_active BOOLEAN DEFAULT false,
  author_name TEXT,
  created_by_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CircleQuestion
CREATE TABLE public."CircleQuestion" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES public."Circle"(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_number INTEGER,
  total_members INTEGER,
  status TEXT DEFAULT 'open',
  closes_at TIMESTAMP WITH TIME ZONE,
  created_by_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. CircleResponse
CREATE TABLE public."CircleResponse" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES public."Circle"(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public."CircleQuestion"(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  author_name TEXT,
  author_avatar TEXT,
  upvoted_by UUID[] DEFAULT '{}',
  downvoted_by UUID[] DEFAULT '{}',
  created_by_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Post
CREATE TABLE public."Post" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES public."Circle"(id) ON DELETE CASCADE,
  created_by_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT,
  author_avatar TEXT,
  visibility TEXT DEFAULT 'public',
  post_type TEXT DEFAULT 'text',
  content TEXT,
  image_url TEXT,
  video_url TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  likes INTEGER DEFAULT 0,
  liked_by UUID[] DEFAULT '{}',
  saved_by UUID[] DEFAULT '{}',
  reactions JSONB DEFAULT '{}'::jsonb,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Comment
CREATE TABLE public."Comment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public."Post"(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES public."Circle"(id) ON DELETE CASCADE,
  created_by_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT,
  author_avatar TEXT,
  content TEXT NOT NULL,
  reactions JSONB DEFAULT '{}'::jsonb,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Story
CREATE TABLE public."Story" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT,
  author_avatar TEXT,
  text TEXT,
  image_url TEXT,
  video_url TEXT,
  bg_gradient TEXT,
  viewed_by UUID[] DEFAULT '{}',
  reactions JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. DirectMessage
CREATE TABLE public."DirectMessage" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender_name TEXT,
  sender_avatar TEXT,
  is_read BOOLEAN DEFAULT false,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Notification
CREATE TABLE public."Notification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  circle_id UUID REFERENCES public."Circle"(id) ON DELETE CASCADE,
  circle_name TEXT,
  is_read BOOLEAN DEFAULT false,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. MarketData
CREATE TABLE public."MarketData" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  price NUMERIC,
  change_pct NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. ProductComment
CREATE TABLE public."ProductComment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES public."Circle"(id) ON DELETE CASCADE,
  product_category TEXT NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT,
  sentiment TEXT,
  sentiment_score NUMERIC,
  created_by_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. SavedProduct
CREATE TABLE public."SavedProduct" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES public."Circle"(id) ON DELETE CASCADE,
  product_category TEXT,
  brand_name TEXT,
  last_known_price NUMERIC,
  last_known_price_min NUMERIC,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. ProductClick
CREATE TABLE public."ProductClick" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES public."Circle"(id) ON DELETE CASCADE,
  product_category TEXT,
  brand_name TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Connection
CREATE TABLE public."Connection" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 17. AuditLog
CREATE TABLE public."AuditLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_name TEXT,
  action TEXT NOT NULL,
  details TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: We disable Row Level Security here so that the app works initially without permission denied errors.
-- In a production environment, you would enable RLS and write policies for each table.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Circle" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."CircleInvite" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."CircleEvent" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."CircleQuestion" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."CircleResponse" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Post" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Comment" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Story" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."DirectMessage" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notification" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."MarketData" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProductComment" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."SavedProduct" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProductClick" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Connection" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditLog" DISABLE ROW LEVEL SECURITY;


-- AuditLog Table
CREATE TABLE public."AuditLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details TEXT,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_name TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public."AuditLog" DISABLE ROW LEVEL SECURITY;

