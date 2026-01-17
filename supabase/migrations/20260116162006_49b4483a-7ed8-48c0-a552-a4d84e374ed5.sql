-- Create a security definer function to create worker records (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_worker_record(
  _user_id uuid,
  _worker_type staff_type,
  _phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _worker_id uuid;
BEGIN
  INSERT INTO public.workers (user_id, worker_type, phone)
  VALUES (_user_id, _worker_type, _phone)
  RETURNING id INTO _worker_id;
  
  RETURN _worker_id;
END;
$$;