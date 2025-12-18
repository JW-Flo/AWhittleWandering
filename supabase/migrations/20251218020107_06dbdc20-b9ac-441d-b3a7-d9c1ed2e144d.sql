-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view API providers" ON public.api_providers;

-- Create policy for authenticated users only
CREATE POLICY "Authenticated users can view active API providers"
ON public.api_providers
FOR SELECT
TO authenticated
USING (is_active = true);

-- Admins can manage all API providers
CREATE POLICY "Admins can manage API providers"
ON public.api_providers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));