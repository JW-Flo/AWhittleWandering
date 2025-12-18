-- Create function to trigger security audit on new user creation
CREATE OR REPLACE FUNCTION public.trigger_new_user_security_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the security audit edge function for new user
  -- This is done asynchronously via pg_net
  PERFORM net.http_post(
    url := 'https://hubzzbtolvycvdvglauq.supabase.co/functions/v1/security-audit',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1Ynp6YnRvbHZ5Y3ZkdmdsYXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Njc2NDUsImV4cCI6MjA4MTQ0MzY0NX0.Jibxia_VRAE5o-WW7Gnqn7pww4jjAghWKMi5I0sJFhg"}'::jsonb,
    body := jsonb_build_object('trigger', 'new_user', 'userId', NEW.user_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on profiles table (fires when new profile is created for a user)
DROP TRIGGER IF EXISTS on_new_user_security_audit ON public.profiles;
CREATE TRIGGER on_new_user_security_audit
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_user_security_audit();