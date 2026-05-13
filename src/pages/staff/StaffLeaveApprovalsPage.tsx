import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import StaffLayout from "@/components/layout/StaffLayout";
import { toast } from "sonner";
import {
  CheckCircle2, XCircle, Clock, MessageSquare, User, Calendar,
  FileText, ChevronDown, ChevronUp, ArrowLeft,
} from "lucide-react";
import {
  LeaveApplication,
  LeaveType,
  LeaveStatus,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_COLORS,
} from "@/types/leave";
import { sendLeaveNotification } from "@/utils/sendLeaveNotification";

export default function StaffLeaveApprovalsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/portal/login");
    else if (user.role !== "staff" && user.role !== "admin") navigate("/portal/dashboard");
  }, [user, loading, navigate]);

  const [filter, setFilter] = useState<LeaveStatus | "all">("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch all leave applications (staff/admin)
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["staff_leave_approvals", filter],
    enabled: !!user && user.role !== "user",
    queryFn: async () => {
      let query = (supabase as any)
        .from("leave_applications")
        .select(`
          *,
          employee:employee_id(full_name, employee_number, department_id, position_id, email),
          applicant_profile:profiles!user_id(full_name, email)
        `)
        .order("application_date", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (LeaveApplication & { employee: any })[];
    },
  });

  // Helper to build email base from application
  const buildEmailBase = (app: any) => ({
    applicant_name: app.employee?.full_name || "Staff Member",
    leave_type: LEAVE_TYPE_LABELS[app.leave_type as LeaveType] || app.leave_type,
    start_date: app.start_date,
    end_date: app.end_date,
    requested_days: app.requested_days,
  });

  // Recommend mutation (HoD)
  const recommendMutation = useMutation({
    mutationFn: async ({ id, recommendation, comment, app }: { id: string; recommendation: "recommended" | "not_recommended"; comment?: string; app: any }) => {
      const { error } = await (supabase as any)
        .from("leave_applications")
        .update({
          status: recommendation === "recommended" ? "recommended" : "pending",
          hod_id: user!.id,
          hod_recommendation: recommendation,
          hod_comment: comment || null,
          hod_date: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;

      // Send email notifications
      const emailBase = buildEmailBase(app);
      const applicantEmail = app.applicant_profile?.email || app.employee?.email;
      const applicantName = app.applicant_profile?.full_name || app.employee?.full_name;

      try {
        if (recommendation === "recommended") {
          // Notify applicant: recommended, awaiting ED
          if (applicantEmail) {
            await sendLeaveNotification({
              ...emailBase,
              notification_type: "hod_recommended",
              reviewer_comment: comment,
              recipients: [{ name: applicantName, email: applicantEmail, role: "Applicant" }],
            });
          }
          // Notify ED: application needs your approval
          if (app.ed_email) {
            await sendLeaveNotification({
              ...emailBase,
              notification_type: "hod_recommended_ed",
              recipients: [{ name: app.ed_name || "Executive Director", email: app.ed_email, role: "Executive Director" }],
            });
          }
        } else {
          // Notify applicant: not recommended
          if (applicantEmail) {
            await sendLeaveNotification({
              ...emailBase,
              notification_type: "hod_not_recommended",
              reviewer_comment: comment,
              recipients: [{ name: applicantName, email: applicantEmail, role: "Applicant" }],
            });
          }
        }
      } catch {
        console.warn("Email notification could not be sent.");
      }
    },
    onSuccess: () => {
      toast.success("Recommendation submitted");
      queryClient.invalidateQueries({ queryKey: ["staff_leave_approvals"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Approve mutation (Executive Director)
  const approveMutation = useMutation({
    mutationFn: async ({ id, days, comment, app }: { id: string; days: number; comment?: string; app: any }) => {
      const { error } = await (supabase as any)
        .from("leave_applications")
        .update({
          status: "approved",
          approved_days: days,
          approver_id: user!.id,
          approver_comment: comment || null,
          approval_date: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;

      // Notify applicant: approved
      const emailBase = buildEmailBase(app);
      const applicantEmail = app.applicant_profile?.email || app.employee?.email;
      const applicantName = app.applicant_profile?.full_name || app.employee?.full_name;

      try {
        if (applicantEmail) {
          await sendLeaveNotification({
            ...emailBase,
            notification_type: "approved",
            reviewer_comment: comment,
            recipients: [{ name: applicantName, email: applicantEmail, role: "Applicant" }],
          });
        }
      } catch {
        console.warn("Email notification could not be sent.");
      }
    },
    onSuccess: () => {
      toast.success("Leave application approved");
      queryClient.invalidateQueries({ queryKey: ["staff_leave_approvals"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason, app }: { id: string; reason: string; app: any }) => {
      if (!reason.trim()) throw new Error("Rejection reason is required");
      const { error } = await (supabase as any)
        .from("leave_applications")
        .update({
          status: "rejected",
          rejection_reason: reason,
          approver_id: user!.id,
          approval_date: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;

      // Notify applicant: rejected
      const emailBase = buildEmailBase(app);
      const applicantEmail = app.applicant_profile?.email || app.employee?.email;
      const applicantName = app.applicant_profile?.full_name || app.employee?.full_name;

      try {
        if (applicantEmail) {
          await sendLeaveNotification({
            ...emailBase,
            notification_type: "rejected",
            reviewer_comment: reason,
            recipients: [{ name: applicantName, email: applicantEmail, role: "Applicant" }],
          });
        }
      } catch {
        console.warn("Email notification could not be sent.");
      }
    },
    onSuccess: () => {
      toast.success("Leave application rejected");
      queryClient.invalidateQueries({ queryKey: ["staff_leave_approvals"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (loading) return null;
  if (!user || (user.role !== "staff" && user.role !== "admin")) return null;

  const stats = {
    pending: applications.filter((a) => a.status === "pending").length,
    recommended: applications.filter((a) => a.status === "recommended").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <StaffLayout activeTab="approvals">
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate("/portal/dashboard")}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Approvals</h2>
          <p className="text-gray-600 mt-1">Review, recommend and process staff leave applications.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {([
            { key: "pending" as const, label: "Pending", color: "text-yellow-600", bg: "bg-yellow-50", icon: Clock },
            { key: "recommended" as const, label: "Recommended", color: "text-blue-600", bg: "bg-blue-50", icon: FileText },
            { key: "approved" as const, label: "Approved", color: "text-green-600", bg: "bg-green-50", icon: CheckCircle2 },
            { key: "rejected" as const, label: "Rejected", color: "text-red-600", bg: "bg-red-50", icon: XCircle },
          ]).map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`text-left p-4 border rounded-lg transition-colors ${
                filter === s.key ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className={`p-1.5 ${s.bg} rounded-lg w-fit mb-2`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className={`text-xl font-bold ${s.color}`}>{stats[s.key]}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Filter:</span>
          {(["all", "pending", "recommended", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                filter === f
                  ? "border-amber-500 text-amber-700 bg-amber-50"
                  : "border-gray-200 text-gray-600 hover:border-amber-300"
              }`}
            >
              {f === "all" ? "All" : LEAVE_STATUS_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Applications */}
        {isLoading ? (
          <p className="text-center text-gray-500 py-12">Loading applications…</p>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No {filter !== "all" ? filter : ""} leave applications found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <ApprovalCard
                key={app.id}
                app={app}
                expanded={expandedId === app.id}
                onToggle={() => setExpandedId(expandedId === app.id ? null : app.id)}
                onRecommend={(rec, comment) => recommendMutation.mutate({ id: app.id, recommendation: rec, comment, app })}
                onApprove={(days, comment) => approveMutation.mutate({ id: app.id, days, comment, app })}
                onReject={(reason) => rejectMutation.mutate({ id: app.id, reason, app })}
                userRole={user.role}
                userId={user.id}
              />
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}

interface ApprovalCardProps {
  app: LeaveApplication & { employee: any };
  expanded: boolean;
  onToggle: () => void;
  onRecommend: (rec: "recommended" | "not_recommended", comment?: string) => void;
  onApprove: (days: number, comment?: string) => void;
  onReject: (reason: string) => void;
  userRole: string;
  userId: string;
}

function ApprovalCard({ app, expanded, onToggle, onRecommend, onApprove, onReject, userRole, userId }: ApprovalCardProps) {
  const [hodComment, setHodComment] = useState("");
  const [approvalDays, setApprovalDays] = useState(app.requested_days);
  const [approvalComment, setApprovalComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Summary */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <User className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{app.employee?.full_name || "Unknown"}</p>
            <p className="text-xs text-gray-500">
              {LEAVE_TYPE_LABELS[app.leave_type]} • {app.requested_days} days • {formatDate(app.start_date)} — {formatDate(app.end_date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${LEAVE_STATUS_COLORS[app.status]}`}>
            {LEAVE_STATUS_LABELS[app.status]}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-gray-200 p-5 space-y-5">
          {/* Details */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <DetailField label="Employee No." value={app.employee?.employee_number || "—"} />
            <DetailField label="Leave Type" value={LEAVE_TYPE_LABELS[app.leave_type]} />
            <DetailField label="Requested Days" value={String(app.requested_days)} />
            <DetailField label="Start Date" value={formatDate(app.start_date)} />
            <DetailField label="End Date" value={formatDate(app.end_date)} />
            <DetailField label="Applied On" value={formatDate(app.application_date)} />
            <DetailField label="Address During Leave" value={app.leave_address || "—"} />
            <DetailField label="Leave Balance" value={app.leave_balance !== null ? `${app.leave_balance} days` : "—"} />
            <DetailField label="Months Since Last Leave" value={app.months_since_last_leave !== null ? `${app.months_since_last_leave}` : "—"} />
          </div>

          {/* Existing HoD recommendation */}
          {app.hod_recommendation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-600 mb-1">HoD Recommendation</p>
              <p className="text-sm text-blue-800 font-semibold capitalize">{app.hod_recommendation.replace("_", " ")}</p>
              {app.hod_comment && <p className="text-sm text-blue-700 mt-1">{app.hod_comment}</p>}
            </div>
          )}

          {/* Action Section */}
          {(app.status === "pending" || app.status === "recommended") && (
            <div className="border-t border-gray-200 pt-5 space-y-4">
              <p className="text-xs font-mono uppercase tracking-wider text-amber-600 font-semibold">Part II — Approval Section</p>

              {/* H.o.D Recommendation (visible only to the selected H.o.D) */}
              {app.hod_id === userId && !app.hod_recommendation && app.status === "pending" && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">HoD Recommendation</h4>
                  <textarea
                    value={hodComment}
                    onChange={(e) => setHodComment(e.target.value)}
                    placeholder="Comment (optional)..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => onRecommend("recommended", hodComment)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Recommend
                    </button>
                    <button
                      onClick={() => onRecommend("not_recommended", hodComment)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Not Recommended
                    </button>
                  </div>
                </div>
              )}

              {/* Executive Director Approval (visible only after H.o.D recommends, to the selected ED or admin) */}
              {app.hod_recommendation === "recommended" && (app.executive_director_id === userId || userRole === "admin") && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Executive Director Approval</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Approved Days</label>
                      <input
                        type="number"
                        value={approvalDays}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Comment (optional)</label>
                      <input
                        type="text"
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                        placeholder="Any notes..."
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onApprove(approvalDays, approvalComment)}
                      className="inline-flex items-center gap-1.5 px-5 py-2 bg-green-600 text-white font-semibold text-xs rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </button>
                    <button
                      onClick={() => setShowRejectForm(!showRejectForm)}
                      className="inline-flex items-center gap-1.5 px-5 py-2 bg-red-600 text-white font-semibold text-xs rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>

                  {showRejectForm && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3 mt-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-red-600" />
                        <label className="text-xs font-semibold text-red-800">Rejection Reason (required)</label>
                      </div>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm resize-none focus:outline-none focus:border-red-400"
                        placeholder="Provide a reason for rejection..."
                      />
                      <button
                        onClick={() => {
                          if (!rejectionReason.trim()) {
                            toast.error("Rejection reason is required");
                            return;
                          }
                          onReject(rejectionReason);
                        }}
                        className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Rejection reason display */}
          {app.status === "rejected" && app.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-600 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-800">{app.rejection_reason}</p>
            </div>
          )}

          {/* Approval display */}
          {app.status === "approved" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-600 mb-1">Approved</p>
              <p className="text-sm text-green-800">
                {app.approved_days} days approved on {formatDate(app.approval_date || "")}
              </p>
              {app.approver_comment && <p className="text-sm text-green-700 mt-1">{app.approver_comment}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
