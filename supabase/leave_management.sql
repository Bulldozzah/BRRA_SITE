-- =============================================================================
-- BRRA Leave Management System - Database Schema
-- =============================================================================

-- Leave type enum
CREATE TYPE public.leave_type AS ENUM (
  'annual',
  'sick',
  'study',
  'maternity',
  'paternity',
  'compassionate',
  'unpaid'
);

-- Leave status enum
CREATE TYPE public.leave_status AS ENUM (
  'pending',
  'recommended',
  'approved',
  'rejected',
  'cancelled'
);

-- =============================================================================
-- Leave Applications Table (Core)
-- =============================================================================
CREATE TABLE public.leave_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Employee details (from staff_profiles)
  employee_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Part I - Applicant Section
  leave_type public.leave_type NOT NULL DEFAULT 'annual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  requested_days INTEGER NOT NULL CHECK (requested_days > 0),
  leave_address TEXT,
  
  -- Leave entitlement context (snapshot at time of application)
  last_leave_end_date DATE,
  months_since_last_leave NUMERIC(5,1),
  leave_rate NUMERIC(4,2) DEFAULT 2.5,
  days_accrued NUMERIC(6,1),
  leave_balance NUMERIC(6,1),
  
  -- Status & workflow
  status public.leave_status NOT NULL DEFAULT 'pending',
  
  -- Part II - Approval
  hod_id UUID REFERENCES public.profiles(id),
  hod_recommendation TEXT CHECK (hod_recommendation IN ('recommended', 'not_recommended')),
  hod_comment TEXT,
  hod_date TIMESTAMPTZ,
  
  approved_days INTEGER,
  approver_id UUID REFERENCES public.profiles(id),
  approver_comment TEXT,
  approval_date TIMESTAMPTZ,
  
  -- Rejection
  rejection_reason TEXT,
  
  -- Attachment (e.g. medical certificate for sick leave)
  attachment_url TEXT,
  attachment_name TEXT,
  
  -- Timestamps
  application_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Leave Balances Table (Running balance per employee per leave type)
-- =============================================================================
CREATE TABLE public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  leave_type public.leave_type NOT NULL,
  total_entitlement NUMERIC(6,1) NOT NULL DEFAULT 0,
  days_taken NUMERIC(6,1) NOT NULL DEFAULT 0,
  days_remaining NUMERIC(6,1) NOT NULL DEFAULT 0,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, leave_type, year)
);

-- =============================================================================
-- Leave Settings Table (Policy configuration)
-- =============================================================================
CREATE TABLE public.leave_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_type public.leave_type NOT NULL UNIQUE,
  days_per_year NUMERIC(5,1) NOT NULL DEFAULT 30,
  rate_per_month NUMERIC(4,2) NOT NULL DEFAULT 2.5,
  requires_attachment BOOLEAN NOT NULL DEFAULT FALSE,
  max_carry_over NUMERIC(5,1) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Insert default leave settings
-- =============================================================================
INSERT INTO public.leave_settings (leave_type, days_per_year, rate_per_month, requires_attachment, description) VALUES
  ('annual', 30, 2.5, false, 'Annual leave entitlement'),
  ('sick', 90, 0, true, 'Sick leave - requires medical certificate'),
  ('study', 30, 0, true, 'Study leave - requires proof of enrollment'),
  ('maternity', 90, 0, true, 'Maternity leave'),
  ('paternity', 10, 0, true, 'Paternity leave'),
  ('compassionate', 7, 0, false, 'Compassionate leave'),
  ('unpaid', 365, 0, false, 'Unpaid leave');

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX idx_leave_applications_employee ON public.leave_applications(employee_id);
CREATE INDEX idx_leave_applications_user ON public.leave_applications(user_id);
CREATE INDEX idx_leave_applications_status ON public.leave_applications(status);
CREATE INDEX idx_leave_applications_dates ON public.leave_applications(start_date, end_date);
CREATE INDEX idx_leave_balances_employee ON public.leave_balances(employee_id);

-- =============================================================================
-- RLS Policies
-- =============================================================================
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_settings ENABLE ROW LEVEL SECURITY;

-- Employees can view their own leave applications
CREATE POLICY "Users can view own leave applications"
  ON public.leave_applications FOR SELECT
  USING (user_id = auth.uid());

-- Employees can insert their own leave applications
CREATE POLICY "Users can insert own leave applications"
  ON public.leave_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Employees can cancel their own pending applications
CREATE POLICY "Users can cancel own pending applications"
  ON public.leave_applications FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (status = 'cancelled');

-- Staff/Admin can view all leave applications
CREATE POLICY "Staff and admin can view all leave applications"
  ON public.leave_applications FOR SELECT
  USING (public.is_staff_or_admin());

-- Staff/Admin can update leave applications (approve/reject)
CREATE POLICY "Staff and admin can update leave applications"
  ON public.leave_applications FOR UPDATE
  USING (public.is_staff_or_admin());

-- Employees can view their own balances
CREATE POLICY "Users can view own leave balances"
  ON public.leave_balances FOR SELECT
  USING (employee_id IN (
    SELECT id FROM public.staff_profiles WHERE user_id = auth.uid()
  ));

-- Staff/Admin can view all balances
CREATE POLICY "Staff and admin can view all leave balances"
  ON public.leave_balances FOR SELECT
  USING (public.is_staff_or_admin());

-- Staff/Admin can manage balances
CREATE POLICY "Staff and admin can manage leave balances"
  ON public.leave_balances FOR ALL
  USING (public.is_staff_or_admin());

-- Everyone can view leave settings
CREATE POLICY "Anyone can view leave settings"
  ON public.leave_settings FOR SELECT
  USING (true);

-- Only admin can manage settings
CREATE POLICY "Admin can manage leave settings"
  ON public.leave_settings FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- Public Holidays Table (Database-driven, admin-manageable)
-- =============================================================================
CREATE TABLE public.public_holidays (
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

CREATE INDEX idx_public_holidays_date ON public.public_holidays(holiday_date);
CREATE INDEX idx_public_holidays_year ON public.public_holidays(year);

-- RLS
ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;

-- Everyone can view public holidays
CREATE POLICY "Anyone can view public holidays"
  ON public.public_holidays FOR SELECT
  USING (true);

-- Only admin can manage public holidays
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
  ('Christmas Day', '2027-12-25', 2027, true, 'Christmas Day');
