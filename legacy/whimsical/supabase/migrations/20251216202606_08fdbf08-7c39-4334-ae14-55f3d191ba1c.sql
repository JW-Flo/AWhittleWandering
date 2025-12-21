-- Make security_audit_log append-only (no updates/deletes)
DROP POLICY IF EXISTS "Users can view their own security logs" ON public.security_audit_log;

CREATE POLICY "Users can view their own security logs"
ON public.security_audit_log
FOR SELECT
USING (user_id = auth.uid());

-- Ensure no UPDATE policy exists (only INSERT and SELECT)
-- The existing insert uses log_security_event function which is secure

-- Allow users to update/delete their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notification_queue
FOR UPDATE
USING (recipient_user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
ON public.notification_queue
FOR DELETE
USING (recipient_user_id = auth.uid());

-- Allow users to view incidents affecting them
CREATE POLICY "Users can view their own incidents"
ON public.incident_log
FOR SELECT
USING (user_id = auth.uid());

-- Allow users to view their own tessie drives via vehicles they own
CREATE POLICY "Users can view their own tessie drives"
ON public.tessie_drives
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.vin = tessie_drives.vin
    AND v.user_id = auth.uid()
  )
);