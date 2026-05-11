-- =============================================================================
-- STEP 2: Insert the new leave type settings
-- Run this AFTER step 1 has been committed
-- =============================================================================

INSERT INTO public.leave_settings (leave_type, days_per_year, rate_per_month, requires_attachment, description) VALUES
  ('claim_annual_leave_days', 30, 2.5, false, 'Claim annual leave days'),
  ('mothers_day', 1, 0, true, 'Mothers Day'),
  ('forced', 30, 0, true, 'Forced leave'),
  ('commutation', 90, 0, true, 'Commutation'),
  ('sabbatical_leave', 365, 0, true, 'Sabbatical Leave'),
  ('local_leave', 7, 0, false, 'Local Leave'),
  ('bereavement', 7, 0, false, 'Bereavement leave')
ON CONFLICT (leave_type) DO NOTHING;
