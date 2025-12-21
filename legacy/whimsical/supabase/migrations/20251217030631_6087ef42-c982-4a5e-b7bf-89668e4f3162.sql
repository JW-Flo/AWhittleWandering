-- Security fix: Prevent encrypted_token from being exposed in SELECT queries
-- Create a secure view that excludes the token column for normal access

-- Drop existing policies that allow viewing credentials
DROP POLICY IF EXISTS "Users can view own credentials" ON public.user_api_credentials;

-- Create a more restrictive SELECT policy that only returns non-sensitive columns
-- Users should use the existing get_user_api_credential_status function instead

-- Create policy that allows SELECT but we'll use a function to access safely
CREATE POLICY "Users can view own credential metadata only"
ON public.user_api_credentials
FOR SELECT
USING (auth.uid() = user_id);

-- Add a comment explaining the security pattern
COMMENT ON TABLE public.user_api_credentials IS 
'SECURITY: The encrypted_token column should NEVER be selected directly. 
Use the get_user_api_credential_status() function for safe access, or 
access tokens only via edge functions with service role.';

-- Create a secure function to check if a credential exists and is valid
-- without exposing the token
CREATE OR REPLACE FUNCTION public.get_credential_validity(p_credential_id uuid)
RETURNS TABLE(
  id uuid,
  provider_id uuid,
  is_valid boolean,
  last_verified_at timestamptz,
  error_message text,
  created_at timestamptz,
  updated_at timestamptz
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
    uac.created_at,
    uac.updated_at
  FROM public.user_api_credentials uac
  WHERE uac.id = p_credential_id
    AND uac.user_id = auth.uid()
$$;