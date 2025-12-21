-- Remove the overly permissive insert policy
-- Service role already bypasses RLS, so this policy is unnecessary and creates exposure
DROP POLICY IF EXISTS "Service role can insert login attempts" ON public.login_attempts;

-- The auth-security edge function uses service_role key which bypasses RLS
-- So we only need policies for users and admins to VIEW data, not insert

-- Also tighten account_lockouts - service role bypasses RLS anyway
DROP POLICY IF EXISTS "Service role can manage account lockouts" ON public.account_lockouts;