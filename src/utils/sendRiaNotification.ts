import { supabase } from "@/integrations/supabase/client";

export type RiaNotificationType =
  | "request_submitted"        // To requester: your request is under review
  | "request_submitted_staff"  // To staff: a new RIA request needs review (action required)
  | "request_approved"         // To requester: request approved, you may submit RIA
  | "request_rejected"         // To requester: request was not approved
  | "ria_submitted";           // To requester: RIA submitted with tracking number

interface RiaRecipient {
  name: string;
  email: string;
  role: string;
}

interface RiaNotificationPayload {
  notification_type: RiaNotificationType;
  ria_title: string;
  organization: string;
  recipients: RiaRecipient[];
  tracking_number?: string;
  reviewer_name?: string;
  rejection_reason?: string;
  requester_name?: string;
}

export async function sendRiaNotification(payload: RiaNotificationPayload): Promise<void> {
  for (const recipient of payload.recipients) {
    if (!recipient.email) continue;

    try {
      const { error } = await (supabase as any).rpc("send_ria_notification_email", {
        recipient_name: recipient.name,
        recipient_email: recipient.email,
        recipient_role: recipient.role,
        notification_type: payload.notification_type,
        ria_title: payload.ria_title,
        organization: payload.organization,
        requester_name: payload.requester_name || null,
        tracking_number: payload.tracking_number || null,
        reviewer_name: payload.reviewer_name || null,
        rejection_reason: payload.rejection_reason || null,
      });

      if (error) {
        console.error(`[RIA Email] Failed to send to ${recipient.email}:`, error.message);
      } else {
        console.log(`[RIA Email] Sent to ${recipient.email} (${recipient.role}, type: ${payload.notification_type})`);
      }
    } catch (err) {
      console.error(`[RIA Email] Error sending to ${recipient.email}:`, err);
    }
  }
}
