-- =============================================================================
-- BRRA Annual Leave Management System
-- Based strictly on BRRA Annual Leave Form (4-Part Approval Workflow)
-- =============================================================================

-- Annual Leave Application Status
CREATE TYPE public.annual_leave_status AS ENUM (
  'draft',
  'submitted',           -- Part A complete (Employee)
  'hod_recommended',     -- Part B complete (HoD recommends)
  'hod_rejected',        -- Part B (HoD rejects)
  'hr_certified',        -- Part C complete (HR verifies)
  'hr_rejected',         -- Part C (HR rejects)
  'approved',            -- Part D complete (Head of Agency approves)
  'rejected',            -- Part D (Head of Agency rejects)
  'cancelled'            -- Employee cancelled
);

-- Employment status for HoD certification
CREATE TYPE public.employment_status_type AS ENUM (
  'established',
  'probation',
  'agreement'
);

-- =============================================================================
-- Annual Leave Applications Table (Part A - Employee Application)
-- =============================================================================
CREATE TABLE public.annual_leave_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Employee reference
  employee_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Part A: Personal & Employment Details (auto-filled from HR profile)
  surname TEXT NOT NULL,
  other_names TEXT NOT NULL,
  personnel_file_no TEXT,
  nrc_number TEXT,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  grade TEXT,
  annual_salary NUMERIC(12,2),
  
  -- Part A: Leave History (system-derived)
  last_leave_return_date DATE,         -- Date of return to duty after last leave
  last_leave_commuted_date DATE,       -- Date leave last commuted
  last_travel_allowance_date DATE,     -- Date leave travel allowance last received
  
  -- Part A: Annual Leave Request
  leave_days_applied INTEGER NOT NULL CHECK (leave_days_applied > 0),
  leave_start_date DATE NOT NULL,
  days_commuted INTEGER NOT NULL DEFAULT 0 CHECK (days_commuted >= 0),
  total_days_deducted INTEGER NOT NULL, -- leave_days_applied + days_commuted
  leave_address TEXT NOT NULL,
  resume_date DATE,                    -- Auto-calculated
  
  -- Part A: Submission
  employee_signature BOOLEAN NOT NULL DEFAULT FALSE,
  application_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Status
  status public.annual_leave_status NOT NULL DEFAULT 'submitted',
  
  -- Part A: Leave balance snapshot at time of application
  leave_balance_before NUMERIC(6,1),
  leave_balance_after NUMERIC(6,1),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Annual Leave Approval Trail (Parts B, C, D)
-- =============================================================================
CREATE TABLE public.annual_leave_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_id UUID NOT NULL REFERENCES public.annual_leave_applications(id) ON DELETE CASCADE,
  
  -- Part B: Head of Department Review
  hod_id UUID REFERENCES public.profiles(id),
  hod_recommendation TEXT CHECK (hod_recommendation IN ('recommended', 'not_recommended')),
  hod_correctness_certified BOOLEAN DEFAULT FALSE,
  hod_employment_status public.employment_status_type,
  hod_designation TEXT,
  hod_comment TEXT,
  hod_signature BOOLEAN DEFAULT FALSE,
  hod_date TIMESTAMPTZ,
  
  -- Part C: Human Resource Officer Validation
  hr_officer_id UUID REFERENCES public.profiles(id),
  hr_leave_days_brought_forward NUMERIC(6,1),  -- From leave ledger
  hr_qualifying_service_from DATE,              -- Date after last leave
  hr_qualifying_service_to DATE,                -- Proposed leave start
  hr_grade TEXT,
  hr_months_in_service NUMERIC(5,1),           -- Auto-calculated
  hr_leave_balance NUMERIC(6,1),               -- Computed balance
  hr_certified BOOLEAN DEFAULT FALSE,
  hr_comment TEXT,
  hr_signature BOOLEAN DEFAULT FALSE,
  hr_date TIMESTAMPTZ,
  
  -- Part D: Head of Agency Approval
  agency_head_id UUID REFERENCES public.profiles(id),
  agency_leave_granted_days INTEGER,
  agency_leave_type TEXT DEFAULT 'Annual leave with pay',
  agency_resume_duty_date DATE,
  agency_approved BOOLEAN,
  agency_comment TEXT,
  agency_signature BOOLEAN DEFAULT FALSE,
  agency_date TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(leave_id)
);

