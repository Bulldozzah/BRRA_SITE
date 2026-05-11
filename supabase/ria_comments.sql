-- =============================================================================
-- RIA Comments Table (used by Audit Trail report)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ria_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.ria_submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  user_name TEXT,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ria_comments_sub ON public.ria_comments(submission_id);

-- RLS
ALTER TABLE public.ria_comments ENABLE ROW LEVEL SECURITY;

-- Staff can view all comments
CREATE POLICY "Staff can view all comments" ON public.ria_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

-- Staff can insert comments
CREATE POLICY "Staff can insert comments" ON public.ria_comments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

-- Users can view comments on their own submissions
CREATE POLICY "Users can view own submission comments" ON public.ria_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ria_submissions WHERE id = submission_id AND user_id = auth.uid())
  );
