-- =============================================================================
-- Server-side email sending via Resend API using pg_net
-- This avoids CORS issues by sending emails from the database server
-- =============================================================================

-- Enable pg_net extension (pre-installed on Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to send a leave notification email via Resend API
CREATE OR REPLACE FUNCTION public.send_leave_notification_email(
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_role TEXT,
  applicant_name TEXT,
  leave_type TEXT,
  start_date TEXT,
  end_date TEXT,
  requested_days INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_subject TEXT;
  email_html TEXT;
  resend_api_key TEXT := 're_5NwCTYJa_PM2zyixPak4sBuDRZpC6sCTC';
  from_email TEXT := 'Webmaster <team@wiseuprent.com>';
BEGIN
  email_subject := 'Leave Application: ' || applicant_name || ' — ' || leave_type || ' (' || requested_days || ' days)';

  email_html := '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
    || 'body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto}'
    || '.header{background:#b8860b;color:white;padding:20px;text-align:center}'
    || '.header h1{margin:0;font-size:20px}'
    || '.content{padding:24px}'
    || '.detail-table{width:100%;border-collapse:collapse;margin:16px 0}'
    || '.detail-table td{padding:8px 12px;border-bottom:1px solid #eee}'
    || '.detail-table td:first-child{font-weight:bold;color:#666;width:40%}'
    || '.footer{padding:16px 24px;background:#f5f5f5;text-align:center;font-size:12px;color:#999}'
    || '.action-note{background:#fff8e1;border:1px solid #ffe082;border-radius:4px;padding:12px;margin:16px 0}'
    || '</style></head><body>'
    || '<div class="header"><h1>BRRA Leave Application Notification</h1></div>'
    || '<div class="content">'
    || '<p>Dear ' || recipient_name || ',</p>'
    || '<p>A leave application has been submitted and requires your attention as <strong>' || recipient_role || '</strong>.</p>'
    || '<table class="detail-table">'
    || '<tr><td>Applicant</td><td>' || applicant_name || '</td></tr>'
    || '<tr><td>Leave Type</td><td>' || leave_type || '</td></tr>'
    || '<tr><td>Start Date</td><td>' || start_date || '</td></tr>'
    || '<tr><td>End Date</td><td>' || end_date || '</td></tr>'
    || '<tr><td>Number of Days</td><td>' || requested_days || ' working day(s)</td></tr>'
    || '</table>'
    || '<div class="action-note"><strong>Action Required:</strong> Please log in to the BRRA Portal to review and process this leave application.</div>'
    || '<p>Thank you.</p>'
    || '</div>'
    || '<div class="footer">'
    || '<p>Business Regulatory Review Agency (BRRA) — Staff Portal</p>'
    || '<p>This is an automated notification. Please do not reply to this email.</p>'
    || '</div></body></html>';

  -- Send via pg_net HTTP POST to Resend API
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || resend_api_key
    ),
    body := jsonb_build_object(
      'from', from_email,
      'to', jsonb_build_array(recipient_email),
      'subject', email_subject,
      'html', email_html
    )
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.send_leave_notification_email TO authenticated;
