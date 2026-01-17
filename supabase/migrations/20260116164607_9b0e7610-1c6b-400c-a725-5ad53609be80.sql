-- Add restrictive DELETE policy on user_roles to prevent role deletion
CREATE POLICY "Prevent role deletion"
ON public.user_roles FOR DELETE
TO authenticated
USING (false);

-- Add restrictive UPDATE policy on user_roles to prevent role modification
CREATE POLICY "Prevent role updates"
ON public.user_roles FOR UPDATE
TO authenticated
USING (false);