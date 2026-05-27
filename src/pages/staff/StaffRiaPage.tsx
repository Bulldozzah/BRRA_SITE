import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import StaffLayout from "@/components/layout/StaffLayout";
import { toast } from "sonner";
import { sendRiaNotification } from "@/utils/sendRiaNotification";
import {
  FileText, Search, CheckCircle2, Clock, Circle, XCircle,
  UserPlus, ArrowRight, X, Eye, History, User, ArrowLeft,
  Download, Upload,
} from "lucide-react";
import {
  RiaSubmission,
  RiaStageHistory,
  RiaSubmissionRequest,
  RIA_STATUS_LABELS,
  RIA_STATUS_COLORS,
  RIA_STAGES,
  RIA_SECTORS,
  RiaStatus,
} from "@/types/ria";

export default function StaffRiaPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/portal/login");
    else if (user.role !== "staff" && user.role !== "admin") navigate("/portal/dashboard");
  }, [user, loading, navigate]);

  if (loading || !user || (user.role !== "staff" && user.role !== "admin")) return null;

  return (
    <StaffLayout activeTab="ria">
      <RiaManagementContent userId={user.id} userName={user.name || ""} />
    </StaffLayout>
  );
}

// =============================================================================
// SLA Utility
// =============================================================================
function getDaysInfo(createdAt: string) {
  const submitted = new Date(createdAt);
  const now = new Date();
  const daysElapsed = Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 14 - daysElapsed);
  return { daysElapsed, daysRemaining };
}

