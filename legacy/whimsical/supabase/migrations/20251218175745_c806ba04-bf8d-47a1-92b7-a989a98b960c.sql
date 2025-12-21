-- =====================================================
-- COMPREHENSIVE SECURITY HARDENING
-- =====================================================

-- 1. LOGIN_ATTEMPTS - Secure SELECT access
-- Already has RLS enabled, need proper SELECT policies
DROP POLICY IF EXISTS "Users can view own login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Admins can view all login attempts" ON public.login_attempts;

-- Users can only see their own login attempts (by email match with their profile)
CREATE POLICY "Users view own attempts only"
ON public.login_attempts
FOR SELECT
TO authenticated
USING (
  email = (SELECT auth.jwt() ->> 'email')
);

-- Admins can view all
CREATE POLICY "Admins view all attempts"
ON public.login_attempts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete old attempts
CREATE POLICY "Admins can delete attempts"
ON public.login_attempts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Revoke anon SELECT
REVOKE SELECT ON public.login_attempts FROM anon;

-- 2. ACCOUNT_LOCKOUTS - Admin only access
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins only lockouts" ON public.account_lockouts;
CREATE POLICY "Admins only lockouts"
ON public.account_lockouts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.account_lockouts FROM anon;
REVOKE ALL ON public.account_lockouts FROM authenticated;
GRANT SELECT, DELETE ON public.account_lockouts TO authenticated;

-- 3. BETA_TESTERS - Already secured, ensure no anon access
REVOKE ALL ON public.beta_testers FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.beta_testers FROM authenticated;

-- Only admins via has_role function
DROP POLICY IF EXISTS "Admin full access to beta_testers" ON public.beta_testers;
CREATE POLICY "Admin full access to beta_testers"
ON public.beta_testers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.beta_testers TO authenticated;

-- 4. BLOCKED_VISITORS - Admin only
ALTER TABLE public.blocked_visitors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins only blocked_visitors" ON public.blocked_visitors;
CREATE POLICY "Admins only blocked_visitors"
ON public.blocked_visitors
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.blocked_visitors FROM anon;
REVOKE ALL ON public.blocked_visitors FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_visitors TO authenticated;

-- 5. PAGE_VIEWS - Restrict SELECT to admins and journey owners
DROP POLICY IF EXISTS "Admins can view all page_views" ON public.page_views;
DROP POLICY IF EXISTS "Journey owners can view their page_views" ON public.page_views;

-- Admins can see all
CREATE POLICY "Admins view all page_views"
ON public.page_views
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Journey owners can see views of their journeys
CREATE POLICY "Journey owners view own page_views"
ON public.page_views
FOR SELECT
TO authenticated
USING (
  journey_id IN (
    SELECT id FROM public.journeys WHERE user_id = auth.uid()
  )
);

-- Revoke anon SELECT (but keep INSERT for tracking)
REVOKE SELECT ON public.page_views FROM anon;

-- 6. SECURITY_SCAN_RESULTS - Comprehensive admin-only
DROP POLICY IF EXISTS "Admins can view security scans" ON public.security_scan_results;

-- Recreate with all operations
CREATE POLICY "Admins manage security scans"
ON public.security_scan_results
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. DATA_RETENTION_CONFIG - Already has policies but add granular ones
DROP POLICY IF EXISTS "Admins can manage data retention" ON public.data_retention_config;

CREATE POLICY "Admins view retention config"
ON public.data_retention_config
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update retention config"
ON public.data_retention_config
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.data_retention_config FROM anon;
REVOKE INSERT, DELETE ON public.data_retention_config FROM authenticated;