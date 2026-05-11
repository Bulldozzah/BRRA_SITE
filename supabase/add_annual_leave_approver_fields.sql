-- =============================================================================
-- Add approver selection fields to annual_leave_applications table
-- Stores HoD, HR, and ED details selected by applicant at submission time
-- =============================================================================

ALTER TABLE public.annual_leave_applications
  ADD COLUMN IF NOT EXISTS hod_approver_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS hod_approver_name TEXT,
  ADD COLUMN IF NOT EXISTS hod_approver_email TEXT,
  ADD COLUMN IF NOT EXISTS hr_approver_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS hr_approver_name TEXT,
  ADD COLUMN IF NOT EXISTS hr_approver_email TEXT,
  ADD COLUMN IF NOT EXISTS ed_approver_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS ed_approver_name TEXT,
  ADD COLUMN IF NOT EXISTS ed_approver_email TEXT,
  ADD COLUMN IF NOT EXISTS applicant_email TEXT;

CREATE INDEX IF NOT EXISTS idx_annual_leave_hod ON public.annual_leave_applications(hod_approver_id);
CREATE INDEX IF NOT EXISTS idx_annual_leave_hr ON public.annual_leave_applications(hr_approver_id);
CREATE INDEX IF NOT EXISTS idx_annual_leave_ed ON public.annual_leave_applications(ed_approver_id);
