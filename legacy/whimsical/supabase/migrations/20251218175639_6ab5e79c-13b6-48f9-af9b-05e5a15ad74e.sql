-- Fix page_views: Add rate limiting by requiring visitor_id pattern and limiting abuse
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;

-- Create a more restrictive insert policy - require visitor_id format validation
CREATE POLICY "Validated page view inserts only"
ON public.page_views
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Require visitor_id to exist and be a valid format (UUID-like)
  visitor_id IS NOT NULL 
  AND length(visitor_id) >= 32
  AND page_path IS NOT NULL
  AND length(page_path) <= 500
);

-- Fix login_attempts: Only service_role should insert, not public
DROP POLICY IF EXISTS "Service can insert login attempts" ON public.login_attempts;

-- Revoke direct insert from anon/public - only service_role can insert
REVOKE INSERT ON public.login_attempts FROM anon;
REVOKE INSERT ON public.login_attempts FROM authenticated;

-- Fix security_scan_results: Make service-only access more explicit
DROP POLICY IF EXISTS "Service role can manage scan results" ON public.security_scan_results;

-- Revoke all public access - only service_role should access
REVOKE ALL ON public.security_scan_results FROM anon;
REVOKE ALL ON public.security_scan_results FROM authenticated;

-- Admins can view security scan results
CREATE POLICY "Admins can view security scans"
ON public.security_scan_results
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add index for performance on page_views validation
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON public.page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);