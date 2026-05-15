import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "BRRA News <news@brra.org.zm>";

serve(async (req) => {
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
        headers: { "Content-Type": "application/json" },
      });
    }

    const formattedDate = new Date(publishedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #b8860b, #d4a017); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">BRRA News Update</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Business Regulatory Review Agency</p>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #374151; font-size: 16px;">Hi ${subscriberName},</p>
          <p style="color: #6b7280; font-size: 14px;">A new article has been published on the BRRA website:</p>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <span style="display: inline-block; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">${articleCategory}</span>
            <h2 style="color: #111827; margin: 8px 0; font-size: 20px;">${articleTitle}</h2>
            ${articleSummary ? `<p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">${articleSummary}</p>` : ""}
            <p style="color: #9ca3af; font-size: 12px; margin: 12px 0 0 0;">Published on ${formattedDate}</p>
          </div>
          <a href="https://brra.org.zm/news" style="display: inline-block; background: #b8860b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Read Full Article</a>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            You're receiving this because you subscribed to the BRRA newsletter.<br/>
            To unsubscribe, sign in to your account and manage your subscription on the News page.
          </p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: `BRRA News: ${articleTitle}`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return new Response(JSON.stringify({ error: errorText }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
