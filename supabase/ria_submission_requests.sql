-- =============================================================================
-- RIA Submission Requests Table
-- Users must request permission to submit a RIA; staff approves/rejects.
-- Staff members bypass this and submit directly.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ria_submission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  organization TEXT NOT NULL,
  organization_type TEXT NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  purpose TEXT NOT NULL,
  sector TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ria_sub_requests_user ON public.ria_submission_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ria_sub_requests_status ON public.ria_submission_requests(status);

-- RLS
ALTER TABLE public.ria_submission_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own requests" ON public.ria_submission_requests
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert requests
CREATE POLICY "Users can insert requests" ON public.ria_submission_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Staff can view all requests
CREATE POLICY "Staff can view all requests" ON public.ria_submission_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

-- Staff can update requests (approve/reject)
CREATE POLICY "Staff can update requests" ON public.ria_submission_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );
