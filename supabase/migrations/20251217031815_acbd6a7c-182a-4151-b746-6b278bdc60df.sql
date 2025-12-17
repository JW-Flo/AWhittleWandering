-- Fix user_roles: Only admins should be able to manage roles (not users themselves)
-- This prevents privilege escalation attacks

-- Add policy for admins to manage all roles
CREATE POLICY "Admins can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add more restrictive policy for notification_preferences
-- Ensure the "Require authentication" policy doesn't grant broader access than intended
DROP POLICY IF EXISTS "Require authentication for notification_preferences" ON public.notification_preferences;

-- Add more restrictive policy for sms_consent_log
DROP POLICY IF EXISTS "Require authentication for sms consent" ON public.sms_consent_log;

-- Add more restrictive policy for user_api_credentials
DROP POLICY IF EXISTS "Require authentication for credentials access" ON public.user_api_credentials;

-- Ensure security_audit_log has no duplicate SELECT policies
-- Keep only the user_id based policy
DROP POLICY IF EXISTS "Users can view their own security logs" ON public.security_audit_log;
