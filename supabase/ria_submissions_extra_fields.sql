-- =============================================================================
-- Additional fields for ria_submissions (management features)
-- =============================================================================

ALTER TABLE public.ria_submissions
  ADD COLUMN IF NOT EXISTS review_notes TEXT,
  ADD COLUMN IF NOT EXISTS economic_impact TEXT,
  ADD COLUMN IF NOT EXISTS social_impact TEXT,
  ADD COLUMN IF NOT EXISTS environmental_impact TEXT,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add acted_by_name to stage history if not exists
ALTER TABLE public.ria_stage_history
  ADD COLUMN IF NOT EXISTS acted_by_name TEXT;
