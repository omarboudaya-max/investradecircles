-- Fix for public circle joining
-- This relaxes the Circle update policy so that authenticated users can join public circles.

DROP POLICY IF EXISTS "Creators and moderators can update circle." ON public."Circle";

CREATE POLICY "Authenticated users can update circle." ON public."Circle" FOR UPDATE USING (
  auth.role() = 'authenticated'
);
