-- =============================================================================
-- Add H.o.D and Executive Director selection to Leave Applications
-- These are chosen by the applicant at submission time for approval routing
-- =============================================================================

-- Add executive_director_id column (hod_id already exists)
ALTER TABLE public.leave_applications
  ADD COLUMN IF NOT EXISTS executive_director_id UUID REFERENCES public.profiles(id);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_leave_applications_hod ON public.leave_applications(hod_id);
CREATE INDEX IF NOT EXISTS idx_leave_applications_ed ON public.leave_applications(executive_director_id);