function getDaysUrgencyClass(daysRemaining: number) {
  if (daysRemaining === 0) return "bg-red-100 text-red-700 border-red-200";
  if (daysRemaining <= 3) return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

// =============================================================================
// Main Content
// =============================================================================
function RiaManagementContent({ userId, userName }: { userId: string; userName: string }) {
  const queryClient = useQueryClient();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RiaStatus | "all">("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modals
  const [selectedSubmission, setSelectedSubmission] = useState<RiaSubmission | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [submissionToAssign, setSubmissionToAssign] = useState<RiaSubmission | null>(null);

  // Submission requests
  const [submissionRequests, setSubmissionRequests] = useState<RiaSubmissionRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // Data for modals
  const [stageHistory, setStageHistory] = useState<RiaStageHistory[]>([]);
  const [staffList, setStaffList] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  // Fetch all submissions
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["staff_ria_submissions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ria_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as RiaSubmission[];
    },
  });

  // Fetch submission requests
  useEffect(() => {
    (async () => {
      setLoadingRequests(true);
      const { data } = await (supabase as any)
        .from("ria_submission_requests")
        .select("*")
        .order("created_at", { ascending: false });
      setSubmissionRequests((data || []) as RiaSubmissionRequest[]);
      setLoadingRequests(false);
    })();
  }, []);

  const refreshRequests = async () => {
    const { data } = await (supabase as any)
      .from("ria_submission_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setSubmissionRequests((data || []) as RiaSubmissionRequest[]);
  };

  const pendingRequests = submissionRequests.filter(r => r.status === "pending");

  const handleApproveRequest = async (reqId: string) => {
    const req = submissionRequests.find(r => r.id === reqId);
    try {
      const { error } = await (supabase as any)
        .from("ria_submission_requests")
        .update({
          status: "approved",
          reviewed_by: userId,
          reviewed_by_name: userName,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reqId);
      if (error) throw error;

      // Send approval email to user
      if (req) {
        await sendRiaNotification({
          notification_type: "request_approved",
          ria_title: req.title,
          organization: req.organization,
          reviewer_name: userName,
          requester_name: req.user_name,
          recipients: [{ name: req.user_name, email: req.user_email, role: "Requester" }],
        });
      }

      toast.success("Request approved. The user can now submit their RIA.");
      refreshRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve request.");
    }
  };

  const handleRejectRequest = async (reqId: string) => {
    const req = submissionRequests.find(r => r.id === reqId);
    try {
      const { error } = await (supabase as any)
        .from("ria_submission_requests")
        .update({
          status: "rejected",
          reviewed_by: userId,
          reviewed_by_name: userName,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason || null,
        })
        .eq("id", reqId);
      if (error) throw error;

      // Send rejection email to user
      if (req) {
        await sendRiaNotification({
          notification_type: "request_rejected",
          ria_title: req.title,
          organization: req.organization,
          reviewer_name: userName,
          requester_name: req.user_name,
          rejection_reason: rejectionReason || undefined,
          recipients: [{ name: req.user_name, email: req.user_email, role: "Requester" }],
        });
      }

      toast.success("Request rejected.");
      setRejectingId(null);
      setRejectionReason("");
      refreshRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject request.");
    }
  };

  // Multi-filter logic
  const filtered = submissions.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (sectorFilter !== "all" && s.sector !== sectorFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !s.title.toLowerCase().includes(q) &&
        !s.tracking_number.toLowerCase().includes(q) &&
        !s.organization.toLowerCase().includes(q) &&
        !s.submitter_name.toLowerCase().includes(q)
      ) return false;
    }
    if (dateFrom || dateTo) {
      const submittedDate = new Date(s.created_at);
      if (dateFrom && submittedDate < new Date(dateFrom)) return false;
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (submittedDate > toDate) return false;
      }
    }
    return true;
  });

  const hasFilters = search || statusFilter !== "all" || sectorFilter !== "all" || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch(""); setStatusFilter("all"); setSectorFilter("all");
    setDateFrom(""); setDateTo("");
  };

  const stats = {
    total: submissions.length,
    submitted: submissions.filter(s => s.status === "submitted").length,
    inReview: submissions.filter(s => s.status === "in_review").length,
    completed: submissions.filter(s => s.status === "completed").length,
  };

  const refreshData = () => queryClient.invalidateQueries({ queryKey: ["staff_ria_submissions"] });

  // Open detail modal
  const openDetailModal = async (sub: RiaSubmission) => {
    setSelectedSubmission(sub);
    setShowDetailModal(true);
    const { data } = await (supabase as any)
      .from("ria_stage_history")
      .select("*")
      .eq("submission_id", sub.id)
      .order("created_at", { ascending: true });
    setStageHistory(data || []);
  };

  // Open assign modal
  const openAssignModal = async (sub: RiaSubmission) => {
    setSubmissionToAssign(sub);
    setSelectedStaffId("");
    setShowAssignModal(true);
    // Fetch staff list
    const { data } = await (supabase as any)
      .from("profiles")
      .select("id, full_name, email")
      .in("role", ["staff", "admin"])
      .order("full_name");
    setStaffList((data || []).map((p: any) => ({ id: p.id, full_name: p.full_name || p.email, email: p.email })));
  };

  // Open stage history modal
  const openHistoryModal = async (sub: RiaSubmission) => {
    setSelectedSubmission(sub);
    const { data } = await (supabase as any)
      .from("ria_stage_history")
      .select("*")
      .eq("submission_id", sub.id)
      .order("created_at", { ascending: true });
    setStageHistory(data || []);
    setShowHistoryModal(true);
  };

  // Assign to self
  const handleAssignToMe = async (sub: RiaSubmission) => {
    try {
      const { error } = await (supabase as any)
        .from("ria_submissions")
        .update({
          assigned_officer_id: userId,
          assigned_officer_name: userName,
          assigned_at: new Date().toISOString(),
          status: "in_review",
          current_stage: 2,
          stage_name: "Officer Assigned",
          progress_percentage: 13,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", sub.id);
      if (error) throw error;

      await (supabase as any).from("ria_stage_history").insert({
        submission_id: sub.id,
        stage_number: 2,
        stage_name: "Officer Assigned",
        notes: `Assigned to ${userName}`,
        acted_by: userId,
        acted_by_name: userName,
      });

      toast.success(`Assigned to you (${userName})`);
      refreshData();
      setShowDetailModal(false);
    } catch (err: any) {
      toast.error(err.message || "Assignment failed.");
    }
  };

  // Assign to another user
  const handleAssignToUser = async () => {
    if (!submissionToAssign || !selectedStaffId) return;
    const selectedStaff = staffList.find(s => s.id === selectedStaffId);
    if (!selectedStaff) return;

    try {
      const { error } = await (supabase as any)
        .from("ria_submissions")
        .update({
          assigned_officer_id: selectedStaffId,
          assigned_officer_name: selectedStaff.full_name,
          assigned_at: new Date().toISOString(),
          status: "in_review",
          current_stage: Math.max(submissionToAssign.current_stage, 2),
          stage_name: submissionToAssign.current_stage >= 2 ? submissionToAssign.stage_name : "Officer Assigned",
          progress_percentage: submissionToAssign.current_stage >= 2 ? submissionToAssign.progress_percentage : 13,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", submissionToAssign.id);
      if (error) throw error;

      await (supabase as any).from("ria_stage_history").insert({
        submission_id: submissionToAssign.id,
        stage_number: 2,
        stage_name: "Officer Assigned",
        notes: `Assigned to ${selectedStaff.full_name} by ${userName}`,
        acted_by: userId,
        acted_by_name: userName,
      });

      toast.success(`Assigned to ${selectedStaff.full_name}`);
      setShowAssignModal(false);
      refreshData();
    } catch (err: any) {
      toast.error(err.message || "Assignment failed.");
    }
  };

  // Update stage (clickable grid)
  const handleUpdateStage = async (sub: RiaSubmission, newStage: number) => {
    if (sub.assigned_officer_id !== userId) {
      toast.error("Access Denied: Only the assigned officer can update the stage.");
      return;
    }
    if (sub.status === "completed" || sub.status === "rejected") return;

    const stageDef = RIA_STAGES.find(s => s.number === newStage);
    if (!stageDef) return;

    const updateData: any = {
      current_stage: newStage,
      stage_name: stageDef.name,
      progress_percentage: stageDef.progress,
      status: "in_review" as RiaStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStage === 15) {
      updateData.status = "completed";
      updateData.completed_at = new Date().toISOString();
    }

    try {
      const { error } = await (supabase as any)
        .from("ria_submissions")
        .update(updateData)
        .eq("id", sub.id);
      if (error) throw error;

      await (supabase as any).from("ria_stage_history").insert({
        submission_id: sub.id,
        stage_number: newStage,
        stage_name: stageDef.name,
        notes: newStage === 15 ? "RIA process completed and archived." : null,
        acted_by: userId,
        acted_by_name: userName,
      });

      toast.success(`Updated to Stage ${newStage}: ${stageDef.name}`);
      // Optimistic update
      setSelectedSubmission(prev => prev?.id === sub.id ? { ...prev, ...updateData } : prev);
      refreshData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update stage.");
    }
  };

  // Save impact notes (onBlur)
  const handleSaveNotes = async (subId: string, field: string, value: string) => {
    try {
      await (supabase as any)
        .from("ria_submissions")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", subId);
    } catch {
      toast.error("Failed to save notes.");
    }
  };

  // Reject
  const handleReject = async (sub: RiaSubmission) => {
    if (!confirm("Are you sure you want to reject this submission?")) return;
    try {
      const { error } = await (supabase as any)
        .from("ria_submissions")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", sub.id);
      if (error) throw error;

      await (supabase as any).from("ria_stage_history").insert({
        submission_id: sub.id,
        stage_number: sub.current_stage,
        stage_name: "Rejected",
        notes: "Submission rejected.",
        acted_by: userId,
        acted_by_name: userName,
      });

      toast.success("Submission rejected.");
      setShowDetailModal(false);
      refreshData();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject.");
    }
  };

  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/portal/dashboard")}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      {/* Header & Stats */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">RIA Management</h2>
          <p className="text-gray-600 mt-1">Review, assign, and advance submissions through the 15-stage pipeline.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
            <span className="text-blue-700 font-semibold">{stats.submitted}</span>
            <span className="text-blue-600 ml-1">new</span>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5">
            <span className="text-yellow-700 font-semibold">{stats.inReview}</span>
            <span className="text-yellow-600 ml-1">in review</span>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
            <span className="text-green-700 font-semibold">{stats.completed}</span>
            <span className="text-green-600 ml-1">completed</span>
          </div>
        </div>
      </div>

      {/* All Submission Requests — RIA Numbers, Username, Email, Date */}
      {!loadingRequests && submissionRequests.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-gray-800">
                Submission Requests
                {pendingRequests.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded-full font-semibold">{pendingRequests.length} pending</span>
                )}
              </h3>
            </div>
            <span className="text-xs text-gray-400">{submissionRequests.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-2.5 font-medium">RIA Number(s)</th>
                  <th className="px-4 py-2.5 font-medium">User</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Title</th>
                  <th className="px-4 py-2.5 font-medium">Organization</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissionRequests.map(req => {
                  // Find RIA submissions by this user
                  const userSubmissions = submissions.filter(s => s.user_id === req.user_id);
                  const statusBadge = {
                    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
                    approved: "bg-green-100 text-green-700 border-green-200",
                    rejected: "bg-red-100 text-red-700 border-red-200",
                  };
                  const statusLabel = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
                  return (
                    <tr key={req.id} className={`hover:bg-gray-50 ${req.status === "pending" ? "bg-amber-50/40" : ""}`}>
                      <td className="px-4 py-3">
                        {userSubmissions.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {userSubmissions.map(s => (
                              <span key={s.id} className="font-mono text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded inline-block">
                                {s.tracking_number}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No submissions yet</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 text-xs">{req.user_name}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{req.user_email}</td>
                      <td className="px-4 py-3 text-xs text-gray-800 max-w-[200px] truncate" title={req.title}>{req.title}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{req.organization}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(req.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${statusBadge[req.status]}`}>
                          {statusLabel[req.status]}
                        </span>
                        {req.reviewed_by_name && (
                          <p className="text-[10px] text-gray-400 mt-0.5">by {req.reviewed_by_name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {req.status === "pending" ? (
                          rejectingId === req.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                placeholder="Reason"
                                className="px-2 py-1 text-xs border border-gray-200 rounded w-28 focus:outline-none focus:border-red-400"
                              />
                              <button onClick={() => handleRejectRequest(req.id)} className="px-2 py-1 text-[10px] font-medium bg-red-600 text-white rounded hover:bg-red-700">
                                OK
                              </button>
                              <button onClick={() => { setRejectingId(null); setRejectionReason(""); }} className="px-1 py-1 text-[10px] text-gray-400 hover:text-gray-600">
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleApproveRequest(req.id)} className="px-2.5 py-1 text-[10px] font-medium bg-green-600 text-white rounded hover:bg-green-700">
                                Approve
                              </button>
                              <button onClick={() => setRejectingId(req.id)} className="px-2.5 py-1 text-[10px] font-medium bg-red-50 text-red-600 rounded hover:bg-red-100">
                                Reject
                              </button>
                            </div>
                          )
                        ) : req.rejection_reason ? (
                          <span className="text-[10px] text-red-500 italic" title={req.rejection_reason}>
                            {req.rejection_reason.length > 20 ? req.rejection_reason.slice(0, 20) + "…" : req.rejection_reason}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Title, tracking #, organization, name..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400">
              <option value="all">All ({stats.total})</option>
              <option value="submitted">Submitted ({stats.submitted})</option>
              <option value="in_review">In Review ({stats.inReview})</option>
              <option value="completed">Completed ({stats.completed})</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sector</label>
            <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400">
              <option value="all">All Sectors</option>
              {RIA_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="px-3 py-2 text-xs text-red-600 hover:text-red-800 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              Clear
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">{filtered.length} of {submissions.length} submissions</p>
      </div>

      {/* Submissions list */}
      {isLoading ? (
        <p className="text-center text-gray-500 py-12">Loading submissions…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No RIA submissions found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(sub => {
            const { daysElapsed, daysRemaining } = getDaysInfo(sub.created_at);
            const urgencyClass = sub.status === "completed" || sub.status === "rejected"
              ? "bg-gray-100 text-gray-600 border-gray-200"
              : getDaysUrgencyClass(daysRemaining);

            return (
              <div
                key={sub.id}
                className={`bg-white border rounded-lg overflow-hidden ${
                  sub.status === "completed" ? "border-green-200" : sub.status === "rejected" ? "border-red-200" : "border-gray-200"
                }`}
              >
                <div className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-mono text-xs text-amber-700 font-semibold">{sub.tracking_number}</span>
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded border ${RIA_STATUS_COLORS[sub.status]}`}>
                        {RIA_STATUS_LABELS[sub.status]}
                      </span>
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded border ${urgencyClass}`}>
                        Day {daysElapsed}/14 ({daysRemaining} left)
                      </span>
                      <span className="text-[10px] text-gray-400">Stage {sub.current_stage}/15</span>
                    </div>
                    <p className="font-medium text-sm text-gray-900 truncate">{sub.title}</p>
                    <p className="text-xs text-gray-500">
                      {sub.organization} · {sub.submitter_name} · {sub.sector}
                      {sub.assigned_officer_name && <span className="ml-2 text-amber-700">→ {sub.assigned_officer_name}</span>}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full">
                      <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${sub.progress_percentage}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 text-center mt-0.5">{sub.progress_percentage}%</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openDetailModal(sub)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="View Details">
                      <Eye className="h-4 w-4 text-gray-500" />
                    </button>
                    <button onClick={() => openAssignModal(sub)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Assign">
                      <UserPlus className="h-4 w-4 text-gray-500" />
                    </button>
                    <button onClick={() => openHistoryModal(sub)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Stage History">
                      <History className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail/Manage Modal */}
      {showDetailModal && selectedSubmission && (
        <DetailModal
          submission={selectedSubmission}
          stageHistory={stageHistory}
          userId={userId}
          userName={userName}
          onClose={() => setShowDetailModal(false)}
          onUpdateStage={handleUpdateStage}
          onAssignToMe={handleAssignToMe}
          onSaveNotes={handleSaveNotes}
          onReject={handleReject}
          onOpenAssign={() => { setShowDetailModal(false); openAssignModal(selectedSubmission); }}
          onOpenHistory={() => { setShowDetailModal(false); openHistoryModal(selectedSubmission); }}
          onDocumentUpdated={async (updated) => {
            setSelectedSubmission(updated);
            refreshData();
            const { data } = await (supabase as any)
              .from("ria_stage_history")
              .select("*")
              .eq("submission_id", updated.id)
              .order("created_at", { ascending: true });
            setStageHistory(data || []);
          }}
        />
      )}

      {/* Assign Modal */}
      {showAssignModal && submissionToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAssignModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Assign to Staff</h3>
              <button onClick={() => setShowAssignModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <div className="mb-4 text-sm text-gray-600">
              <p><span className="font-medium">Submission:</span> {submissionToAssign.tracking_number}</p>
              <p><span className="font-medium">Title:</span> {submissionToAssign.title}</p>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Select Staff Member *</label>
              <select
                value={selectedStaffId}
                onChange={e => setSelectedStaffId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
              >
                <option value="">— Select —</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleAssignToUser}
                disabled={!selectedStaffId}
                className="px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage History Modal */}
      {showHistoryModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Stage History</h3>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-4">{selectedSubmission.tracking_number} — {selectedSubmission.title}</p>
            {stageHistory.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No stage history recorded.</p>
            ) : (
              <div className="space-y-3">
                {stageHistory.map((h, idx) => {
                  const next = stageHistory[idx + 1];
                  const durationMs = next
                    ? new Date(next.created_at).getTime() - new Date(h.created_at).getTime()
                    : Date.now() - new Date(h.created_at).getTime();
                  const durationDays = Math.floor(durationMs / 86400000);
                  const durationClass = durationDays === 0 ? "bg-blue-100 text-blue-700" :
                    durationDays <= 2 ? "bg-green-100 text-green-700" :
                    durationDays <= 5 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
                  const durationLabel = durationDays === 0 ? "Today" : `${durationDays}d`;

                  return (
                    <div key={h.id} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-800">Stage {h.stage_number}: {h.stage_name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${durationClass}`}>{durationLabel}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {h.acted_by_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{h.acted_by_name}</span>}
                        <span>{formatDate(h.created_at)}</span>
                      </div>
                      {h.notes && <p className="text-xs text-gray-600 mt-1">{h.notes}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Detail/Manage Modal
// =============================================================================
function DetailModal({ submission, stageHistory, userId, userName, onClose, onUpdateStage, onAssignToMe, onSaveNotes, onReject, onOpenAssign, onOpenHistory, onDocumentUpdated }: {
  submission: RiaSubmission;
  stageHistory: RiaStageHistory[];
  userId: string;
  userName: string;
  onClose: () => void;
  onUpdateStage: (sub: RiaSubmission, stage: number) => void;
  onAssignToMe: (sub: RiaSubmission) => void;
  onSaveNotes: (id: string, field: string, value: string) => void;
  onReject: (sub: RiaSubmission) => void;
  onOpenAssign: () => void;
  onOpenHistory: () => void;
  onDocumentUpdated: (updated: RiaSubmission) => void;
}) {
  const { daysElapsed, daysRemaining } = getDaysInfo(submission.created_at);
  const urgencyClass = submission.status === "completed" || submission.status === "rejected"
    ? "bg-gray-100 text-gray-600"
    : getDaysUrgencyClass(daysRemaining);
  const isAssignedOfficer = submission.assigned_officer_id === userId;
  const isActive = submission.status !== "completed" && submission.status !== "rejected";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm text-amber-700 font-bold">{submission.tracking_number}</span>
            <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${RIA_STATUS_COLORS[submission.status]}`}>
              {RIA_STATUS_LABELS[submission.status]}
            </span>
            <span className="text-xs text-gray-500">Stage {submission.current_stage}/15</span>
            <span className={`px-2 py-0.5 text-[10px] rounded ${urgencyClass}`}>
              Day {daysElapsed}/14
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Title & Assignment */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{submission.title}</h3>
            {submission.assigned_officer_name ? (
              <p className="text-sm text-gray-600">Assigned to: <span className="font-medium text-amber-700">{submission.assigned_officer_name}</span></p>
            ) : (
              <p className="text-sm text-gray-400 italic">Not yet assigned</p>
            )}
          </div>

          {/* Info grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Detail label="Submitter" value={submission.submitter_name} />
            <Detail label="Email" value={submission.submitter_email} />
            <Detail label="Phone" value={submission.submitter_phone || "—"} />
            <Detail label="Organization" value={submission.organization} />
            <Detail label="Sector" value={submission.sector} />
            <Detail label="Regulation Type" value={submission.regulation_type.replace(/_/g, " ")} />
            <Detail label="Submitted" value={formatDate(submission.created_at)} />
            {submission.assigned_at && <Detail label="Assigned" value={formatDate(submission.assigned_at)} />}
            {submission.completed_at && <Detail label="Completed" value={formatDate(submission.completed_at)} />}
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Description</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{submission.description}</p>
          </div>

          {/* Document — download current + upload replacement */}
          <DocumentSection
            submission={submission}
            userId={userId}
            userName={userName}
            canUpload={isAssignedOfficer && isActive}
            onDocumentUpdated={onDocumentUpdated}
          />

          {/* Buttons row */}
          {isActive && (
            <div className="flex flex-wrap gap-2">
              {!submission.assigned_officer_id && (
                <button onClick={() => onAssignToMe(submission)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600">
                  <User className="h-3.5 w-3.5" /> Assign to Me
                </button>
              )}
              <button onClick={onOpenAssign} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50">
                <UserPlus className="h-3.5 w-3.5" /> Assign to User
              </button>
              <button onClick={onOpenHistory} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50">
                <History className="h-3.5 w-3.5" /> View History
              </button>
              <button onClick={() => onReject(submission)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 border border-red-200 rounded-lg hover:bg-red-50 ml-auto">
                <XCircle className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          )}

          {/* Stage Grid */}
          {isActive && isAssignedOfficer && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Update Stage</p>
              <div className="grid grid-cols-5 gap-1.5">
                {RIA_STAGES.map(stage => {
                  const isCurrent = submission.current_stage === stage.number;
                  const isDone = submission.current_stage > stage.number;
                  return (
                    <button
                      key={stage.number}
                      onClick={() => onUpdateStage(submission, stage.number)}
                      disabled={submission.status === "completed"}
                      className={`px-2 py-2 rounded-lg text-[10px] font-medium text-center transition-colors ${
                        isCurrent ? "bg-blue-600 text-white ring-2 ring-blue-300" :
                        isDone ? "bg-green-100 text-green-700 hover:bg-green-200" :
                        "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      title={stage.name}
                    >
                      <div className="font-bold text-xs">{stage.number}</div>
                      <div className="truncate leading-tight mt-0.5">{stage.name.split(" ")[0]}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Impact Notes (onBlur auto-save, only if assigned officer) */}
          {isActive && isAssignedOfficer && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">Analysis Notes</p>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Review Notes</label>
                <textarea
                  defaultValue={submission.review_notes || ""}
                  onBlur={e => onSaveNotes(submission.id, "review_notes", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 resize-none"
                  placeholder="General review notes..."
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Economic Impact</label>
                  <textarea
                    defaultValue={submission.economic_impact || ""}
                    onBlur={e => onSaveNotes(submission.id, "economic_impact", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 resize-none"
                    placeholder="Economic impact assessment..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Social Impact</label>
                  <textarea
                    defaultValue={submission.social_impact || ""}
                    onBlur={e => onSaveNotes(submission.id, "social_impact", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 resize-none"
                    placeholder="Social impact assessment..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Environmental Impact</label>
                  <textarea
                    defaultValue={submission.environmental_impact || ""}
                    onBlur={e => onSaveNotes(submission.id, "environmental_impact", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 resize-none"
                    placeholder="Environmental impact assessment..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Final Report (only visible at stage >= 11) */}
          {isAssignedOfficer && submission.current_stage >= 11 && (
            <FinalReportSection submission={submission} onSaveNotes={onSaveNotes} />
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Final Report Section
// =============================================================================
function FinalReportSection({ submission, onSaveNotes }: { submission: RiaSubmission; onSaveNotes: (id: string, field: string, value: string) => void }) {
  const [filename, setFilename] = useState(submission.final_report_path || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!filename.trim()) return;
    setSaving(true);
    try {
      await (supabase as any)
        .from("ria_submissions")
        .update({ final_report_path: filename.trim(), updated_at: new Date().toISOString() })
        .eq("id", submission.id);
      toast.success("Final report path saved.");
    } catch {
      toast.error("Failed to save report path.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-gray-100 pt-4">
      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Final Report</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={filename}
          onChange={e => setFilename(e.target.value)}
          placeholder="Enter report filename or path..."
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
        />
        <button
          onClick={handleSave}
          disabled={saving || !filename.trim()}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Report"}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Document Section — download current document + upload a replacement
// The uploaded file becomes the latest document at the current stage.
// =============================================================================
function DocumentSection({ submission, userId, userName, canUpload, onDocumentUpdated }: {
  submission: RiaSubmission;
  userId: string;
  userName: string;
  canUpload: boolean;
  onDocumentUpdated: (updated: RiaSubmission) => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = async () => {
    if (!submission.document_path) return;
    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from("ria-documents")
        .download(submission.document_path);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = submission.document_filename || "ria-document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || "Failed to download document.");
    } finally {
      setDownloading(false);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const stageNum = submission.current_stage;
      const timestamp = Date.now();
      // Versioned path so storage history is preserved; submission row points to latest
      const newPath = `${submission.tracking_number}/stage-${stageNum}-${timestamp}-${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("ria-documents")
        .upload(newPath, file, { upsert: false });
      if (uploadError) throw new Error("Upload failed: " + uploadError.message);

      const { data: updated, error: updateError } = await (supabase as any)
        .from("ria_submissions")
        .update({
          document_filename: file.name,
          document_path: newPath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", submission.id)
        .select()
        .single();
      if (updateError) throw updateError;

      // Log the document replacement in stage history (at current stage)
      await (supabase as any).from("ria_stage_history").insert({
        submission_id: submission.id,
        stage_number: stageNum,
        stage_name: submission.stage_name,
        notes: `Document updated at Stage ${stageNum}: ${file.name}`,
        acted_by: userId,
        acted_by_name: userName,
      });

      toast.success("Document uploaded. It is now the latest at this stage.");
      onDocumentUpdated(updated as RiaSubmission);
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const hasDocument = !!submission.document_path;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileText className="h-4 w-4 text-amber-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase">Document</p>
            {hasDocument ? (
              <p className="text-sm text-gray-800 font-medium truncate" title={submission.document_filename || ""}>
                {submission.document_filename}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">No document attached</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasDocument && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {downloading ? "Downloading…" : "Download"}
            </button>
          )}
          {canUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={handleUploadClick}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
                title={hasDocument ? "Replace document with a new one" : "Upload document"}
              >
                <Upload className="h-3.5 w-3.5" />
                {uploading ? "Uploading…" : hasDocument ? "Replace" : "Upload"}
              </button>
            </>
          )}
        </div>
      </div>
      {canUpload && hasDocument && (
        <p className="text-[10px] text-gray-400 mt-2">
          Uploading a new file replaces the current document. The previous file is kept in storage for audit purposes.
        </p>
      )}
    </div>
  );
}

// =============================================================================
// Shared
// =============================================================================
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase">{label}</p>
      <p className="text-sm text-gray-800 font-medium capitalize">{value}</p>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
