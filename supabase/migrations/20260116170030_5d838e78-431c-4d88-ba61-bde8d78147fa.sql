-- Fix 1: Remove the INSERT policy that allows users to assign themselves roles
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- Fix 2: Create trigger to auto-assign 'student' role on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

-- Create trigger for auto role assignment
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Fix 3: Update create_worker_record to require admin authorization
CREATE OR REPLACE FUNCTION public.create_worker_record(_user_id uuid, _worker_type staff_type, _phone text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _worker_id uuid;
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can create worker records';
  END IF;

  INSERT INTO public.workers (user_id, worker_type, phone)
  VALUES (_user_id, _worker_type, _phone)
  RETURNING id INTO _worker_id;
  
  RETURN _worker_id;
END;
$$;