-- Add 'worker' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'worker';

-- Add 'in_progress' and 'waiting_confirmation' to complaint_status
-- First check and add 'in_progress' if needed (for 'ongoing' status)
DO $$
BEGIN
  -- Note: 'in_progress' already exists, we just need 'waiting_confirmation'
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'waiting_confirmation' AND enumtypid = 'complaint_status'::regtype) THEN
    ALTER TYPE public.complaint_status ADD VALUE 'waiting_confirmation';
  END IF;
END
$$;

-- Create workers table to store worker-specific info with their role type
CREATE TABLE IF NOT EXISTS public.workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  worker_type staff_type NOT NULL,
  phone text,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add assigned_worker_id column to complaints table
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS assigned_worker_id uuid REFERENCES public.workers(id) ON DELETE SET NULL;

-- Enable RLS on workers table
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workers table
-- Workers can view their own record
CREATE POLICY "Workers can view their own record"
ON public.workers
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all workers
CREATE POLICY "Admins can view all workers"
ON public.workers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert workers
CREATE POLICY "Admins can insert workers"
ON public.workers
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update workers
CREATE POLICY "Admins can update workers"
ON public.workers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete workers
CREATE POLICY "Admins can delete workers"
ON public.workers
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Workers can view complaints assigned to them
CREATE POLICY "Workers can view assigned complaints"
ON public.complaints
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workers 
    WHERE workers.user_id = auth.uid() 
    AND workers.id = complaints.assigned_worker_id
  )
);

-- Workers can update assigned complaints (only status field for marking resolved)
CREATE POLICY "Workers can update assigned complaints"
ON public.complaints
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workers 
    WHERE workers.user_id = auth.uid() 
    AND workers.id = complaints.assigned_worker_id
  )
);

-- Add trigger for updated_at on workers table
CREATE TRIGGER update_workers_updated_at
BEFORE UPDATE ON public.workers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for workers table
ALTER PUBLICATION supabase_realtime ADD TABLE public.workers;