-- =============================================================================
-- Update send_ria_notification_email function
-- Adds recipient_role + requester_name params and request_submitted_staff type
-- Mirrors the same pg_net / Resend approach as send_leave_notification_email
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Drop all existing overloaded versions
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT oid::regprocedure AS func_sig
    FROM pg_proc
    WHERE proname = 'send_ria_notification_email'
      AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_sig || ' CASCADE';
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_ria_notification_email(
  recipient_name    TEXT,
  recipient_email   TEXT,
  notification_type TEXT,
  ria_title         TEXT,
  organization      TEXT,
  recipient_role    TEXT    DEFAULT 'Staff',
  requester_name    TEXT    DEFAULT NULL,
  tracking_number   TEXT    DEFAULT NULL,
  reviewer_name     TEXT    DEFAULT NULL,
  rejection_reason  TEXT    DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_subject      TEXT;
  email_body_message TEXT;
  email_action_note  TEXT;
  status_color       TEXT;
  status_label       TEXT;
  email_html         TEXT;
  mail_secret        TEXT;
BEGIN
  -- Shared secret for the send-email Edge Function, stored in Supabase Vault:
  -- select vault.create_secret('<secret>', 'mail_webhook_secret');
  SELECT decrypted_secret INTO mail_secret
  FROM vault.decrypted_secrets
  WHERE name = 'mail_webhook_secret';

  IF mail_secret IS NULL OR mail_secret = '' THEN
    RAISE WARNING 'mail_webhook_secret not found in Vault; email to % not sent', recipient_email;
    RETURN;
  END IF;
  CASE notification_type

    WHEN 'request_submitted' THEN
      email_subject      := 'BRRA — RIA Submission Request Received';
      email_body_message := 'Your request to submit a Regulatory Impact Assessment has been received and is currently <strong>under review</strong>.';
      email_action_note  := 'Our team will review your request and notify you once a decision has been made. This process typically takes 1–3 business days.';
      status_color       := '#f59e0b';
      status_label       := 'PENDING REVIEW';

    WHEN 'request_submitted_staff' THEN
      email_subject      := 'RIA Submission Request — ' || COALESCE(requester_name, 'A user') || ' — Action Required';
      email_body_message := 'A new RIA submission request has been received from <strong>' || COALESCE(requester_name, 'a registered user') || '</strong> and requires review as <strong>' || recipient_role || '</strong>.';
      email_action_note  := '<strong>Action Required:</strong> Please log in to the BRRA Portal and navigate to <em>RIA Management &rarr; Submission Requests</em> to approve or reject this request.';
      status_color       := '#f59e0b';
      status_label       := 'ACTION REQUIRED';

    WHEN 'request_approved' THEN
      email_subject      := 'BRRA — RIA Submission Request Approved';
      email_body_message := 'Your request to submit a Regulatory Impact Assessment has been <strong>approved</strong> by ' || COALESCE(reviewer_name, 'BRRA Staff') || '.';
      email_action_note  := 'You can now proceed to submit your full RIA document by logging into the BRRA Portal and navigating to <em>Submit RIA</em>. Please ensure your submission includes all required documentation.';
      status_color       := '#22c55e';
      status_label       := 'APPROVED';

    WHEN 'request_rejected' THEN
      email_subject      := 'BRRA — RIA Submission Request Update';
      email_body_message := 'Your request to submit a Regulatory Impact Assessment has <strong>not been approved</strong> at this time.';
      email_action_note  := CASE
        WHEN rejection_reason IS NOT NULL AND rejection_reason <> ''
        THEN '<strong>Reason:</strong> ' || rejection_reason || '<br><br>If you believe this decision was made in error, please contact our office.'
        ELSE 'If you believe this decision was made in error, or would like to discuss further, please contact our office.'
      END;
      status_color       := '#ef4444';
      status_label       := 'NOT APPROVED';

    WHEN 'ria_submitted' THEN
      email_subject      := 'BRRA — RIA Submitted Successfully [' || COALESCE(tracking_number, '') || ']';
      email_body_message := 'Your Regulatory Impact Assessment has been <strong>successfully submitted</strong>.';
      email_action_note  := 'Please keep your RIA number for your records. You can use it to track the progress of your submission on the BRRA Portal.';
      status_color       := '#22c55e';
      status_label       := 'SUBMITTED';

    ELSE
      RETURN;
  END CASE;

  email_html :=
      '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
    || 'body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto}'
    || '.header{background:#b8860b;color:white;padding:20px;text-align:center}'
    || '.header h1{margin:0;font-size:20px}'
    || '.content{padding:24px}'
    || '.status-badge{display:inline-block;padding:4px 12px;border-radius:4px;font-size:12px;font-weight:bold;color:white;background:' || status_color || '}'
    || '.detail-table{width:100%;border-collapse:collapse;margin:16px 0}'
    || '.detail-table td{padding:8px 12px;border-bottom:1px solid #eee}'
    || '.detail-table td:first-child{font-weight:bold;color:#666;width:40%}'
    || '.footer{padding:16px 24px;background:#f5f5f5;text-align:center;font-size:12px;color:#999}'
    || '.action-note{background:#fff8e1;border:1px solid #ffe082;border-radius:4px;padding:12px;margin:16px 0}'
    || '</style></head><body>'
    || '<div class="header"><h1>BRRA — Regulatory Impact Assessment</h1></div>'
    || '<div class="content">'
    || '<p>Dear ' || recipient_name || ',</p>'
    || '<p>' || email_body_message || '</p>'
    || '<p><span class="status-badge">' || status_label || '</span></p>'
    || '<table class="detail-table">'
    || '<tr><td>Title</td><td>' || ria_title || '</td></tr>'
    || '<tr><td>Organization</td><td>' || organization || '</td></tr>';

  IF requester_name IS NOT NULL AND requester_name <> '' THEN
    email_html := email_html
      || '<tr><td>Submitted By</td><td>' || requester_name || '</td></tr>';
  END IF;

  IF tracking_number IS NOT NULL AND tracking_number <> '' THEN
    email_html := email_html
      || '<tr><td>RIA Number</td><td><strong>' || tracking_number || '</strong></td></tr>';
  END IF;

  IF reviewer_name IS NOT NULL AND reviewer_name <> '' THEN
    email_html := email_html
      || '<tr><td>Reviewed By</td><td>' || reviewer_name || '</td></tr>';
  END IF;

  email_html := email_html
    || '<tr><td>Date</td><td>' || to_char(now(), 'DD Mon YYYY') || '</td></tr>'
    || '</table>'
    || '<div class="action-note">' || email_action_note || '</div>'
    || '<p>Thank you.</p>'
    || '</div>'
    || '<div class="footer">'
    || '<p>Business Regulatory Review Agency (BRRA) &mdash; RIA Portal</p>'
    || '<p>This is an automated notification. Please do not reply to this email.</p>'
    || '</div></body></html>';

  -- Send via pg_net HTTP POST to the send-email Edge Function (Microsoft Graph)
  PERFORM net.http_post(
    url     := 'https://vdkgbblnfbzjdgvafyxm.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-mail-secret', mail_secret
    ),
    body    := jsonb_build_object(
      'to',      jsonb_build_array(recipient_email),
      'subject', email_subject,
      'html',    email_html
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_ria_notification_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_ria_notification_email TO anon;
