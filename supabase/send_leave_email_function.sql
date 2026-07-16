-- =============================================================================
-- Server-side email sending via Resend API using pg_net
-- This avoids CORS issues by sending emails from the database server
-- Supports multiple notification types for the full approval workflow
-- =============================================================================

-- Enable pg_net extension (pre-installed on Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Drop old function signature if it exists (parameter list changed)
DROP FUNCTION IF EXISTS public.send_leave_notification_email(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER);

-- Function to send leave workflow notification emails via Resend API
-- notification_type: 'submitted', 'hod_recommended', 'hod_not_recommended', 'approved', 'rejected'
CREATE OR REPLACE FUNCTION public.send_leave_notification_email(
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_role TEXT,
  applicant_name TEXT,
  leave_type TEXT,
  start_date TEXT,
  end_date TEXT,
  requested_days INTEGER,
  notification_type TEXT DEFAULT 'submitted',
  reviewer_comment TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_subject TEXT;
  email_body_message TEXT;
  email_action_note TEXT;
  status_color TEXT;
  status_label TEXT;
  email_html TEXT;
  mail_secret TEXT;
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
  -- Determine subject, body message, action note and colors based on notification type
  CASE notification_type
    WHEN 'submitted' THEN
      email_subject := 'Leave Application Submitted — Pending Approval';
      email_body_message := 'Your <strong>' || leave_type || '</strong> application has been submitted and is now <strong>pending approval</strong> by the Head of Department.';
      email_action_note := 'Your application is being reviewed. You will be notified once the H.o.D makes a recommendation.';
      status_color := '#f59e0b';
      status_label := 'PENDING';

    WHEN 'submitted_approver' THEN
      email_subject := 'Leave Application: ' || applicant_name || ' — ' || leave_type || ' (' || requested_days || ' days)';
      email_body_message := 'A leave application has been submitted and requires your attention as <strong>' || recipient_role || '</strong>.';
      email_action_note := '<strong>Action Required:</strong> Please log in to the BRRA Portal to review and process this leave application.';
      status_color := '#f59e0b';
      status_label := 'ACTION REQUIRED';

    WHEN 'hod_recommended' THEN
      email_subject := 'Leave Application Recommended by H.o.D — Awaiting Executive Director Approval';
      email_body_message := 'Your <strong>' || leave_type || '</strong> application has been <strong>recommended</strong> by the Head of Department and is now awaiting approval by the Executive Director.';
      email_action_note := 'Your application has passed H.o.D review. You will be notified once the Executive Director makes a decision.';
      status_color := '#3b82f6';
      status_label := 'RECOMMENDED';

    WHEN 'hod_recommended_ed' THEN
      email_subject := 'Leave Application Recommended: ' || applicant_name || ' — Awaiting Your Approval';
      email_body_message := 'A leave application by <strong>' || applicant_name || '</strong> has been recommended by the Head of Department and requires your approval as <strong>Executive Director</strong>.';
      email_action_note := '<strong>Action Required:</strong> Please log in to the BRRA Portal to approve or reject this leave application.';
      status_color := '#3b82f6';
      status_label := 'ACTION REQUIRED';

    WHEN 'hod_not_recommended' THEN
      email_subject := 'Leave Application Not Recommended by H.o.D';
      email_body_message := 'Your <strong>' || leave_type || '</strong> application was <strong>not recommended</strong> by the Head of Department.';
      email_action_note := 'Please contact your Head of Department or HR for more information.';
      status_color := '#f97316';
      status_label := 'NOT RECOMMENDED';

    WHEN 'approved' THEN
      email_subject := 'Leave Application Approved — ' || leave_type;
      email_body_message := 'Your <strong>' || leave_type || '</strong> application has been <strong>approved</strong> by the Executive Director.';
      email_action_note := 'Your leave has been approved. Please ensure proper handover before your leave begins.';
      status_color := '#22c55e';
      status_label := 'APPROVED';

    WHEN 'rejected' THEN
      email_subject := 'Leave Application Rejected — ' || leave_type;
      email_body_message := 'Your <strong>' || leave_type || '</strong> application has been <strong>rejected</strong> by the Executive Director.';
      email_action_note := 'Please contact the Executive Director or HR for more information.';
      status_color := '#ef4444';
      status_label := 'REJECTED';

    ELSE
      email_subject := 'Leave Application Update — ' || leave_type;
      email_body_message := 'There is an update on a <strong>' || leave_type || '</strong> application.';
      email_action_note := 'Please log in to the BRRA Portal for details.';
      status_color := '#6b7280';
      status_label := 'UPDATE';
  END CASE;

  email_html := '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
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
    || '.comment-box{background:#f0f4ff;border:1px solid #c7d2fe;border-radius:4px;padding:12px;margin:16px 0}'
    || '</style></head><body>'
    || '<div class="header"><h1>BRRA Leave Application Notification</h1></div>'
    || '<div class="content">'
    || '<p>Dear ' || recipient_name || ',</p>'
    || '<p>' || email_body_message || '</p>'
    || '<p><span class="status-badge">' || status_label || '</span></p>'
    || '<table class="detail-table">'
    || '<tr><td>Applicant</td><td>' || applicant_name || '</td></tr>'
    || '<tr><td>Leave Type</td><td>' || leave_type || '</td></tr>'
    || '<tr><td>Start Date</td><td>' || start_date || '</td></tr>'
    || '<tr><td>End Date</td><td>' || end_date || '</td></tr>'
    || '<tr><td>Number of Days</td><td>' || requested_days || ' working day(s)</td></tr>'
    || '</table>';

  -- Add reviewer comment if provided
  IF reviewer_comment IS NOT NULL AND reviewer_comment <> '' THEN
    email_html := email_html
      || '<div class="comment-box"><strong>Reviewer Comment:</strong><br>' || reviewer_comment || '</div>';
  END IF;

  email_html := email_html
    || '<div class="action-note">' || email_action_note || '</div>'
    || '<p>Thank you.</p>'
    || '<p style="margin:16px 0"><a href="https://brra.org.zm/portal/login" style="display:inline-block;background:#b8860b;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:4px;font-weight:bold">Open BRRA Portal</a></p>'
    || '</div>'
    || '<div class="footer">'
    || '<p>Business Regulatory Review Agency (BRRA) — Staff Portal</p>'
    || '<p>This is an automated notification. Please do not reply to this email.</p>'
    || '</div></body></html>';

  -- Send via pg_net HTTP POST to the send-email Edge Function (Microsoft Graph)
  PERFORM net.http_post(
    url := 'https://vdkgbblnfbzjdgvafyxm.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-mail-secret', mail_secret
    ),
    body := jsonb_build_object(
      'to', jsonb_build_array(recipient_email),
      'subject', email_subject,
      'html', email_html
    )
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.send_leave_notification_email TO authenticated;
