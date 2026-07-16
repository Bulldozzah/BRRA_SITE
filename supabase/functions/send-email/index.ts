// Supabase Edge Function: send-email
// Sends email via Microsoft Graph (client-credentials flow) as the shared
// mailbox in MAIL_FROM. Called server-side by the database (pg_net) — the
// caller must present the shared secret in the "x-mail-secret" header.
//
// Deploy:  supabase functions deploy send-email --no-verify-jwt --project-ref vdkgbblnfbzjdgvafyxm
// Secrets: supabase secrets set MS_TENANT_ID=... MS_CLIENT_ID=... MS_CLIENT_SECRET=... MAIL_FROM=... MAIL_WEBHOOK_SECRET=... --project-ref vdkgbblnfbzjdgvafyxm

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MS_TENANT_ID = Deno.env.get("MS_TENANT_ID") || "";
const MS_CLIENT_ID = Deno.env.get("MS_CLIENT_ID") || "";
const MS_CLIENT_SECRET = Deno.env.get("MS_CLIENT_SECRET") || "";
const MAIL_FROM = Deno.env.get("MAIL_FROM") || "noreply@brra.org.zm";
const MAIL_WEBHOOK_SECRET = Deno.env.get("MAIL_WEBHOOK_SECRET") || "";

interface SendPayload {
  to: string | string[];
  subject: string;
  html: string;
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

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!MAIL_WEBHOOK_SECRET || req.headers.get("x-mail-secret") !== MAIL_WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload: SendPayload = await req.json();
    const recipients = (Array.isArray(payload.to) ? payload.to : [payload.to])
      .filter((e) => typeof e === "string" && e.includes("@"));

    if (recipients.length === 0 || !payload.subject || !payload.html) {
      return new Response(
        JSON.stringify({ error: "Required: to, subject, html" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

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
            subject: payload.subject,
            body: { contentType: "HTML", content: payload.html },
            toRecipients: recipients.map((address) => ({ emailAddress: { address } })),
          },
          saveToSentItems: false,
        }),
      },
    );

    // Graph returns 202 Accepted with an empty body on success
    if (res.status !== 202) {
      const err = await res.text();
      console.error(`Graph sendMail failed (${res.status}): ${err}`);
      return new Response(
        JSON.stringify({ error: `Graph sendMail failed (${res.status})`, detail: err }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ success: true, to: recipients }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
