import { supabase } from "@/integrations/supabase/client";

export type RiaNotificationType =
  | "request_submitted"   // To user: your request is under review
  | "request_approved"    // To user: your request was approved, submit your RIA
  | "request_rejected";   // To user: your request was rejected

interface RiaNotificationPayload {
  recipient_name: string;
  recipient_email: string;
  notification_type: RiaNotificationType;
  ria_title: string;
  organization: string;
  reviewer_name?: string;
  rejection_reason?: string;
}

export async function sendRiaNotification(payload: RiaNotificationPayload): Promise<void> {
  if (!payload.recipient_email) return;

  try {
    const { error } = await (supabase as any).rpc("send_ria_notification_email", {
      recipient_name: payload.recipient_name,
      recipient_email: payload.recipient_email,
      notification_type: payload.notification_type,
      ria_title: payload.ria_title,
      organization: payload.organization,
      reviewer_name: payload.reviewer_name || null,
      rejection_reason: payload.rejection_reason || null,
    });

    if (error) {
      console.error(`[RIA Email] Failed to send to ${payload.recipient_email}:`, error.message);
    } else {
      console.log(`[RIA Email] Notification sent to ${payload.recipient_email} (type: ${payload.notification_type})`);
    }
  } catch (err) {
    console.error(`[RIA Email] Error sending to ${payload.recipient_email}:`, err);
  }
}
