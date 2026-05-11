-- =============================================================================
-- Add new leave types to leave_type enum and leave_settings table
-- Run this in Supabase SQL Editor to add the additional leave types
-- =============================================================================

-- Step 1: Add new values to the leave_type enum
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'claim_annual_leave_days';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'mothers_day';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'forced';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'commutation';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'sabbatical_leave';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'local_leave';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'bereavement';

-- Step 2: Insert the new leave type settings (skip existing ones to avoid duplicates)
INSERT INTO public.leave_settings (leave_type, days_per_year, rate_per_month, requires_attachment, description) VALUES
  ('claim_annual_leave_days', 30, 2.5, false, 'Claim annual leave days'),
  ('mothers_day', 1, 0, true, 'Mothers Day'),
  ('forced', 30, 0, true, 'Forced leave'),
  ('commutation', 90, 0, true, 'Commutation'),
  ('sabbatical_leave', 365, 0, true, 'Sabbatical Leave'),
  ('local_leave', 7, 0, false, 'Local Leave'),
  ('bereavement', 7, 0, false, 'Bereavement leave')
ON CONFLICT (leave_type) DO NOTHING;
