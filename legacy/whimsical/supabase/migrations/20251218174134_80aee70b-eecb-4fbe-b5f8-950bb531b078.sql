-- Drop the overly permissive policy that exposes all data
DROP POLICY IF EXISTS "Anyone can verify access codes" ON public.beta_testers;

-- Create a security definer function to safely verify access codes without exposing data
CREATE OR REPLACE FUNCTION public.verify_beta_access_code(p_access_code text)
RETURNS TABLE(id uuid, name varchar, expires_at timestamptz, is_active boolean, access_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    bt.id,
    bt.name,
    bt.expires_at,
    bt.is_active,
    bt.access_count
  FROM public.beta_testers bt
  WHERE bt.access_code = p_access_code
    AND bt.is_active = true
    AND (bt.expires_at IS NULL OR bt.expires_at > now())
  LIMIT 1;
$$;

-- Create a function to update access count (called after successful verification)
CREATE OR REPLACE FUNCTION public.record_beta_access(p_tester_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.beta_testers
  SET 
    last_accessed_at = now(),
    access_count = COALESCE(access_count, 0) + 1
  WHERE id = p_tester_id
    AND is_active = true;
END;
$$;

-- Revoke direct table access from anon - only allow through functions
REVOKE SELECT ON public.beta_testers FROM anon;

-- Ensure only admins can directly access the table
-- The existing admin policy covers this, but let's make it explicit
CREATE POLICY "Only admins can select beta testers"
ON public.beta_testers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add index for faster access code lookups
CREATE INDEX IF NOT EXISTS idx_beta_testers_access_code ON public.beta_testers(access_code);
CREATE INDEX IF NOT EXISTS idx_beta_testers_active_expires ON public.beta_testers(is_active, expires_at);