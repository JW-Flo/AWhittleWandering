-- Add admin policy to view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));