-- Create a secure function for admins to update user roles
CREATE OR REPLACE FUNCTION public.set_user_role(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can set user roles';
  END IF;

  -- Update the role (trigger already created the 'student' role)
  UPDATE public.user_roles
  SET role = _role
  WHERE user_id = _user_id;
END;
$$;