// Supabase Edge Function: send-auth-email
// Auth "Send Email" hook — Supabase Auth (GoTrue) calls this instead of SMTP
// for signup confirmations, password resets, magic links, invites and email
// changes. Sends via Microsoft Graph (client-credentials flow) as MAIL_FROM,
// reusing the same MS_* secrets as the send-email function.
//
// Deploy:  supabase functions deploy send-auth-email --no-verify-jwt --project-ref vdkgbblnfbzjdgvafyxm
// Enable:  Dashboard → Authentication → Hooks → Send Email hook → point at this
//          function's URL, then copy the generated secret and run:
//          supabase secrets set SEND_EMAIL_HOOK_SECRET=v1,whsec_... --project-ref vdkgbblnfbzjdgvafyxm

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const MS_TENANT_ID = Deno.env.get("MS_TENANT_ID") || "";
const MS_CLIENT_ID = Deno.env.get("MS_CLIENT_ID") || "";
const MS_CLIENT_SECRET = Deno.env.get("MS_CLIENT_SECRET") || "";
const MAIL_FROM = Deno.env.get("MAIL_FROM") || "noreply@brra.org.zm";
const HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";

interface EmailData {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
  token_new?: string;
  token_hash_new?: string;
}

interface HookPayload {
  user: { email: string; new_email?: string };
  email_data: EmailData;
}

// Cache the Graph token across invocations of a warm function instance
let cachedToken = "";
let tokenExpiresAt = 0;

async function getGraphToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: MS_CLIENT_ID,
        client_secret: MS_CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token request failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
  return cachedToken;
}

async function sendViaGraph(to: string, subject: string, html: string) {
  const token = await getGraphToken();
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(MAIL_FROM)}/sendMail`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: "HTML", content: html },
          toRecipients: [{ emailAddress: { address: to } }],
        },
        saveToSentItems: false,
      }),
    },
  );

  // Graph returns 202 Accepted with an empty body on success
  if (res.status !== 202) {
    const err = await res.text();
    throw new Error(`Graph sendMail failed (${res.status}): ${err}`);
  }
}

function verifyUrl(data: EmailData, tokenHash: string, type: string): string {
  const url = new URL(`${SUPABASE_URL}/auth/v1/verify`);
  url.searchParams.set("token", tokenHash);
  url.searchParams.set("type", type);
  url.searchParams.set("redirect_to", data.redirect_to || data.site_url);
  return url.toString();
}

function buildEmail(payload: HookPayload): { subject: string; html: string; to: string } {
  const { user, email_data: data } = payload;
  const type = data.email_action_type;

  let subject: string;
  let heading: string;
  let intro: string;
  let buttonLabel = "";
  let link = "";
  let otpNote = "";
  let to = user.email;

  switch (type) {
    case "signup":
      subject = "Confirm your BRRA Portal email address";
      heading = "Confirm Your Email";
      intro = "Thank you for registering on the BRRA Portal. Please confirm your email address to activate your account.";
      buttonLabel = "Confirm Email Address";
      link = verifyUrl(data, data.token_hash, "signup");
      break;
    case "recovery":
      subject = "Reset your BRRA Portal password";
      heading = "Reset Your Password";
      intro = "We received a request to reset the password for your BRRA Portal account. Click the button below to choose a new password. If you did not request this, you can safely ignore this email.";
      buttonLabel = "Reset Password";
      link = verifyUrl(data, data.token_hash, "recovery");
      break;
    case "magiclink":
      subject = "Your BRRA Portal login link";
      heading = "Log In to the BRRA Portal";
      intro = "Click the button below to log in to the BRRA Portal. This link can only be used once.";
      buttonLabel = "Log In";
      link = verifyUrl(data, data.token_hash, "magiclink");
      break;
    case "invite":
      subject = "You have been invited to the BRRA Portal";
      heading = "You're Invited";
      intro = "You have been invited to create an account on the BRRA Portal. Click the button below to accept the invitation and set up your account.";
      buttonLabel = "Accept Invitation";
      link = verifyUrl(data, data.token_hash, "invite");
      break;
    case "email_change":
      subject = "Confirm your new BRRA Portal email address";
      heading = "Confirm Email Change";
      intro = `A request was made to change your BRRA Portal email address to <strong>${user.new_email ?? ""}</strong>. Click the button below to confirm this change.`;
      buttonLabel = "Confirm Email Change";
      link = verifyUrl(data, data.token_hash, "email_change");
      break;
    case "email_change_new":
      subject = "Confirm your new BRRA Portal email address";
      heading = "Confirm Email Change";
      intro = "Please confirm this is your new email address for the BRRA Portal by clicking the button below.";
      buttonLabel = "Confirm New Email";
      link = verifyUrl(data, data.token_hash_new ?? data.token_hash, "email_change");
      to = user.new_email ?? user.email;
      break;
    case "reauthentication":
      subject = "Your BRRA Portal verification code";
      heading = "Verification Code";
      intro = "Use the code below to confirm your identity on the BRRA Portal.";
      otpNote = data.token;
      break;
    default:
      subject = "BRRA Portal notification";
      heading = "BRRA Portal";
      intro = "Please use the button below to continue.";
      buttonLabel = "Continue";
      link = verifyUrl(data, data.token_hash, type);
  }

  const button = link
    ? `<p style="margin:24px 0;text-align:center"><a href="${link}" style="display:inline-block;background:#b8860b;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:4px;font-weight:bold">${buttonLabel}</a></p>`
    : "";

  const otp = otpNote
    ? `<p style="margin:24px 0;text-align:center;font-size:28px;letter-spacing:6px;font-weight:bold">${otpNote}</p>`
    : "";

  const html = `<!DOCTYPE html><html><head><style>
    body{font-family:Arial,sans-serif;margin:0;padding:0;background:#f5f5f5}
    .wrapper{max-width:560px;margin:0 auto;background:#ffffff}
    .header{background:#b8860b;color:white;padding:20px;text-align:center}
    .header h1{margin:0;font-size:20px}
    .content{padding:24px;color:#333;font-size:14px;line-height:1.6}
    .footer{padding:16px 24px;background:#f5f5f5;text-align:center;font-size:12px;color:#999}
    </style></head><body>
    <div class="wrapper">
      <div class="header"><h1>${heading}</h1></div>
      <div class="content">
        <p>${intro}</p>
        ${button}${otp}
        ${link ? `<p style="font-size:12px;color:#666">If the button does not work, copy and paste this link into your browser:<br><a href="${link}" style="color:#b8860b;word-break:break-all">${link}</a></p>` : ""}
      </div>
      <div class="footer">Business Regulatory Review Agency &middot; This is an automated message, please do not reply.</div>
    </div>
    </body></html>`;

  return { subject, html, to };
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const rawBody = await req.text();

    if (!HOOK_SECRET) {
      throw new Error("SEND_EMAIL_HOOK_SECRET is not set");
    }

    // Supabase signs hook requests in the Standard Webhooks format
    const wh = new Webhook(HOOK_SECRET.replace("v1,whsec_", ""));
    const payload = wh.verify(rawBody, {
      "webhook-id": req.headers.get("webhook-id") ?? "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
      "webhook-signature": req.headers.get("webhook-signature") ?? "",
    }) as HookPayload;

    const { subject, html, to } = buildEmail(payload);
    await sendViaGraph(to, subject, html);

    return new Response(JSON.stringify({}), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-auth-email error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    // Error shape GoTrue expects from a failed hook
    return new Response(
      JSON.stringify({ error: { http_code: 500, message } }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
