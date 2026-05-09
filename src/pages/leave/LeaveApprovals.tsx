import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import PageLayout from "@/components/layout/PageLayout";
import { toast } from "sonner";
import {
  CheckCircle2, XCircle, Clock, MessageSquare, User, Calendar,
  FileText, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  LeaveApplication,
  LeaveType,
  LeaveStatus,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_COLORS,
} from "@/types/leave";

export default function LeaveApprovals() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/portal/login");
    else if (user.role === "user") navigate("/portal/leave");
  }, [user, loading, navigate]);

  const [filter, setFilter] = useState<LeaveStatus | "all">("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch all leave applications (staff/admin only)
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["all_leave_applications", filter],
    enabled: !!user && user.role !== "user",
    queryFn: async () => {
      let query = (supabase as any)
        .from("leave_applications")
        .select(`
          *,
          employee:employee_id(full_name, employee_number, department_id, position_id)
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

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, days, comment }: { id: string; days: number; comment?: string }) => {
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
    },
    onSuccess: () => {
      toast.success("Leave application approved");
      queryClient.invalidateQueries({ queryKey: ["all_leave_applications"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
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
    },
    onSuccess: () => {
      toast.success("Leave application rejected");
      queryClient.invalidateQueries({ queryKey: ["all_leave_applications"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Recommend mutation (HoD)
  const recommendMutation = useMutation({
    mutationFn: async ({ id, recommendation, comment }: { id: string; recommendation: "recommended" | "not_recommended"; comment?: string }) => {
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
    },
    onSuccess: () => {
      toast.success("Recommendation submitted");
      queryClient.invalidateQueries({ queryKey: ["all_leave_applications"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!user || user.role === "user") return null;

  const stats = {
    pending: applications.filter((a) => a.status === "pending").length,
    recommended: applications.filter((a) => a.status === "recommended").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <PageLayout>
      <section className="container-wide py-16">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3">Leave Management</p>
          <h1 className="font-display text-4xl font-bold mb-2">Leave Approvals</h1>
          <p className="text-muted-foreground">Review and process staff leave applications.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <button onClick={() => setFilter("pending")} className={`text-left p-4 border rounded-sm transition-colors ${filter === "pending" ? "border-primary bg-primary/5" : "border-border bg-noir-elevated"}`}>
            <Clock className="h-5 w-5 text-yellow-600 mb-2" />
            <p className="text-xl font-bold">{stats.pending}</p>
            <p className="text-xs font-mono uppercase text-muted-foreground">Pending</p>
          </button>
          <button onClick={() => setFilter("recommended")} className={`text-left p-4 border rounded-sm transition-colors ${filter === "recommended" ? "border-primary bg-primary/5" : "border-border bg-noir-elevated"}`}>
            <FileText className="h-5 w-5 text-blue-600 mb-2" />
            <p className="text-xl font-bold">{stats.recommended}</p>
            <p className="text-xs font-mono uppercase text-muted-foreground">Recommended</p>
          </button>
          <button onClick={() => setFilter("approved")} className={`text-left p-4 border rounded-sm transition-colors ${filter === "approved" ? "border-primary bg-primary/5" : "border-border bg-noir-elevated"}`}>
            <CheckCircle2 className="h-5 w-5 text-green-600 mb-2" />
            <p className="text-xl font-bold">{stats.approved}</p>
            <p className="text-xs font-mono uppercase text-muted-foreground">Approved</p>
          </button>
          <button onClick={() => setFilter("rejected")} className={`text-left p-4 border rounded-sm transition-colors ${filter === "rejected" ? "border-primary bg-primary/5" : "border-border bg-noir-elevated"}`}>
            <XCircle className="h-5 w-5 text-red-600 mb-2" />
            <p className="text-xl font-bold">{stats.rejected}</p>
            <p className="text-xs font-mono uppercase text-muted-foreground">Rejected</p>
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs font-mono uppercase text-muted-foreground">Filter:</span>
          {(["all", "pending", "recommended", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-mono uppercase rounded-sm border transition-colors ${
                filter === f ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-12">Loading applications…</p>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 bg-noir-elevated border border-border rounded-sm">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No {filter !== "all" ? filter : ""} leave applications found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <LeaveCard
                key={app.id}
                application={app}
                expanded={expandedId === app.id}
                onToggle={() => setExpandedId(expandedId === app.id ? null : app.id)}
                onApprove={(days, comment) => approveMutation.mutate({ id: app.id, days, comment })}
                onReject={(reason) => rejectMutation.mutate({ id: app.id, reason })}
                onRecommend={(rec, comment) => recommendMutation.mutate({ id: app.id, recommendation: rec, comment })}
                userRole={user.role}
              />
            ))}
          </div>
        )}
      </section>
    </PageLayout>
  );
}

interface LeaveCardProps {
  application: LeaveApplication & { employee: any };
  expanded: boolean;
  onToggle: () => void;
  onApprove: (days: number, comment?: string) => void;
  onReject: (reason: string) => void;
  onRecommend: (rec: "recommended" | "not_recommended", comment?: string) => void;
  userRole: string;
}

function LeaveCard({ application: app, expanded, onToggle, onApprove, onReject, onRecommend, userRole }: LeaveCardProps) {
  const [approvalDays, setApprovalDays] = useState(app.requested_days);
  const [approvalComment, setApprovalComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [hodComment, setHodComment] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  return (
    <div className="bg-noir-elevated border border-border rounded-sm overflow-hidden">
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{app.employee?.full_name || "Unknown"}</p>
            <p className="text-xs text-muted-foreground">
              {LEAVE_TYPE_LABELS[app.leave_type]} • {app.requested_days} days • {formatDate(app.start_date)} — {formatDate(app.end_date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 text-xs font-mono rounded-sm border ${LEAVE_STATUS_COLORS[app.status]}`}>
            {LEAVE_STATUS_LABELS[app.status]}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border p-5 space-y-5">
          {/* Application details */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <DetailField label="Employee No." value={app.employee?.employee_number || "—"} />
            <DetailField label="Leave Type" value={LEAVE_TYPE_LABELS[app.leave_type]} />
            <DetailField label="Requested Days" value={String(app.requested_days)} />
            <DetailField label="Start Date" value={formatDate(app.start_date)} />
            <DetailField label="End Date" value={formatDate(app.end_date)} />
            <DetailField label="Applied On" value={formatDate(app.application_date)} />
            <DetailField label="Address During Leave" value={app.leave_address || "—"} />
            <DetailField label="Leave Balance (at application)" value={app.leave_balance !== null ? `${app.leave_balance} days` : "—"} />
            <DetailField label="Months Since Last Leave" value={app.months_since_last_leave !== null ? `${app.months_since_last_leave}` : "—"} />
          </div>

          {/* HoD recommendation (if exists) */}
          {app.hod_recommendation && (
            <div className="bg-blue-50 border border-blue-200 rounded-sm p-3">
              <p className="text-xs font-mono uppercase text-blue-600 mb-1">HoD Recommendation</p>
              <p className="text-sm text-blue-800 font-semibold capitalize">{app.hod_recommendation.replace("_", " ")}</p>
              {app.hod_comment && <p className="text-sm text-blue-700 mt-1">{app.hod_comment}</p>}
            </div>
          )}

          {/* Action buttons (only for pending/recommended) */}
          {(app.status === "pending" || app.status === "recommended") && (
            <div className="border-t border-border pt-5 space-y-4">
              <p className="text-xs font-mono uppercase tracking-wider text-primary">Part II — Approval Section</p>

              {/* HoD Recommendation (if staff role and not yet recommended) */}
              {userRole === "staff" && !app.hod_recommendation && app.status === "pending" && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">HoD Recommendation</h4>
                  <textarea
                    value={hodComment}
                    onChange={(e) => setHodComment(e.target.value)}
                    placeholder="Comment (optional)..."
                    rows={2}
                    className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => onRecommend("recommended", hodComment)}
                      className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors"
                    >
                      Recommend
                    </button>
                    <button
                      onClick={() => onRecommend("not_recommended", hodComment)}
                      className="px-4 py-2 text-xs font-semibold bg-orange-600 text-white rounded-sm hover:bg-orange-700 transition-colors"
                    >
                      Not Recommended
                    </button>
                  </div>
                </div>
              )}

              {/* ED/Admin Approval */}
              {userRole === "admin" && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Executive Director Approval</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Approved Days</label>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={approvalDays}
                        onChange={(e) => setApprovalDays(parseInt(e.target.value) || app.requested_days)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Comment (optional)</label>
                      <input
                        type="text"
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm"
                        placeholder="Any notes..."
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onApprove(approvalDays, approvalComment)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-semibold text-xs rounded-sm hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </button>
                    <button
                      onClick={() => setShowRejectForm(!showRejectForm)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-semibold text-xs rounded-sm hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>

                  {/* Rejection form */}
                  {showRejectForm && (
                    <div className="bg-red-50 border border-red-200 rounded-sm p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-red-600" />
                        <label className="text-xs font-semibold text-red-800">Rejection Reason (required)</label>
                      </div>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-red-200 rounded-sm text-sm resize-none"
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
                        className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-sm hover:bg-red-700"
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
            <div className="bg-red-50 border border-red-200 rounded-sm p-3">
              <p className="text-xs font-mono uppercase text-red-600 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-800">{app.rejection_reason}</p>
            </div>
          )}

          {/* Approval info display */}
          {app.status === "approved" && (
            <div className="bg-green-50 border border-green-200 rounded-sm p-3">
              <p className="text-xs font-mono uppercase text-green-600 mb-1">Approved</p>
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
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
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
