import { supabase } from "@/integrations/supabase/client";

interface Recipient {
  name: string;
  email: string;
  role: string;
}

interface LeaveNotificationPayload {
  applicant_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  requested_days: number;
  recipients: Recipient[];
}

export async function sendLeaveNotification(payload: LeaveNotificationPayload): Promise<void> {
  for (const recipient of payload.recipients) {
    if (!recipient.email) continue;

    try {
      const { error } = await (supabase as any).rpc("send_leave_notification_email", {
        recipient_name: recipient.name,
        recipient_email: recipient.email,
        recipient_role: recipient.role,
        applicant_name: payload.applicant_name,
        leave_type: payload.leave_type,
        start_date: payload.start_date,
        end_date: payload.end_date,
        requested_days: payload.requested_days,
      });

      if (error) {
        console.error(`[Email] Failed to send to ${recipient.email}:`, error.message);
      } else {
        console.log(`[Email] Notification sent to ${recipient.email} (${recipient.role})`);
      }
    } catch (err) {
      console.error(`[Email] Error sending to ${recipient.email}:`, err);
    }
  }
}
