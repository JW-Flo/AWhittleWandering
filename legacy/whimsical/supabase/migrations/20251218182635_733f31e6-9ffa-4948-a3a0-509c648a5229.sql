-- Function to automatically grant premium role to beta testers when they sign up
CREATE OR REPLACE FUNCTION public.grant_beta_tester_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the new user's email exists in beta_testers and is active
  IF EXISTS (
    SELECT 1 FROM public.beta_testers 
    WHERE email = NEW.email 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    -- Grant premium role to the beta tester
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'premium')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after user creation
DROP TRIGGER IF EXISTS on_auth_user_created_grant_beta_role ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_beta_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_beta_tester_role();