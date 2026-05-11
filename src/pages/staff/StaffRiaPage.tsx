import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import StaffLayout from "@/components/layout/StaffLayout";
import { toast } from "sonner";
import {
  FileText, Search, ChevronDown, ChevronUp, CheckCircle2, Clock,
  Circle, XCircle, UserPlus, ArrowRight, Filter,
} from "lucide-react";
import {
  RiaSubmission,
  RiaStageHistory,
  RIA_STATUS_LABELS,
  RIA_STATUS_COLORS,
  RIA_STAGES,
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
      <RiaManagementContent userId={user.id} />
    </StaffLayout>
  );
}

function RiaManagementContent({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RiaStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const filtered = submissions.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !s.title.toLowerCase().includes(q) &&
        !s.tracking_number.toLowerCase().includes(q) &&
        !s.organization.toLowerCase().includes(q) &&
        !s.submitter_name.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const stats = {
    total: submissions.length,
    submitted: submissions.filter(s => s.status === "submitted").length,
    inReview: submissions.filter(s => s.status === "in_review").length,
    completed: submissions.filter(s => s.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">RIA Management</h2>
          <p className="text-gray-600 mt-1">Review, assign, and advance RIA submissions through the pipeline.</p>
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

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Title, tracking number, organization..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as RiaStatus | "all")}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
          >
            <option value="all">All ({stats.total})</option>
            <option value="submitted">Submitted ({stats.submitted})</option>
            <option value="in_review">In Review ({stats.inReview})</option>
            <option value="completed">Completed ({stats.completed})</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      {isLoading ? (
        <p className="text-center text-gray-500 py-12">Loading submissions…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No RIA submissions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(sub => (
            <StaffSubmissionCard
              key={sub.id}
              submission={sub}
              expanded={expandedId === sub.id}
              onToggle={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
              userId={userId}
              onUpdate={() => queryClient.invalidateQueries({ queryKey: ["staff_ria_submissions"] })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StaffSubmissionCard({ submission, expanded, onToggle, userId, onUpdate }: {
  submission: RiaSubmission;
  expanded: boolean;
  onToggle: () => void;
  userId: string;
  onUpdate: () => void;
}) {
  const [stageHistory, setStageHistory] = useState<RiaStageHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [advanceNotes, setAdvanceNotes] = useState("");
  const [advancing, setAdvancing] = useState(false);

  const loadHistory = async () => {
    if (stageHistory.length > 0) return;
    setLoadingHistory(true);
    const { data } = await (supabase as any)
      .from("ria_stage_history")
      .select("*")
      .eq("submission_id", submission.id)
      .order("created_at", { ascending: true });
    setStageHistory(data || []);
    setLoadingHistory(false);
  };

  const handleToggle = () => {
    if (!expanded) loadHistory();
    onToggle();
  };

  const advanceStage = async () => {
    if (submission.current_stage >= 15) return;
    setAdvancing(true);

    try {
      const nextStage = submission.current_stage + 1;
      const nextStageDef = RIA_STAGES.find(s => s.number === nextStage);
      const newStatus: RiaStatus = nextStage >= 15 ? "completed" : "in_review";
      const progress = Math.round(((nextStage - 1) / 14) * 100);

      // Update submission
      const { error } = await (supabase as any)
        .from("ria_submissions")
        .update({
          current_stage: nextStage,
          stage_name: nextStageDef?.name || `Stage ${nextStage}`,
          progress_percentage: progress,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", submission.id);
      if (error) throw error;

      // Insert stage history
      await (supabase as any)
        .from("ria_stage_history")
        .insert({
          submission_id: submission.id,
          stage_number: nextStage,
          stage_name: nextStageDef?.name || `Stage ${nextStage}`,
          notes: advanceNotes || null,
          acted_by: userId,
        });

      toast.success(`Advanced to Stage ${nextStage}: ${nextStageDef?.name}`);
      setAdvanceNotes("");
      setStageHistory([]);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || "Failed to advance stage.");
    } finally {
      setAdvancing(false);
    }
  };

  const rejectSubmission = async () => {
    if (!confirm("Are you sure you want to reject this submission?")) return;
    try {
      const { error } = await (supabase as any)
        .from("ria_submissions")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", submission.id);
      if (error) throw error;

      await (supabase as any)
        .from("ria_stage_history")
        .insert({
          submission_id: submission.id,
          stage_number: submission.current_stage,
          stage_name: "Rejected",
          notes: advanceNotes || "Submission rejected.",
          acted_by: userId,
        });

      toast.success("Submission rejected.");
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject.");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-amber-700 font-semibold">{submission.tracking_number}</span>
              <span className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded border ${RIA_STATUS_COLORS[submission.status]}`}>
                {RIA_STATUS_LABELS[submission.status]}
              </span>
              <span className="text-[10px] text-gray-400">Stage {submission.current_stage}/15</span>
            </div>
            <p className="font-medium text-sm text-gray-900 truncate">{submission.title}</p>
            <p className="text-xs text-gray-500">{submission.organization} · {submission.submitter_name} · {submission.sector}</p>
          </div>
          <div className="hidden sm:block text-right">
            <div className="w-20 h-1.5 bg-gray-100 rounded-full">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${submission.progress_percentage}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{submission.progress_percentage}%</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400 ml-3" /> : <ChevronDown className="h-4 w-4 text-gray-400 ml-3" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-5">
          {/* Details */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <Detail label="Submitter" value={submission.submitter_name} />
            <Detail label="Email" value={submission.submitter_email} />
            <Detail label="Phone" value={submission.submitter_phone || "—"} />
            <Detail label="Organization" value={submission.organization} />
            <Detail label="Sector" value={submission.sector} />
            <Detail label="Regulation Type" value={submission.regulation_type.replace("_", " ")} />
            <Detail label="Submitted" value={formatDate(submission.created_at)} />
            <Detail label="Current Stage" value={submission.stage_name} />
            {submission.assigned_officer_name && <Detail label="Assigned To" value={submission.assigned_officer_name} />}
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Description</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{submission.description}</p>
          </div>

          {/* Document */}
          {submission.document_filename && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{submission.document_filename}</span>
            </div>
          )}

          {/* Timeline */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Stage History</p>
            {loadingHistory ? (
              <p className="text-xs text-gray-400">Loading…</p>
            ) : stageHistory.length === 0 ? (
              <p className="text-xs text-gray-400">No stage history yet.</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {stageHistory.map(h => (
                  <div key={h.id} className="flex items-start gap-2 text-xs py-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-700">Stage {h.stage_number}: {h.stage_name}</span>
                      {h.notes && <span className="text-gray-500 ml-1">— {h.notes}</span>}
                      <span className="text-gray-400 ml-2">{formatDate(h.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {submission.status !== "completed" && submission.status !== "rejected" && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">Actions</p>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={advanceNotes}
                    onChange={e => setAdvanceNotes(e.target.value)}
                    placeholder="Notes for this stage (optional)..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  onClick={advanceStage}
                  disabled={advancing || submission.current_stage >= 15}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  {advancing ? "Advancing…" : `Advance to Stage ${submission.current_stage + 1}`}
                </button>
                <button
                  onClick={rejectSubmission}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
