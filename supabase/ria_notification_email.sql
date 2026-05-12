-- =============================================================================
-- RIA Notification Email Function
-- Called via supabase.rpc('send_ria_notification_email', {...})
-- Uses pg_net or hooks to send actual emails via your email provider.
-- This function logs the notification; actual delivery depends on your
-- Supabase Edge Function or webhook trigger.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.send_ria_notification_email(
  recipient_name TEXT,
  recipient_email TEXT,
  notification_type TEXT,
  ria_title TEXT,
  organization TEXT,
  reviewer_name TEXT DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  email_subject TEXT;
  email_body TEXT;
BEGIN
  -- Build email subject and body based on notification type
  CASE notification_type
    WHEN 'request_submitted' THEN
      email_subject := 'BRRA - RIA Submission Request Received';
      email_body := format(
        E'Dear %s,\n\nYour request to submit a Regulatory Impact Assessment has been received and is currently under review.\n\nDetails:\n- Title: %s\n- Organization: %s\n\nOur team will review your request and notify you once a decision has been made. This process typically takes 1-3 business days.\n\nThank you for your submission.\n\nRegards,\nBusiness Regulatory Review Agency (BRRA)',
        recipient_name, ria_title, organization
      );

    WHEN 'request_approved' THEN
      email_subject := 'BRRA - RIA Submission Request Approved';
      email_body := format(
        E'Dear %s,\n\nGreat news! Your request to submit a Regulatory Impact Assessment has been approved.\n\nDetails:\n- Title: %s\n- Organization: %s\n- Reviewed by: %s\n\nYou can now proceed to submit your full RIA document by logging into the BRRA Portal and navigating to Submit RIA.\n\nPlease ensure your submission includes all required documentation.\n\nRegards,\nBusiness Regulatory Review Agency (BRRA)',
        recipient_name, ria_title, organization, COALESCE(reviewer_name, 'BRRA Staff')
      );

    WHEN 'request_rejected' THEN
      email_subject := 'BRRA - RIA Submission Request Update';
      email_body := format(
        E'Dear %s,\n\nWe regret to inform you that your request to submit a Regulatory Impact Assessment has not been approved at this time.\n\nDetails:\n- Title: %s\n- Organization: %s\n- Reviewed by: %s\n%s\n\nIf you believe this decision was made in error, or if you would like to discuss further, please contact our office.\n\nRegards,\nBusiness Regulatory Review Agency (BRRA)',
        recipient_name, ria_title, organization, COALESCE(reviewer_name, 'BRRA Staff'),
        CASE WHEN rejection_reason IS NOT NULL AND rejection_reason != ''
          THEN format(E'- Reason: %s', rejection_reason)
          ELSE ''
        END
      );

    ELSE
      RETURN;
  END CASE;

  -- Insert into a notifications log table (optional - for audit)
  -- You can also trigger an Edge Function via pg_net here
  INSERT INTO public.email_notifications_log (recipient_email, recipient_name, subject, body, notification_type, created_at)
  VALUES (recipient_email, recipient_name, email_subject, email_body, notification_type, now())
  ON CONFLICT DO NOTHING;

  -- If using Supabase Edge Functions with pg_net:
  -- PERFORM net.http_post(
  --   url := 'https://YOUR_PROJECT.supabase.co/functions/v1/send-email',
  --   body := json_build_object('to', recipient_email, 'subject', email_subject, 'body', email_body)::text,
  --   headers := json_build_object('Authorization', 'Bearer YOUR_SERVICE_KEY')::jsonb
  -- );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create the email log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.email_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
