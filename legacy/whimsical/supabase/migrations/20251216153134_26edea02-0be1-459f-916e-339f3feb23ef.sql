-- GDPR Compliance: Allow users to delete their own data

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their notification preferences
CREATE POLICY "Users can delete own notification preferences"
ON public.notification_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Create a secure function to get API credentials without exposing the token
-- This prevents the encrypted_token from being returned to clients
CREATE OR REPLACE FUNCTION public.get_user_api_credential_status(credential_id uuid)
RETURNS TABLE (
  id uuid,
  provider_id uuid,
  is_valid boolean,
  last_verified_at timestamptz,
  error_message text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    uac.id,
    uac.provider_id,
    uac.is_valid,
    uac.last_verified_at,
    uac.error_message,
    uac.created_at
  FROM public.user_api_credentials uac
  WHERE uac.id = credential_id
    AND uac.user_id = auth.uid()
$$;

-- Create audit log table for security-sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on audit log (users can only view their own)
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
ON public.security_audit_log
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_security_audit_user_created ON public.security_audit_log(user_id, created_at DESC);

-- Create function to log security events (can be called from edge functions)
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.security_audit_log (user_id, action, resource_type, resource_id, metadata)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_metadata)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;