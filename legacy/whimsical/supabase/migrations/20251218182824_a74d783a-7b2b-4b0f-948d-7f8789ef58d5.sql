-- Update function to grant admin role specifically to joe@awhittlewandering.com
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
    -- Grant premium role to all beta testers
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'premium')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Grant admin role specifically to joe@awhittlewandering.com
    IF NEW.email = 'joe@awhittlewandering.com' THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;