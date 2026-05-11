-- =============================================================================
-- RIA Submissions & Stage History Tables
-- =============================================================================

-- Organization types enum
CREATE TYPE public.ria_organization_type AS ENUM (
  'ministry', 'agency', 'regulatory_body', 'parastatal', 'local_authority', 'private_sector', 'other'
);

-- Regulation types enum
CREATE TYPE public.ria_regulation_type AS ENUM (
  'new_regulation', 'amendment', 'repeal'
);

-- RIA submission status enum
CREATE TYPE public.ria_status AS ENUM (
  'submitted', 'in_review', 'completed', 'rejected'
);

-- Main submissions table
CREATE TABLE IF NOT EXISTS public.ria_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  submitter_name TEXT NOT NULL,
  submitter_email TEXT NOT NULL,
  submitter_phone TEXT,
  organization TEXT NOT NULL,
  organization_type public.ria_organization_type NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sector TEXT NOT NULL,
  regulation_type public.ria_regulation_type NOT NULL DEFAULT 'new_regulation',
  document_filename TEXT,
  document_path TEXT,
  status public.ria_status NOT NULL DEFAULT 'submitted',
  current_stage INT NOT NULL DEFAULT 1,
  stage_name TEXT NOT NULL DEFAULT 'Submission Received',
  progress_percentage INT NOT NULL DEFAULT 7,
  assigned_officer_id UUID REFERENCES public.profiles(id),
  assigned_officer_name TEXT,
  final_report_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stage history table
CREATE TABLE IF NOT EXISTS public.ria_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.ria_submissions(id) ON DELETE CASCADE,
  stage_number INT NOT NULL,
  stage_name TEXT NOT NULL,
  notes TEXT,
  acted_by UUID REFERENCES public.profiles(id),
  acted_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ria_submissions_user ON public.ria_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_ria_submissions_status ON public.ria_submissions(status);
CREATE INDEX IF NOT EXISTS idx_ria_submissions_tracking ON public.ria_submissions(tracking_number);
CREATE INDEX IF NOT EXISTS idx_ria_stage_history_sub ON public.ria_stage_history(submission_id);

-- RLS Policies
ALTER TABLE public.ria_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ria_stage_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON public.ria_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own submissions
CREATE POLICY "Users can insert own submissions" ON public.ria_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Staff/admin can view all submissions
CREATE POLICY "Staff can view all submissions" ON public.ria_submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

-- Staff/admin can update submissions
CREATE POLICY "Staff can update submissions" ON public.ria_submissions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

-- Users can view stage history for their submissions
CREATE POLICY "Users can view own stage history" ON public.ria_stage_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ria_submissions WHERE id = submission_id AND user_id = auth.uid())
  );

-- Staff can view and insert stage history
CREATE POLICY "Staff can view all stage history" ON public.ria_stage_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

CREATE POLICY "Staff can insert stage history" ON public.ria_stage_history
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

-- Users can insert stage history for initial submission
CREATE POLICY "Users can insert initial stage" ON public.ria_stage_history
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.ria_submissions WHERE id = submission_id AND user_id = auth.uid())
  );

-- Create storage bucket for RIA documents
INSERT INTO storage.buckets (id, name, public) VALUES ('ria-documents', 'ria-documents', false)
ON CONFLICT (id) DO NOTHING;
