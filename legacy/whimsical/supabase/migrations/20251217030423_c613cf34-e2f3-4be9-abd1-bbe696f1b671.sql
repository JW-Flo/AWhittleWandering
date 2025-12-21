-- Fix profiles table RLS policies - remove overly permissive policy
-- The "Require authentication for profiles" policy allows any authenticated user to read all profiles

-- Drop the overly permissive ALL policy
DROP POLICY IF EXISTS "Require authentication for profiles" ON public.profiles;

-- The existing specific policies are correct:
-- "Users can view own profile" - SELECT with auth.uid() = user_id
-- "Users can insert own profile" - INSERT with auth.uid() = user_id  
-- "Users can update own profile" - UPDATE with auth.uid() = user_id
-- "Users can delete own profile" - DELETE with auth.uid() = user_id

-- Add a policy for admins to view all profiles (needed for admin portal)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add a policy for admins to update profiles (for account management)
CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));