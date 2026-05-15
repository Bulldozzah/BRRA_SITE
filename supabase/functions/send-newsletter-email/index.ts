// Supabase Edge Function: send-newsletter-email
// Sends newsletter notification emails to subscribers when news is published.
//
// Deploy with: supabase functions deploy send-newsletter-email
// Set secrets: supabase secrets set RESEND_API_KEY=re_... SMTP_FROM=noreply@brra.org.zm
//
// Uses the same email settings as send-leave-notification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SMTP_FROM = Deno.env.get("SMTP_FROM") || "noreply@brra.org.zm";

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
    const { to, subscriberName, articleTitle, articleSummary, articleCategory, publishedAt } = await req.json();

    if (!to || !articleTitle) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const formattedDate = new Date(publishedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const subject = `BRRA News: ${articleTitle}`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #b8860b; color: white; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; }
    .header p { margin: 5px 0 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 24px; }
    .article-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 20px; margin: 16px 0; }
    .category { display: inline-block; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 8px; }
    .article-title { color: #111827; margin: 8px 0; font-size: 20px; }
    .article-summary { color: #6b7280; font-size: 14px; margin: 8px 0 0 0; }
    .article-date { color: #9ca3af; font-size: 12px; margin: 12px 0 0 0; }
    .btn { display: inline-block; background: #b8860b; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 14px; }
    .footer { padding: 16px 24px; background: #f5f5f5; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <h1>BRRA News Update</h1>
    <p>Business Regulatory Review Agency</p>
  </div>
  <div class="content">
    <p>Dear ${subscriberName},</p>
    <p>A new article has been published on the BRRA website:</p>
    <div class="article-box">
      <span class="category">${articleCategory}</span>
      <h2 class="article-title">${articleTitle}</h2>
      ${articleSummary ? `<p class="article-summary">${articleSummary}</p>` : ""}
      <p class="article-date">Published on ${formattedDate}</p>
    </div>
    <a href="https://brra.org.zm/news" class="btn">Read Full Article</a>
  </div>
  <div class="footer">
    <p>Business Regulatory Review Agency (BRRA)</p>
    <p>You're receiving this because you subscribed to the BRRA newsletter.<br/>
    To unsubscribe, sign in to your account and manage your subscription on the News page.</p>
  </div>
</body>
</html>`;

    if (RESEND_API_KEY) {
      // Send via Resend API (same as send-leave-notification)
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: SMTP_FROM,
          to: [to],
          subject,
          html: htmlBody,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return new Response(JSON.stringify({ error: errorText }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    } else {
      // No email provider configured — log for debugging
      console.log(`[EMAIL NOT SENT - No provider configured] To: ${to}, Subject: ${subject}`);
      return new Response(JSON.stringify({ error: "No email provider configured (set RESEND_API_KEY)" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