-- =============================================================================
-- Annual Leave Ledger (Running balance per employee per year)
-- =============================================================================
CREATE TABLE public.annual_leave_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  
  -- Balance tracking
  opening_balance NUMERIC(6,1) NOT NULL DEFAULT 0,
  days_earned NUMERIC(6,1) NOT NULL DEFAULT 0,        -- Accrued based on months in service
  days_taken NUMERIC(6,1) NOT NULL DEFAULT 0,
  days_commuted NUMERIC(6,1) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(6,1) NOT NULL DEFAULT 0,
  
  -- Carry forward
  carry_forward_from_previous NUMERIC(6,1) DEFAULT 0,
  
  -- Audit
  last_updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(employee_id, year)
);

-- =============================================================================
-- Annual Leave Distribution Log (Replacing paper copies)
-- =============================================================================
CREATE TABLE public.annual_leave_distribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_id UUID NOT NULL REFERENCES public.annual_leave_applications(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('officer', 'officer_file', 'finance', 'hod', 'hr')),
  recipient_id UUID REFERENCES public.profiles(id),
  notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX idx_annual_leave_employee ON public.annual_leave_applications(employee_id);
CREATE INDEX idx_annual_leave_user ON public.annual_leave_applications(user_id);
CREATE INDEX idx_annual_leave_status ON public.annual_leave_applications(status);
CREATE INDEX idx_annual_leave_dates ON public.annual_leave_applications(leave_start_date, resume_date);
CREATE INDEX idx_annual_leave_approvals_leave ON public.annual_leave_approvals(leave_id);
CREATE INDEX idx_annual_leave_ledger_employee ON public.annual_leave_ledger(employee_id);
CREATE INDEX idx_annual_leave_distribution_leave ON public.annual_leave_distribution(leave_id);

-- =============================================================================
-- RLS Policies
-- =============================================================================
ALTER TABLE public.annual_leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_leave_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_leave_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_leave_distribution ENABLE ROW LEVEL SECURITY;

-- Annual Leave Applications: Employee can view/insert own
CREATE POLICY "Users can view own annual leave applications"
  ON public.annual_leave_applications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own annual leave applications"
  ON public.annual_leave_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can cancel own draft/submitted applications"
  ON public.annual_leave_applications FOR UPDATE
  USING (user_id = auth.uid() AND status IN ('draft', 'submitted'))
  WITH CHECK (status = 'cancelled');

-- Staff/Admin can view and update all annual leave applications
CREATE POLICY "Staff and admin can view all annual leave applications"
  ON public.annual_leave_applications FOR SELECT
  USING (public.is_staff_or_admin());

CREATE POLICY "Staff and admin can update annual leave applications"
  ON public.annual_leave_applications FOR UPDATE
  USING (public.is_staff_or_admin());

-- Annual Leave Approvals: Staff/Admin can manage
CREATE POLICY "Staff and admin can view all annual leave approvals"
  ON public.annual_leave_approvals FOR SELECT
  USING (public.is_staff_or_admin());

CREATE POLICY "Staff and admin can manage annual leave approvals"
  ON public.annual_leave_approvals FOR ALL
  USING (public.is_staff_or_admin());

-- Employees can view approval status of their own applications
CREATE POLICY "Users can view own annual leave approval status"
  ON public.annual_leave_approvals FOR SELECT
  USING (leave_id IN (
    SELECT id FROM public.annual_leave_applications WHERE user_id = auth.uid()
  ));

-- Annual Leave Ledger: Employee can view own
CREATE POLICY "Users can view own annual leave ledger"
  ON public.annual_leave_ledger FOR SELECT
  USING (employee_id IN (
    SELECT id FROM public.staff_profiles WHERE user_id = auth.uid()
  ));

-- Staff/Admin can manage ledger
CREATE POLICY "Staff and admin can manage annual leave ledger"
  ON public.annual_leave_ledger FOR ALL
  USING (public.is_staff_or_admin());

-- Distribution: Staff/Admin can manage
CREATE POLICY "Staff and admin can manage leave distribution"
  ON public.annual_leave_distribution FOR ALL
  USING (public.is_staff_or_admin());

-- Employee can view own distribution records
CREATE POLICY "Users can view own leave distribution"
  ON public.annual_leave_distribution FOR SELECT
  USING (leave_id IN (
    SELECT id FROM public.annual_leave_applications WHERE user_id = auth.uid()
  ));
