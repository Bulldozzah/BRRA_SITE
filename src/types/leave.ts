// =============================================================================
// BRRA Leave Management System - TypeScript Types
// =============================================================================

export type LeaveType =
  | "annual"
  | "sick"
  | "study"
  | "maternity"
  | "paternity"
  | "compassionate"
  | "unpaid";

export type LeaveStatus =
  | "pending"
  | "recommended"
  | "approved"
  | "rejected"
  | "cancelled";

export interface LeaveApplication {
  id: string;
  employee_id: string;
  user_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  requested_days: number;
  leave_address: string | null;
  last_leave_end_date: string | null;
  months_since_last_leave: number | null;
  leave_rate: number;
  days_accrued: number | null;
  leave_balance: number | null;
  status: LeaveStatus;
  hod_id: string | null;
  hod_recommendation: "recommended" | "not_recommended" | null;
  hod_comment: string | null;
  hod_date: string | null;
  executive_director_id: string | null;
  approved_days: number | null;
  approver_id: string | null;
  approver_comment: string | null;
  approval_date: string | null;
  rejection_reason: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  application_date: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  employee?: {
    full_name: string;
    employee_number: string | null;
    department_id: string | null;
    position_id: string | null;
  };
  employee_profile?: {
    full_name: string;
    employee_number: string | null;
  };
  department?: { name: string } | null;
  position?: { title: string } | null;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  total_entitlement: number;
  days_taken: number;
  days_remaining: number;
  year: number;
  updated_at: string;
}

export interface LeaveSetting {
  id: string;
  leave_type: LeaveType;
  days_per_year: number;
  rate_per_month: number;
  requires_attachment: boolean;
  max_carry_over: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  study: "Study Leave",
  maternity: "Maternity Leave",
  paternity: "Paternity Leave",
  compassionate: "Compassionate Leave",
  unpaid: "Unpaid Leave",
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: "Pending",
  recommended: "Recommended",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const LEAVE_STATUS_COLORS: Record<LeaveStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  recommended: "bg-blue-100 text-blue-800 border-blue-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
};

// =============================================================================
// Annual Leave Management System Types (BRRA Form-Based)
// =============================================================================

export type AnnualLeaveStatus =
  | "draft"
  | "submitted"
  | "hod_recommended"
  | "hod_rejected"
  | "hr_certified"
  | "hr_rejected"
  | "approved"
  | "rejected"
  | "cancelled";

export type EmploymentStatusType = "established" | "probation" | "agreement";

export interface AnnualLeaveApplication {
  id: string;
  employee_id: string;
  user_id: string;
  surname: string;
  other_names: string;
  personnel_file_no: string | null;
  nrc_number: string | null;
  department: string;
  position: string;
  grade: string | null;
  annual_salary: number | null;
  last_leave_return_date: string | null;
  last_leave_commuted_date: string | null;
  last_travel_allowance_date: string | null;
  leave_days_applied: number;
  leave_start_date: string;
  days_commuted: number;
  total_days_deducted: number;
  leave_address: string;
  resume_date: string | null;
  employee_signature: boolean;
  application_date: string;
  status: AnnualLeaveStatus;
  leave_balance_before: number | null;
  leave_balance_after: number | null;
  created_at: string;
  updated_at: string;
  // Joined
  approval?: AnnualLeaveApproval | null;
}

export interface AnnualLeaveApproval {
  id: string;
  leave_id: string;
  hod_id: string | null;
  hod_recommendation: string | null;
  hod_correctness_certified: boolean;
  hod_employment_status: EmploymentStatusType | null;
  hod_designation: string | null;
  hod_comment: string | null;
  hod_signature: boolean;
  hod_date: string | null;
  hr_officer_id: string | null;
  hr_leave_days_brought_forward: number | null;
  hr_qualifying_service_from: string | null;
  hr_qualifying_service_to: string | null;
  hr_grade: string | null;
  hr_months_in_service: number | null;
  hr_leave_balance: number | null;
  hr_certified: boolean;
  hr_comment: string | null;
  hr_signature: boolean;
  hr_date: string | null;
  agency_head_id: string | null;
  agency_leave_granted_days: number | null;
  agency_leave_type: string | null;
  agency_resume_duty_date: string | null;
  agency_approved: boolean | null;
  agency_comment: string | null;
  agency_signature: boolean;
  agency_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnualLeaveLedger {
  id: string;
  employee_id: string;
  year: number;
  opening_balance: number;
  days_earned: number;
  days_taken: number;
  days_commuted: number;
  closing_balance: number;
  carry_forward_from_previous: number | null;
  last_updated_by: string | null;
  updated_at: string;
}

export const ANNUAL_LEAVE_STATUS_LABELS: Record<AnnualLeaveStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  hod_recommended: "HoD Recommended",
  hod_rejected: "HoD Rejected",
  hr_certified: "HR Certified",
  hr_rejected: "HR Rejected",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const ANNUAL_LEAVE_STATUS_COLORS: Record<AnnualLeaveStatus, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  submitted: "bg-yellow-100 text-yellow-800 border-yellow-200",
  hod_recommended: "bg-blue-100 text-blue-800 border-blue-200",
  hod_rejected: "bg-red-100 text-red-800 border-red-200",
  hr_certified: "bg-indigo-100 text-indigo-800 border-indigo-200",
  hr_rejected: "bg-red-100 text-red-800 border-red-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatusType, string> = {
  established: "Established",
  probation: "Probation",
  agreement: "Agreement",
};
