-- Performance Indexes for Investraders
-- These indexes resolve 522 connection timeout errors caused by sequential scans on heavily queried tables.

-- 1. DirectMessage table indexes
-- Optimizes: GET /rest/v1/DirectMessage?select=*&recipient_id=eq.UUID&order=created_date.desc&limit=30
CREATE INDEX IF NOT EXISTS idx_directmessage_recipient_created ON public."DirectMessage" (recipient_id, created_date DESC);
CREATE INDEX IF NOT EXISTS idx_directmessage_sender ON public."DirectMessage" (sender_id);

-- 2. Notification table indexes
-- Optimizes: GET /rest/v1/Notification?select=*&user_id=eq.UUID&order=created_date.desc&limit=20
CREATE INDEX IF NOT EXISTS idx_notification_user_created ON public."Notification" (user_id, created_date DESC);
-- Optimizes: GET /rest/v1/Notification?select=*&user_id=eq.UUID&circle_id=eq.UUID&is_read=eq.false
CREATE INDEX IF NOT EXISTS idx_notification_user_circle_read ON public."Notification" (user_id, circle_id, is_read);

-- 3. Connection table indexes
-- Optimizes: GET /rest/v1/Connection?select=*&recipient_id=eq.UUID
-- Optimizes: GET /rest/v1/Connection?select=*&recipient_id=eq.UUID&status=eq.pending
CREATE INDEX IF NOT EXISTS idx_connection_recipient_status ON public."Connection" (recipient_id, status);
-- Optimizes: GET /rest/v1/Connection?select=*&requester_id=eq.UUID
CREATE INDEX IF NOT EXISTS idx_connection_requester ON public."Connection" (requester_id);

-- 4. CircleResponse table indexes
-- Optimizes: GET /rest/v1/CircleResponse?select=*&question_id=eq.UUID
CREATE INDEX IF NOT EXISTS idx_circleresponse_question ON public."CircleResponse" (question_id);

-- 5. Additional recommended foreign key indexes for general performance
-- Post table
CREATE INDEX IF NOT EXISTS idx_post_circle ON public."Post" (circle_id);
CREATE INDEX IF NOT EXISTS idx_post_created_by ON public."Post" (created_by_id);
CREATE INDEX IF NOT EXISTS idx_post_created_date ON public."Post" (created_date DESC);

-- Comment table
CREATE INDEX IF NOT EXISTS idx_comment_post ON public."Comment" (post_id);
CREATE INDEX IF NOT EXISTS idx_comment_circle ON public."Comment" (circle_id);

-- CircleEvent table
CREATE INDEX IF NOT EXISTS idx_circleevent_circle ON public."CircleEvent" (circle_id);

-- CircleQuestion table
CREATE INDEX IF NOT EXISTS idx_circlequestion_circle ON public."CircleQuestion" (circle_id);
