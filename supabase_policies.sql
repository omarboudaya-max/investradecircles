-- ==========================================
-- SUPER IMPORTANT: RLS POLICIES & INDEXES
-- ==========================================
-- Run this in your Supabase SQL Editor to secure your database
-- and prepare it for thousands of users.

-- 1. Enable Row Level Security on core tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Circle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Post" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DirectMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Connection" ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies
-- Everyone can read profiles
CREATE POLICY "Profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Users can update their own profile
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Circle Policies
-- Everyone can read circles (since visibility is handled in app logic, but let's assume public by default)
CREATE POLICY "Circles are viewable by everyone." ON public."Circle" FOR SELECT USING (true);
-- Authenticated users can insert circles
CREATE POLICY "Authenticated users can create circles." ON public."Circle" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Only creator or moderators can update
CREATE POLICY "Creators and moderators can update circle." ON public."Circle" FOR UPDATE USING (
  auth.uid() = created_by_id OR auth.uid() = ANY(moderator_ids)
);

-- 4. Post Policies
-- Everyone can view posts
CREATE POLICY "Posts are viewable by everyone." ON public."Post" FOR SELECT USING (true);
-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts." ON public."Post" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Authors can update their own posts (e.g., adding likes/reactions currently updates the row, so we might need a looser policy or a dedicated rpc for likes if we want strict security. For now, let's allow authenticated users to update posts so likes/reactions work)
CREATE POLICY "Authenticated users can update posts (for likes/reactions)." ON public."Post" FOR UPDATE USING (auth.role() = 'authenticated');
-- Only authors can delete
CREATE POLICY "Authors can delete their own posts." ON public."Post" FOR DELETE USING (auth.uid() = created_by_id);

-- 5. Comment Policies
-- Everyone can view comments
CREATE POLICY "Comments are viewable by everyone." ON public."Comment" FOR SELECT USING (true);
-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments." ON public."Comment" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Authenticated users can update comments (for reactions)
CREATE POLICY "Authenticated users can update comments." ON public."Comment" FOR UPDATE USING (auth.role() = 'authenticated');
-- Only authors can delete
CREATE POLICY "Authors can delete their own comments." ON public."Comment" FOR DELETE USING (auth.uid() = created_by_id);

-- 6. Notification Policies
-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications." ON public."Notification" FOR SELECT USING (auth.uid() = user_id);
-- System or users can insert notifications
CREATE POLICY "Authenticated users can insert notifications." ON public."Notification" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Users can update their own notifications (e.g. mark as read)
CREATE POLICY "Users can update own notifications." ON public."Notification" FOR UPDATE USING (auth.uid() = user_id);

-- 7. Connection Policies
-- Everyone can view connections
CREATE POLICY "Connections viewable by everyone." ON public."Connection" FOR SELECT USING (true);
-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert connections." ON public."Connection" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Users involved in connection can update
CREATE POLICY "Users can update their connections." ON public."Connection" FOR UPDATE USING (
  auth.uid() = requester_id OR auth.uid() = recipient_id
);

-- 8. DirectMessage Policies
-- Users can only read messages they sent or received
CREATE POLICY "Users can view own messages." ON public."DirectMessage" FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);
-- Authenticated users can insert messages
CREATE POLICY "Authenticated users can insert messages." ON public."DirectMessage" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Recipients can update messages (mark as read)
CREATE POLICY "Recipients can update messages." ON public."DirectMessage" FOR UPDATE USING (auth.uid() = recipient_id);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
-- Create indexes on frequently queried columns to prevent slowdowns

CREATE INDEX IF NOT EXISTS idx_post_created_by ON public."Post"(created_by_id);
CREATE INDEX IF NOT EXISTS idx_post_circle_id ON public."Post"(circle_id);
CREATE INDEX IF NOT EXISTS idx_post_created_date ON public."Post"(created_date DESC);

CREATE INDEX IF NOT EXISTS idx_comment_post_id ON public."Comment"(post_id);
CREATE INDEX IF NOT EXISTS idx_comment_created_by ON public."Comment"(created_by_id);

CREATE INDEX IF NOT EXISTS idx_notification_user_id ON public."Notification"(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_created_date ON public."Notification"(created_date DESC);

CREATE INDEX IF NOT EXISTS idx_connection_requester ON public."Connection"(requester_id);
CREATE INDEX IF NOT EXISTS idx_connection_recipient ON public."Connection"(recipient_id);

CREATE INDEX IF NOT EXISTS idx_dm_conversation_id ON public."DirectMessage"(conversation_id);

-- Enable realtime for Post and Comment tables (for live likes and comments)
ALTER PUBLICATION supabase_realtime ADD TABLE public."Post";
ALTER PUBLICATION supabase_realtime ADD TABLE public."Comment";
