import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import StaffLayout from "@/components/layout/StaffLayout";
import { toast } from "sonner";
import {
  CalendarDays, CheckCircle2, XCircle, Clock, FileText, User,
  ChevronDown, ChevronUp, Shield, ClipboardCheck, ArrowLeft,
} from "lucide-react";
import {
  AnnualLeaveStatus,
  AnnualLeaveApplication,
  ANNUAL_LEAVE_STATUS_LABELS,
  ANNUAL_LEAVE_STATUS_COLORS,
  EMPLOYMENT_STATUS_LABELS,
  EmploymentStatusType,
} from "@/types/leave";
import { sendLeaveNotification } from "@/utils/sendLeaveNotification";

type ApprovalStage = "hod" | "hr" | "agency";

export default function AnnualLeaveApprovals() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/portal/login");
    if (user && user.role !== "staff" && user.role !== "admin") {
      navigate("/portal");
    }
  }, [user, loading, navigate]);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch all annual leave applications
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["annual_leave_all_applications", statusFilter],
    enabled: !!user,
    queryFn: async () => {
      let query = (supabase as any)
        .from("annual_leave_applications")
        .select("*, annual_leave_approvals(*)")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Determine which stage the user can act on
  const getUserApprovalStage = (): ApprovalStage | null => {
    if (!user) return null;
    // Admin can act at any stage; Staff acts as HoD or HR depending on context
    if (user.role === "admin") return "agency";
    if (user.role === "staff") return "hod"; // Staff default to HoD, HR handled via role assignment
    return null;
  };

  // HoD Recommendation mutation
  const hodMutation = useMutation({
    mutationFn: async ({
      leaveId,
      recommendation,
      employmentStatus,
      comment,
    }: {
      leaveId: string;
      recommendation: "recommended" | "not_recommended";
      employmentStatus: EmploymentStatusType;
      comment: string;
    }) => {
      // Create or update approval record
      const { data: existing } = await (supabase as any)
        .from("annual_leave_approvals")
        .select("id")
        .eq("leave_id", leaveId)
        .maybeSingle();

      if (existing) {
        const { error } = await (supabase as any)
          .from("annual_leave_approvals")
          .update({
            hod_id: user!.id,
            hod_recommendation: recommendation,
            hod_correctness_certified: true,
            hod_employment_status: employmentStatus,
            hod_comment: comment || null,
            hod_signature: true,
            hod_date: new Date().toISOString(),
          })
          .eq("leave_id", leaveId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("annual_leave_approvals")
          .insert({
            leave_id: leaveId,
            hod_id: user!.id,
            hod_recommendation: recommendation,
            hod_correctness_certified: true,
            hod_employment_status: employmentStatus,
            hod_comment: comment || null,
            hod_signature: true,
            hod_date: new Date().toISOString(),
          });
        if (error) throw error;
      }

      // Update application status
      const newStatus = recommendation === "recommended" ? "hod_recommended" : "hod_rejected";
      const { error: updateErr } = await (supabase as any)
        .from("annual_leave_applications")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", leaveId);
      if (updateErr) throw updateErr;

      // Send email notifications
      const app = applications.find((a: any) => a.id === leaveId);
      if (app) {
        const emailBase = {
          applicant_name: `${app.surname}, ${app.other_names}`,
          leave_type: "Annual Leave",
          start_date: app.leave_start_date,
          end_date: app.resume_date || app.leave_start_date,
          requested_days: app.leave_days_applied,
        };
        try {
          if (recommendation === "recommended") {
            // Notify applicant
            if (app.applicant_email) {
              await sendLeaveNotification({ ...emailBase, notification_type: "hod_recommended", reviewer_comment: comment, recipients: [{ name: `${app.surname}, ${app.other_names}`, email: app.applicant_email, role: "Applicant" }] });
            }
            // Notify HR officer
            if (app.hr_approver_email) {
              await sendLeaveNotification({ ...emailBase, notification_type: "submitted_approver", recipients: [{ name: app.hr_approver_name || "HR Officer", email: app.hr_approver_email, role: "HR Officer" }] });
            }
          } else {
            // Notify applicant: not recommended
            if (app.applicant_email) {
              await sendLeaveNotification({ ...emailBase, notification_type: "hod_not_recommended", reviewer_comment: comment, recipients: [{ name: `${app.surname}, ${app.other_names}`, email: app.applicant_email, role: "Applicant" }] });
            }
          }
        } catch { console.warn("Email notification could not be sent."); }
      }
    },
    onSuccess: () => {
      toast.success("HoD recommendation submitted");
      queryClient.invalidateQueries({ queryKey: ["annual_leave_all_applications"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // HR Certification mutation
  const hrMutation = useMutation({
    mutationFn: async ({
      leaveId,
      daysForward,
      serviceFrom,
      serviceTo,
      monthsInService,
      leaveBalance,
      comment,
      certified,
    }: {
      leaveId: string;
      daysForward: number;
      serviceFrom: string;
      serviceTo: string;
      monthsInService: number;
      leaveBalance: number;
      comment: string;
      certified: boolean;
    }) => {
      const { error } = await (supabase as any)
        .from("annual_leave_approvals")
        .update({
          hr_officer_id: user!.id,
          hr_leave_days_brought_forward: daysForward,
          hr_qualifying_service_from: serviceFrom || null,
          hr_qualifying_service_to: serviceTo || null,
          hr_months_in_service: monthsInService,
          hr_leave_balance: leaveBalance,
          hr_certified: certified,
          hr_comment: comment || null,
          hr_signature: true,
          hr_date: new Date().toISOString(),
        })
        .eq("leave_id", leaveId);
      if (error) throw error;

      const newStatus = certified ? "hr_certified" : "hr_rejected";
      const { error: updateErr } = await (supabase as any)
        .from("annual_leave_applications")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", leaveId);
      if (updateErr) throw updateErr;

      // Send email notifications
      const app = applications.find((a: any) => a.id === leaveId);
      if (app) {
        const emailBase = {
          applicant_name: `${app.surname}, ${app.other_names}`,
          leave_type: "Annual Leave",
          start_date: app.leave_start_date,
          end_date: app.resume_date || app.leave_start_date,
          requested_days: app.leave_days_applied,
        };
        try {
          if (certified) {
            // Notify applicant: HR certified, awaiting ED
            if (app.applicant_email) {
              await sendLeaveNotification({ ...emailBase, notification_type: "hod_recommended", reviewer_comment: comment, recipients: [{ name: `${app.surname}, ${app.other_names}`, email: app.applicant_email, role: "Applicant" }] });
            }
            // Notify Executive Director
            if (app.ed_approver_email) {
              await sendLeaveNotification({ ...emailBase, notification_type: "hod_recommended_ed", recipients: [{ name: app.ed_approver_name || "Executive Director", email: app.ed_approver_email, role: "Executive Director" }] });
            }
          } else {
            // Notify applicant: HR rejected
            if (app.applicant_email) {
              await sendLeaveNotification({ ...emailBase, notification_type: "rejected", reviewer_comment: comment, recipients: [{ name: `${app.surname}, ${app.other_names}`, email: app.applicant_email, role: "Applicant" }] });
            }
          }
        } catch { console.warn("Email notification could not be sent."); }
      }
    },
    onSuccess: () => {
      toast.success("HR certification submitted");
      queryClient.invalidateQueries({ queryKey: ["annual_leave_all_applications"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Agency Head Approval mutation
  const agencyMutation = useMutation({
    mutationFn: async ({
      leaveId,
      approved,
      grantedDays,
      resumeDate,
      comment,
    }: {
      leaveId: string;
      approved: boolean;
      grantedDays: number;
      resumeDate: string;
      comment: string;
    }) => {
      const { error } = await (supabase as any)
        .from("annual_leave_approvals")
        .update({
          agency_head_id: user!.id,
          agency_leave_granted_days: grantedDays,
          agency_leave_type: "Annual leave with pay",
          agency_resume_duty_date: resumeDate || null,
          agency_approved: approved,
          agency_comment: comment || null,
          agency_signature: true,
          agency_date: new Date().toISOString(),
        })
        .eq("leave_id", leaveId);
      if (error) throw error;

      const newStatus = approved ? "approved" : "rejected";
      const { error: updateErr } = await (supabase as any)
        .from("annual_leave_applications")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", leaveId);
      if (updateErr) throw updateErr;

      // Send email notifications
      const app = applications.find((a: any) => a.id === leaveId);
      if (app) {
        const emailBase = {
          applicant_name: `${app.surname}, ${app.other_names}`,
          leave_type: "Annual Leave",
          start_date: app.leave_start_date,
          end_date: app.resume_date || app.leave_start_date,
          requested_days: app.leave_days_applied,
        };
        try {
          if (app.applicant_email) {
            await sendLeaveNotification({
              ...emailBase,
              notification_type: approved ? "approved" : "rejected",
              reviewer_comment: comment,
              recipients: [{ name: `${app.surname}, ${app.other_names}`, email: app.applicant_email, role: "Applicant" }],
            });
          }
        } catch { console.warn("Email notification could not be sent."); }
      }
    },
    onSuccess: () => {
      toast.success("Final decision submitted");
      queryClient.invalidateQueries({ queryKey: ["annual_leave_all_applications"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!user) return null;

  return (
    <StaffLayout activeTab="annual-approvals">
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate("/portal/dashboard")}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 mb-2">Annual Leave Management</p>
          <h2 className="text-2xl font-bold text-gray-900">Annual Leave Approvals</h2>
          <p className="text-gray-600 mt-1">
            Review and process annual leave applications through the approval workflow.
          </p>
        </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Awaiting HoD</option>
              <option value="hod_recommended">Awaiting HR</option>
              <option value="hr_certified">Awaiting Agency Head</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="hod_rejected">HoD Rejected</option>
              <option value="hr_rejected">HR Rejected</option>
            </select>
            <span className="text-sm text-muted-foreground">
              {applications.length} application{applications.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Applications List */}
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading applications…</p>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 bg-noir-elevated border border-border rounded-sm">
              <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No annual leave applications found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app: any) => (
                <AnnualLeaveCard
                  key={app.id}
                  application={app}
                  expanded={expandedId === app.id}
                  onToggle={() => setExpandedId(expandedId === app.id ? null : app.id)}
                  userRole={user.role}
                  userId={user.id}
                  onHodSubmit={(data) => hodMutation.mutate({ leaveId: app.id, ...data })}
                  onHrSubmit={(data) => hrMutation.mutate({ leaveId: app.id, ...data })}
                  onAgencySubmit={(data) => agencyMutation.mutate({ leaveId: app.id, ...data })}
                />
              ))}
            </div>
          )}
      </div>
    </StaffLayout>
  );
}

// ==================== Application Card ====================
function AnnualLeaveCard({
  application,
  expanded,
  onToggle,
  userRole,
  userId,
  onHodSubmit,
  onHrSubmit,
  onAgencySubmit,
}: {
  application: any;
  expanded: boolean;
  onToggle: () => void;
  userRole: string;
  userId: string;
  onHodSubmit: (data: { recommendation: "recommended" | "not_recommended"; employmentStatus: EmploymentStatusType; comment: string }) => void;
  onHrSubmit: (data: { daysForward: number; serviceFrom: string; serviceTo: string; monthsInService: number; leaveBalance: number; comment: string; certified: boolean }) => void;
  onAgencySubmit: (data: { approved: boolean; grantedDays: number; resumeDate: string; comment: string }) => void;
}) {
  const approval = application.annual_leave_approvals?.[0] || null;
  const status = application.status as AnnualLeaveStatus;

  const getStageIcon = () => {
    switch (status) {
      case "submitted": return <Clock className="h-5 w-5 text-yellow-500" />;
      case "hod_recommended": return <ClipboardCheck className="h-5 w-5 text-blue-500" />;
      case "hr_certified": return <Shield className="h-5 w-5 text-indigo-500" />;
      case "approved": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "hod_rejected":
      case "hr_rejected":
      case "rejected": return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  // Determine if user can act (restricted to selected approvers)
  const canHodAct = (application.hod_approver_id === userId || userRole === "admin") && status === "submitted";
  const canHrAct = (application.hr_approver_id === userId || userRole === "admin") && status === "hod_recommended";
  const canAgencyAct = (application.ed_approver_id === userId || userRole === "admin") && status === "hr_certified";

  return (
    <div className="bg-noir-elevated border border-border rounded-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          {getStageIcon()}
          <div className="text-left">
            <p className="font-semibold">{application.surname}, {application.other_names}</p>
            <p className="text-xs text-muted-foreground">
              {application.department} • {application.position} • {application.leave_days_applied} days from{" "}
              {new Date(application.leave_start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 text-xs font-medium border rounded ${ANNUAL_LEAVE_STATUS_COLORS[status]}`}>
            {ANNUAL_LEAVE_STATUS_LABELS[status]}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border px-6 py-5 space-y-6">
          {/* Application Details Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DetailField label="Personnel File No." value={application.personnel_file_no || "—"} />
            <DetailField label="Grade" value={application.grade || "—"} />
            <DetailField label="Days Applied" value={`${application.leave_days_applied}`} />
            <DetailField label="Days Commuted" value={`${application.days_commuted}`} />
            <DetailField label="Total Deducted" value={`${application.total_days_deducted}`} highlight />
            <DetailField label="Start Date" value={application.leave_start_date} />
            <DetailField label="Resume Date" value={application.resume_date || "—"} />
            <DetailField label="Leave Address" value={application.leave_address} />
            <DetailField label="Balance Before" value={application.leave_balance_before?.toString() || "—"} />
            <DetailField label="Balance After" value={application.leave_balance_after?.toString() || "—"} />
            <DetailField label="Applied" value={new Date(application.application_date).toLocaleDateString("en-GB")} />
          </div>

          {/* Approval Trail */}
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-bold mb-3">Approval Trail</h4>
            <div className="grid sm:grid-cols-3 gap-4">
              {/* Part B - HoD */}
              <ApprovalStageCard
                title="Part B — HoD"
                status={
                  approval?.hod_recommendation === "recommended" ? "approved"
                  : approval?.hod_recommendation === "not_recommended" ? "rejected"
                  : status === "submitted" ? "pending" : "waiting"
                }
                details={approval?.hod_recommendation ? [
                  `${approval.hod_recommendation}`,
                  approval.hod_employment_status ? `Status: ${EMPLOYMENT_STATUS_LABELS[approval.hod_employment_status as EmploymentStatusType]}` : "",
                  approval.hod_comment || "",
                  approval.hod_date ? `Date: ${new Date(approval.hod_date).toLocaleDateString("en-GB")}` : "",
                ].filter(Boolean) : []}
              />
              {/* Part C - HR */}
              <ApprovalStageCard
                title="Part C — HR"
                status={
                  approval?.hr_certified ? "approved"
                  : status === "hr_rejected" ? "rejected"
                  : status === "hod_recommended" ? "pending" : "waiting"
                }
                details={approval?.hr_certified || status === "hr_rejected" ? [
                  `Balance: ${approval?.hr_leave_balance ?? "—"}`,
                  `Months: ${approval?.hr_months_in_service ?? "—"}`,
                  approval?.hr_comment || "",
                  approval?.hr_date ? `Date: ${new Date(approval.hr_date).toLocaleDateString("en-GB")}` : "",
                ].filter(Boolean) : []}
              />
              {/* Part D - Agency */}
              <ApprovalStageCard
                title="Part D — Agency Head"
                status={
                  approval?.agency_approved === true ? "approved"
                  : approval?.agency_approved === false ? "rejected"
                  : status === "hr_certified" ? "pending" : "waiting"
                }
                details={approval?.agency_approved !== null && approval?.agency_approved !== undefined ? [
                  `Days Granted: ${approval.agency_leave_granted_days ?? "—"}`,
                  `Resume: ${approval.agency_resume_duty_date || "—"}`,
                  approval.agency_comment || "",
                  approval?.agency_date ? `Date: ${new Date(approval.agency_date).toLocaleDateString("en-GB")}` : "",
                ].filter(Boolean) : []}
              />
            </div>
          </div>

          {/* Action Forms */}
          {canHodAct && (
            <HodActionForm onSubmit={onHodSubmit} />
          )}
          {canHrAct && (
            <HrActionForm application={application} onSubmit={onHrSubmit} />
          )}
          {canAgencyAct && (
            <AgencyActionForm application={application} onSubmit={onAgencySubmit} />
          )}
        </div>
      )}
    </div>
  );
}

// ==================== Approval Stage Card ====================
function ApprovalStageCard({ title, status, details }: { title: string; status: "approved" | "rejected" | "pending" | "waiting"; details: string[] }) {
  const statusColors = {
    approved: "border-green-200 bg-green-50",
    rejected: "border-red-200 bg-red-50",
    pending: "border-yellow-200 bg-yellow-50",
    waiting: "border-gray-200 bg-gray-50",
  };
  const statusLabels = { approved: "✓ Done", rejected: "✗ Rejected", pending: "Awaiting", waiting: "—" };

  return (
    <div className={`border rounded-sm p-3 ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold">{title}</p>
        <span className="text-[10px] font-mono">{statusLabels[status]}</span>
      </div>
      {details.length > 0 && (
        <ul className="space-y-0.5">
          {details.map((d, i) => (
            <li key={i} className="text-[11px] text-gray-600">{d}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ==================== HoD Action Form (Part B) ====================
function HodActionForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [recommendation, setRecommendation] = useState<"recommended" | "not_recommended">("recommended");
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatusType>("established");
  const [comment, setComment] = useState("");

  return (
    <div className="border-t border-border pt-4">
      <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-blue-500" />
        Part B — Head of Department Action
      </h4>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Recommendation *</label>
          <select
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value as any)}
            className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm"
          >
            <option value="recommended">Recommended</option>
            <option value="not_recommended">Not Recommended</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Employment Status *</label>
          <select
            value={employmentStatus}
            onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatusType)}
            className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm"
          >
            <option value="established">Established</option>
            <option value="probation">Probation</option>
            <option value="agreement">Agreement</option>
          </select>
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-xs text-muted-foreground mb-1">Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm resize-none"
          placeholder="Optional comment..."
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSubmit({ recommendation, employmentStatus, comment })}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-sm hover:bg-blue-700 transition-colors"
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Submit Recommendation
        </button>
      </div>
    </div>
  );
}

// ==================== HR Action Form (Part C) ====================
function HrActionForm({ application, onSubmit }: { application: any; onSubmit: (data: any) => void }) {
  const [daysForward, setDaysForward] = useState<number>(application.leave_balance_before || 0);
  const [serviceFrom, setServiceFrom] = useState(application.last_leave_return_date || "");
  const [serviceTo, setServiceTo] = useState(application.leave_start_date || "");
  const [monthsInService, setMonthsInService] = useState<number>(0);
  const [leaveBalance, setLeaveBalance] = useState<number>(application.leave_balance_before || 0);
  const [comment, setComment] = useState("");
  const [certified, setCertified] = useState(true);

  // Auto-calc months
  useEffect(() => {
    if (serviceFrom && serviceTo) {
      const from = new Date(serviceFrom);
      const to = new Date(serviceTo);
      const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
      setMonthsInService(Math.max(0, months));
    }
  }, [serviceFrom, serviceTo]);

  return (
    <div className="border-t border-border pt-4">
      <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-indigo-500" />
        Part C — Human Resource Officer Validation
      </h4>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Leave Days Brought Forward</label>
          <input
            type="number"
            value={daysForward}
            onChange={(e) => setDaysForward(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Qualifying Service From</label>
          <input
            type="date"
            value={serviceFrom}
            onChange={(e) => setServiceFrom(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Qualifying Service To</label>
          <input
            type="date"
            value={serviceTo}
            onChange={(e) => setServiceTo(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Months in Service</label>
          <input
            type="number"
            value={monthsInService}
            readOnly
            className="w-full px-3 py-2 bg-muted border border-border rounded-sm text-sm cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Leave Balance (Days)</label>
          <input
            type="number"
            value={leaveBalance}
            onChange={(e) => setLeaveBalance(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm"
          />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-xs text-muted-foreground mb-1">HR Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm resize-none"
          placeholder="Notes on verification..."
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onSubmit({ daysForward, serviceFrom, serviceTo, monthsInService, leaveBalance, comment, certified: true })}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-sm hover:bg-indigo-700 transition-colors"
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Certify & Approve
        </button>
        <button
          onClick={() => onSubmit({ daysForward, serviceFrom, serviceTo, monthsInService, leaveBalance, comment, certified: false })}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-sm hover:bg-red-700 transition-colors"
        >
          <XCircle className="h-3.5 w-3.5" /> Reject
        </button>
      </div>
    </div>
  );
}

// ==================== Agency Head Action Form (Part D) ====================
function AgencyActionForm({ application, onSubmit }: { application: any; onSubmit: (data: any) => void }) {
  const [grantedDays, setGrantedDays] = useState<number>(application.leave_days_applied || 0);
  const [resumeDate, setResumeDate] = useState(application.resume_date || "");
  const [comment, setComment] = useState("");

  return (
    <div className="border-t border-border pt-4">
      <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-green-600" />
        Part D — Head of Agency Final Approval
      </h4>
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Leave Granted (Days)</label>
          <input
            type="number"
            value={grantedDays}
            onChange={(e) => setGrantedDays(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Type</label>
          <input
            type="text"
            value="Annual leave with pay"
            readOnly
            className="w-full px-3 py-2 bg-muted border border-border rounded-sm text-sm cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Resume Duty Date</label>
          <input
            type="date"
            value={resumeDate}
            onChange={(e) => setResumeDate(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm"
          />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-xs text-muted-foreground mb-1">Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm resize-none"
          placeholder="Optional comment..."
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onSubmit({ approved: true, grantedDays, resumeDate, comment })}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-sm hover:bg-green-700 transition-colors"
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Approve Leave
        </button>
        <button
          onClick={() => onSubmit({ approved: false, grantedDays, resumeDate, comment })}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-sm hover:bg-red-700 transition-colors"
        >
          <XCircle className="h-3.5 w-3.5" /> Reject Leave
        </button>
      </div>
    </div>
  );
}

// ==================== Shared Components ====================
function DetailField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm ${highlight ? "font-bold text-primary" : ""}`}>{value}</p>
    </div>
  );
}
