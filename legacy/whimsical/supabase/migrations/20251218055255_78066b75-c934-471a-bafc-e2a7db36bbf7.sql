-- Add admin-only policy for account_lockouts table
-- Service role (used by edge functions) bypasses RLS anyway
CREATE POLICY "Admins can manage account lockouts" 
ON public.account_lockouts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));