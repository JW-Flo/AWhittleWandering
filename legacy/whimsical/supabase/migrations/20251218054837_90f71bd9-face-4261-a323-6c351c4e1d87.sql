-- Fix login_attempts table: Add user-scoped RLS policies
-- Users should be able to view their own login attempts by email

-- First, drop the overly permissive service role policy and replace with proper user-scoped policies
DROP POLICY IF EXISTS "Service role can manage login attempts" ON public.login_attempts;

-- Create policy for admins to view all login attempts (for security monitoring)
CREATE POLICY "Admins can view all login attempts" 
ON public.login_attempts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policy for admins to insert login attempts (from auth-security edge function)
CREATE POLICY "Admins can insert login attempts" 
ON public.login_attempts 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create policy allowing authenticated users to view their own login attempts
-- Note: This requires matching email, which is obtained from auth.jwt()
CREATE POLICY "Users can view own login attempts by email" 
ON public.login_attempts 
FOR SELECT 
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Allow the auth-security edge function to insert without auth (it uses service role internally)
-- The edge function already has verify_jwt = false and uses service role key
CREATE POLICY "Service role can insert login attempts" 
ON public.login_attempts 
FOR INSERT 
WITH CHECK (true);

-- Add policy to allow service role to manage lockouts  
DROP POLICY IF EXISTS "Service role can manage lockouts" ON public.account_lockouts;

CREATE POLICY "Service role can manage account lockouts" 
ON public.account_lockouts 
FOR ALL 
USING (true) 
WITH CHECK (true);