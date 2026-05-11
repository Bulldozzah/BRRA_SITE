-- =============================================================================
-- Add ED email and name fields directly to leave_applications table
-- This ensures email can be sent reliably without complex joins
-- Also allows flexibility if the approver changes
-- =============================================================================

ALTER TABLE public.leave_applications
  ADD COLUMN IF NOT EXISTS ed_email TEXT,
  ADD COLUMN IF NOT EXISTS ed_name TEXT,
  ADD COLUMN IF NOT EXISTS hod_email TEXT,
  ADD COLUMN IF NOT EXISTS hod_name TEXT;
