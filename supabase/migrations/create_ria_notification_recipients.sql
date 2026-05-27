-- =============================================================================
-- RIA Notification Recipients
-- Admin-managed list of staff who receive an email when a RIA request is made.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ria_notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_profile_id UUID REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  added_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ria_notif_recipients_active ON public.ria_notification_recipients(is_active);

-- RLS
ALTER TABLE public.ria_notification_recipients ENABLE ROW LEVEL SECURITY;

-- Only admins can manage recipients
CREATE POLICY "Admins can manage ria notification recipients"
  ON public.ria_notification_recipients
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Staff/admin can read recipients (needed for sending emails)
CREATE POLICY "Staff can read ria notification recipients"
  ON public.ria_notification_recipients
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')));
