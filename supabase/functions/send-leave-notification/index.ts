// Supabase Edge Function: send-leave-notification
// Sends email notifications to H.o.D and Executive Director when a leave application is submitted.
//
// Deploy with: supabase functions deploy send-leave-notification
// Set secrets: supabase secrets set SMTP_HOST=... SMTP_PORT=... SMTP_USER=... SMTP_PASS=... SMTP_FROM=...
//
// If using Resend instead of SMTP, set: supabase secrets set RESEND_API_KEY=re_...

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SMTP_FROM = Deno.env.get("SMTP_FROM") || "noreply@brra.org.zm";

interface Recipient {
  name: string;
  email: string;
  role: string;
}

interface NotificationPayload {
  applicant_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  requested_days: number;
  recipients: Recipient[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function buildEmailHtml(recipient: Recipient, payload: NotificationPayload): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #b8860b; color: white; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; }
    .content { padding: 24px; }
    .detail-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .detail-table td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    .detail-table td:first-child { font-weight: bold; color: #666; width: 40%; }
    .footer { padding: 16px 24px; background: #f5f5f5; text-align: center; font-size: 12px; color: #999; }
    .action-note { background: #fff8e1; border: 1px solid #ffe082; border-radius: 4px; padding: 12px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>BRRA Leave Application Notification</h1>
  </div>
  <div class="content">
    <p>Dear ${recipient.name},</p>
    <p>A leave application has been submitted and requires your attention as <strong>${recipient.role}</strong>.</p>
    
    <table class="detail-table">
      <tr><td>Applicant</td><td>${payload.applicant_name}</td></tr>
      <tr><td>Leave Type</td><td>${payload.leave_type}</td></tr>
      <tr><td>Start Date</td><td>${formatDate(payload.start_date)}</td></tr>
      <tr><td>End Date</td><td>${formatDate(payload.end_date)}</td></tr>
      <tr><td>Number of Days</td><td>${payload.requested_days} working day(s)</td></tr>
    </table>

    <div class="action-note">
      <strong>Action Required:</strong> Please log in to the BRRA Portal to review and process this leave application.
    </div>

    <p>Thank you.</p>
  </div>
  <div class="footer">
    <p>Business Regulatory Review Agency (BRRA) &mdash; Staff Portal</p>
    <p>This is an automated notification. Please do not reply to this email.</p>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const payload: NotificationPayload = await req.json();

    if (!payload.recipients || payload.recipients.length === 0) {
      return new Response(JSON.stringify({ error: "No recipients provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const recipient of payload.recipients) {
      if (!recipient.email) {
        results.push({ email: "", success: false, error: "No email address" });
        continue;
      }

      const subject = `Leave Application: ${payload.applicant_name} — ${payload.leave_type} (${payload.requested_days} days)`;
      const html = buildEmailHtml(recipient, payload);

      try {
        if (RESEND_API_KEY) {
          // Send via Resend API
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: SMTP_FROM,
              to: [recipient.email],
              subject,
              html,
            }),
          });

          if (!res.ok) {
            const err = await res.text();
            results.push({ email: recipient.email, success: false, error: err });
          } else {
            results.push({ email: recipient.email, success: true });
          }
        } else {
          // No email provider configured — log for debugging
          console.log(`[EMAIL NOT SENT - No provider configured] To: ${recipient.email}, Subject: ${subject}`);
          results.push({ email: recipient.email, success: false, error: "No email provider configured (set RESEND_API_KEY)" });
        }
      } catch (err: any) {
        results.push({ email: recipient.email, success: false, error: err?.message || "Send failed" });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Internal error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
