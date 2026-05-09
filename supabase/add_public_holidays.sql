-- =============================================================================
-- Add Public Holidays Table to existing Leave Management System
-- Run this AFTER the main leave_management.sql migration
-- =============================================================================

-- Public Holidays Table (Database-driven, admin-manageable)
CREATE TABLE IF NOT EXISTS public.public_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  recurring BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(holiday_date)
);

CREATE INDEX IF NOT EXISTS idx_public_holidays_date ON public.public_holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_public_holidays_year ON public.public_holidays(year);

-- RLS
ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;

-- Everyone can view public holidays
DROP POLICY IF EXISTS "Anyone can view public holidays" ON public.public_holidays;
CREATE POLICY "Anyone can view public holidays"
  ON public.public_holidays FOR SELECT
  USING (true);

-- Only admin can manage public holidays
DROP POLICY IF EXISTS "Admin can manage public holidays" ON public.public_holidays;
CREATE POLICY "Admin can manage public holidays"
  ON public.public_holidays FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- Seed Zambian Public Holidays for 2025, 2026, 2027
-- =============================================================================
INSERT INTO public.public_holidays (name, holiday_date, year, recurring, description) VALUES
  -- 2025
  ('New Year''s Day', '2025-01-01', 2025, true, 'New Year''s Day'),
  ('International Women''s Day', '2025-03-08', 2025, true, 'International Women''s Day'),
  ('Youth Day', '2025-03-12', 2025, true, 'Youth Day'),
  ('Good Friday', '2025-04-18', 2025, false, 'Good Friday (Easter-based)'),
  ('Easter Saturday', '2025-04-19', 2025, false, 'Easter Saturday'),
  ('Easter Monday', '2025-04-21', 2025, false, 'Easter Monday'),
  ('Kenneth Kaunda Day', '2025-04-28', 2025, true, 'Kenneth Kaunda''s Birthday'),
  ('Labour Day', '2025-05-01', 2025, true, 'Labour Day'),
  ('Africa Freedom Day', '2025-05-25', 2025, true, 'Africa Freedom Day'),
  ('Heroes'' Day', '2025-07-06', 2025, true, 'Heroes'' Day'),
  ('Unity Day', '2025-07-07', 2025, true, 'Unity Day'),
  ('Farmers'' Day', '2025-08-03', 2025, true, 'Farmers'' Day'),
  ('National Prayer Day', '2025-10-18', 2025, true, 'National Prayer Day'),
  ('Independence Day', '2025-10-24', 2025, true, 'Independence Day'),
  ('Christmas Day', '2025-12-25', 2025, true, 'Christmas Day'),
  -- 2026
  ('New Year''s Day', '2026-01-01', 2026, true, 'New Year''s Day'),
  ('International Women''s Day', '2026-03-08', 2026, true, 'International Women''s Day'),
  ('Youth Day', '2026-03-12', 2026, true, 'Youth Day'),
  ('Good Friday', '2026-04-03', 2026, false, 'Good Friday (Easter-based)'),
  ('Easter Saturday', '2026-04-04', 2026, false, 'Easter Saturday'),
  ('Easter Monday', '2026-04-06', 2026, false, 'Easter Monday'),
  ('Kenneth Kaunda Day', '2026-04-28', 2026, true, 'Kenneth Kaunda''s Birthday'),
  ('Labour Day', '2026-05-01', 2026, true, 'Labour Day'),
  ('Africa Freedom Day', '2026-05-25', 2026, true, 'Africa Freedom Day'),
  ('Heroes'' Day', '2026-07-06', 2026, true, 'Heroes'' Day'),
  ('Unity Day', '2026-07-07', 2026, true, 'Unity Day'),
  ('Farmers'' Day', '2026-08-03', 2026, true, 'Farmers'' Day'),
  ('National Prayer Day', '2026-10-18', 2026, true, 'National Prayer Day'),
  ('Independence Day', '2026-10-24', 2026, true, 'Independence Day'),
  ('Christmas Day', '2026-12-25', 2026, true, 'Christmas Day'),
  -- 2027
  ('New Year''s Day', '2027-01-01', 2027, true, 'New Year''s Day'),
  ('International Women''s Day', '2027-03-08', 2027, true, 'International Women''s Day'),
  ('Youth Day', '2027-03-12', 2027, true, 'Youth Day'),
  ('Good Friday', '2027-03-26', 2027, false, 'Good Friday (Easter-based)'),
  ('Easter Saturday', '2027-03-27', 2027, false, 'Easter Saturday'),
  ('Easter Monday', '2027-03-29', 2027, false, 'Easter Monday'),
  ('Kenneth Kaunda Day', '2027-04-28', 2027, true, 'Kenneth Kaunda''s Birthday'),
  ('Labour Day', '2027-05-01', 2027, true, 'Labour Day'),
  ('Africa Freedom Day', '2027-05-25', 2027, true, 'Africa Freedom Day'),
  ('Heroes'' Day', '2027-07-06', 2027, true, 'Heroes'' Day'),
  ('Unity Day', '2027-07-07', 2027, true, 'Unity Day'),
  ('Farmers'' Day', '2027-08-03', 2027, true, 'Farmers'' Day'),
  ('National Prayer Day', '2027-10-18', 2027, true, 'National Prayer Day'),
  ('Independence Day', '2027-10-24', 2027, true, 'Independence Day'),
  ('Christmas Day', '2027-12-25', 2027, true, 'Christmas Day')
ON CONFLICT (holiday_date) DO NOTHING;
