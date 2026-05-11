-- =============================================================================
-- STEP 1: Add new values to the leave_type enum
-- Run this FIRST, then run step 2 in a separate query
-- =============================================================================

ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'claim_annual_leave_days';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'mothers_day';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'forced';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'commutation';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'sabbatical_leave';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'local_leave';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'bereavement';
