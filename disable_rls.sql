-- ==========================================
-- DISABLE SECURITY POLICIES (DEVELOPMENT MODE)
-- ==========================================
-- Run this script if you want to turn off Row Level Security
-- and go back to how everything was working originally.

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Circle" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Post" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Comment" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notification" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."DirectMessage" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Connection" DISABLE ROW LEVEL SECURITY;

-- Drop the policies just to keep things clean
DROP POLICY IF EXISTS "Profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

DROP POLICY IF EXISTS "Circles are viewable by everyone." ON public."Circle";
DROP POLICY IF EXISTS "Authenticated users can create circles." ON public."Circle";
DROP POLICY IF EXISTS "Creators and moderators can update circle." ON public."Circle";
DROP POLICY IF EXISTS "Authenticated users can update circle." ON public."Circle";

DROP POLICY IF EXISTS "Posts are viewable by everyone." ON public."Post";
DROP POLICY IF EXISTS "Authenticated users can create posts." ON public."Post";
DROP POLICY IF EXISTS "Authenticated users can update posts (for likes/reactions)." ON public."Post";
DROP POLICY IF EXISTS "Authors can delete their own posts." ON public."Post";

DROP POLICY IF EXISTS "Comments are viewable by everyone." ON public."Comment";
DROP POLICY IF EXISTS "Authenticated users can create comments." ON public."Comment";
DROP POLICY IF EXISTS "Authenticated users can update comments." ON public."Comment";
DROP POLICY IF EXISTS "Authors can delete their own comments." ON public."Comment";

DROP POLICY IF EXISTS "Users can view own notifications." ON public."Notification";
DROP POLICY IF EXISTS "Authenticated users can insert notifications." ON public."Notification";
DROP POLICY IF EXISTS "Users can update own notifications." ON public."Notification";

DROP POLICY IF EXISTS "Connections viewable by everyone." ON public."Connection";
DROP POLICY IF EXISTS "Authenticated users can insert connections." ON public."Connection";
DROP POLICY IF EXISTS "Users can update their connections." ON public."Connection";

DROP POLICY IF EXISTS "Users can view own messages." ON public."DirectMessage";
DROP POLICY IF EXISTS "Authenticated users can insert messages." ON public."DirectMessage";
DROP POLICY IF EXISTS "Recipients can update messages." ON public."DirectMessage";
