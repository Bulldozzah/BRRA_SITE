import { supabase } from "@/integrations/supabase/client";

export type LeaveNotificationType =
  | "submitted"           // To applicant: your leave is pending
  | "submitted_approver"  // To H.o.D / ED: new application needs review
  | "hod_recommended"     // To applicant: H.o.D recommended, awaiting ED
  | "hod_recommended_ed"  // To ED: H.o.D recommended, needs your approval
  | "hod_not_recommended" // To applicant: H.o.D did not recommend
  | "approved"            // To applicant: ED approved
  | "rejected";           // To applicant: ED rejected

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
  notification_type: LeaveNotificationType;
  reviewer_comment?: string;
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
        notification_type: payload.notification_type,
        reviewer_comment: payload.reviewer_comment || null,
      });

      if (error) {
        console.error(`[Email] Failed to send to ${recipient.email}:`, error.message);
      } else {
        console.log(`[Email] Notification sent to ${recipient.email} (${recipient.role}, type: ${payload.notification_type})`);
      }
    } catch (err) {
      console.error(`[Email] Error sending to ${recipient.email}:`, err);
    }
  }
}
