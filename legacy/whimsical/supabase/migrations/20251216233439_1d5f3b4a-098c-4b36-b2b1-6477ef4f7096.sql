-- Security hardening: Add explicit authentication requirements to sensitive tables
-- This prevents any anonymous access attempts from succeeding

-- notification_preferences: Require authentication for all operations
CREATE POLICY "Require authentication for notification_preferences"
ON public.notification_preferences
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- profiles: Require authentication for all operations  
CREATE POLICY "Require authentication for profiles"
ON public.profiles
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- user_api_credentials: Additional auth requirement policy
CREATE POLICY "Require authentication for credentials access"
ON public.user_api_credentials
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- sms_consent_log: Require authentication
CREATE POLICY "Require authentication for sms consent"
ON public.sms_consent_log
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Add data retention policy note: page_views older than 90 days should be purged
-- This is a comment/documentation - actual cleanup would be done via cron job
COMMENT ON TABLE public.page_views IS 'Analytics table for tracking page views. Data should be retained for 90 days maximum. Visitor IDs are anonymous hashes, not PII.';