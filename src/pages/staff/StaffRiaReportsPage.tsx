import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import StaffLayout from "@/components/layout/StaffLayout";
import {
  Search, FileText, AlertTriangle, Clock, Users, Flame,
  History, Zap, BarChart3, Download, ArrowLeft, CheckCircle2,
  XCircle, User, X,
} from "lucide-react";
import {
  RiaSubmission,
  RiaStageHistory,
  RiaComment,
  RIA_STATUS_LABELS,
  RIA_STATUS_COLORS,
  RIA_STAGES,
  RIA_SECTORS,
  RiaStatus,
} from "@/types/ria";

// =============================================================================
// Page wrapper
// =============================================================================
export default function StaffRiaReportsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/portal/login");
    else if (user.role !== "staff" && user.role !== "admin") navigate("/portal/dashboard");
  }, [user, loading, navigate]);

  if (loading || !user || (user.role !== "staff" && user.role !== "admin")) return null;

  return (
    <StaffLayout activeTab="ria-reports">
      <ReportsContent navigate={navigate} />
    </StaffLayout>
  );
}

// =============================================================================
// Utility: SLA
// =============================================================================
const calculateDaysElapsed = (d: string) =>
  Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

const calculateDaysRemaining = (d: string) =>
  Math.max(0, 14 - calculateDaysElapsed(d));

const isOverdue = (d: string, status: string) =>
  status !== "completed" && calculateDaysElapsed(d) > 14;

// =============================================================================
// Utility: CSV export
// =============================================================================
function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;
  const header = Object.keys(data[0]).join(",");
  const csv = data.map(row =>
    Object.values(row).map(v => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",")
  ).join("\n");
  const blob = new Blob([header + "\n" + csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

// =============================================================================
// Report definitions
// =============================================================================
const REPORTS = [
  { id: "live-status",      name: "Live RIA Status",  icon: BarChart3,     color: "blue"   },
  { id: "overdue",          name: "Overdue RIAs",      icon: AlertTriangle, color: "red"    },
  { id: "stage-duration",   name: "Stage Duration",    icon: Clock,         color: "purple" },
  { id: "stuck-stage",      name: "Stuck-in-Stage",    icon: XCircle,       color: "orange" },
  { id: "officer-workload", name: "Officer Workload",  icon: Users,         color: "green"  },
  { id: "bottleneck",       name: "Bottleneck Heatmap",icon: Flame,         color: "yellow" },
  { id: "audit",            name: "Audit Trail",       icon: History,       color: "indigo" },
  { id: "turnaround",       name: "Turnaround Time",   icon: Zap,           color: "teal"   },
] as const;

type ReportId = (typeof REPORTS)[number]["id"];

// Tab color map — safe Tailwind classes (no dynamic string interpolation)
const TAB_ACTIVE: Record<string, string> = {
  blue:   "bg-blue-100 border-blue-500 text-blue-700",
  red:    "bg-red-100 border-red-500 text-red-700",
  purple: "bg-purple-100 border-purple-500 text-purple-700",
  orange: "bg-orange-100 border-orange-500 text-orange-700",
  green:  "bg-green-100 border-green-500 text-green-700",
  yellow: "bg-yellow-100 border-yellow-500 text-yellow-700",
  indigo: "bg-indigo-100 border-indigo-500 text-indigo-700",
  teal:   "bg-teal-100 border-teal-500 text-teal-700",
};

// =============================================================================
// Main content
// =============================================================================
function ReportsContent({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const [activeReport, setActiveReport] = useState<ReportId>("live-status");
  const [loadingData, setLoadingData] = useState(true);
  const [submissions, setSubmissions] = useState<RiaSubmission[]>([]);
  const [stageHistory, setStageHistory] = useState<RiaStageHistory[]>([]);
  const [staffList, setStaffList] = useState<{ user_id: string; full_name: string; email: string }[]>([]);
  const [comments, setComments] = useState<RiaComment[]>([]);

  // Global filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<RiaStatus | "all">("all");
  const [filterSector, setFilterSector] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Parallel 4-table fetch
  useEffect(() => {
    (async () => {
      setLoadingData(true);
      const [subRes, histRes, staffRes, comRes] = await Promise.all([
        (supabase as any).from("ria_submissions").select("*").order("created_at", { ascending: false }),
        (supabase as any).from("ria_stage_history").select("*").order("created_at", { ascending: true }),
        (supabase as any).from("profiles").select("id, full_name, email").in("role", ["staff", "admin"]).order("full_name"),
        (supabase as any).from("ria_comments").select("*").order("created_at", { ascending: true }),
      ]);
      if (subRes.data) setSubmissions(subRes.data);
      if (histRes.data) setStageHistory(histRes.data);
      if (staffRes.data) setStaffList(staffRes.data.map((p: any) => ({ user_id: p.id, full_name: p.full_name || p.email, email: p.email })));
      if (comRes.data) setComments(comRes.data);
      setLoadingData(false);
    })();
  }, []);

  // Filtered submissions (shared by all reports)
  const filteredSubmissions = submissions.filter(s => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (filterSector !== "all" && s.sector !== filterSector) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !s.title.toLowerCase().includes(q) &&
        !s.tracking_number.toLowerCase().includes(q) &&
        !s.organization.toLowerCase().includes(q) &&
        !s.submitter_name.toLowerCase().includes(q)
      ) return false;
    }
    if (filterDateFrom || filterDateTo) {
      const d = new Date(s.created_at);
      if (filterDateFrom && d < new Date(filterDateFrom)) return false;
      if (filterDateTo) { const to = new Date(filterDateTo); to.setHours(23, 59, 59, 999); if (d > to) return false; }
    }
    return true;
  });

  const hasFilters = searchQuery || filterStatus !== "all" || filterSector !== "all" || filterDateFrom || filterDateTo;
  const clearFilters = () => { setSearchQuery(""); setFilterStatus("all"); setFilterSector("all"); setFilterDateFrom(""); setFilterDateTo(""); };

  // Stage history helpers (closures over stageHistory)
  const getStageEntryDate = (submissionId: string, stageNumber: number) => {
    const entry = stageHistory.find(h => h.submission_id === submissionId && h.stage_number === stageNumber);
    return entry?.created_at;
  };

  const getDaysInCurrentStage = (s: RiaSubmission) => {
    const entryDate = getStageEntryDate(s.id, s.current_stage);
    if (!entryDate) return 0;
    return Math.floor((Date.now() - new Date(entryDate).getTime()) / 86400000);
  };

  // ===== REPORT 1: Live Status ==============================================
  const LiveStatusReport = () => {
    const onTrack = filteredSubmissions.filter(s => s.status !== "completed" && !isOverdue(s.created_at, s.status)).length;
    const overdue = filteredSubmissions.filter(s => isOverdue(s.created_at, s.status)).length;
    const completed = filteredSubmissions.filter(s => s.status === "completed").length;

    const csvData = filteredSubmissions.map(s => ({
      tracking_number: s.tracking_number, title: s.title,
      stage: `${s.current_stage}/15`, status: s.status,
      days_elapsed: calculateDaysElapsed(s.created_at),
      days_remaining: calculateDaysRemaining(s.created_at),
      assigned_to: s.assigned_officer_name || "Unassigned",
    }));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Live RIA Status</h3>
          <button onClick={() => exportToCSV(csvData, "live_status.csv")} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg"><Download className="h-3.5 w-3.5" />Export CSV</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total RIAs" value={filteredSubmissions.length} color="blue" />
          <StatCard label="On Track" value={onTrack} color="green" />
          <StatCard label="Overdue" value={overdue} color="red" />
          <StatCard label="Completed" value={completed} color="emerald" />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
              <th className="px-4 py-3 text-left">Tracking #</th><th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-center">Stage</th><th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Days</th><th className="px-4 py-3 text-center">SLA</th>
              <th className="px-4 py-3 text-left">Assigned</th><th className="px-4 py-3 text-center">Progress</th>
            </tr></thead>
            <tbody>{filteredSubmissions.map(s => {
              const od = isOverdue(s.created_at, s.status);
              return (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-amber-700">{s.tracking_number}</td>
                  <td className="px-4 py-2.5 max-w-[200px] truncate">{s.title}</td>
                  <td className="px-4 py-2.5 text-center text-xs">{s.current_stage}/15</td>
                  <td className="px-4 py-2.5 text-center"><span className={`px-2 py-0.5 text-[10px] rounded border ${RIA_STATUS_COLORS[s.status]}`}>{RIA_STATUS_LABELS[s.status]}</span></td>
                  <td className="px-4 py-2.5 text-center text-xs">{calculateDaysElapsed(s.created_at)}</td>
                  <td className="px-4 py-2.5 text-center"><span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${od ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{od ? "OVERDUE" : "On Track"}</span></td>
                  <td className="px-4 py-2.5 text-xs">{s.assigned_officer_name || <span className="text-gray-400 italic">Unassigned</span>}</td>
                  <td className="px-4 py-2.5"><div className="w-20 mx-auto"><div className="bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${s.progress_percentage}%` }} /></div><p className="text-[10px] text-gray-400 text-center mt-0.5">{s.progress_percentage}%</p></div></td>
                </tr>
              );
            })}</tbody>
          </table>
          {filteredSubmissions.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No submissions match the filters.</p>}
        </div>
      </div>
    );
  };

  // ===== REPORT 2: Overdue RIAs =============================================
  const OverdueReport = () => {
    const overdueRIAs = filteredSubmissions.filter(s => isOverdue(s.created_at, s.status));
    const csvData = overdueRIAs.map(s => ({
      tracking_number: s.tracking_number, title: s.title,
      days_overdue: calculateDaysElapsed(s.created_at) - 14,
      stage: `${s.current_stage}/15`,
      assigned_to: s.assigned_officer_name || "Unassigned",
    }));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Overdue RIAs</h3>
          <button onClick={() => exportToCSV(csvData, "overdue_rias.csv")} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg"><Download className="h-3.5 w-3.5" />Export CSV</button>
        </div>
        {overdueRIAs.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
            <p className="text-green-700 font-medium">No overdue RIAs! All submissions are on track.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left">Tracking #</th><th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-center">Days Overdue</th><th className="px-4 py-3 text-center">Severity</th>
                <th className="px-4 py-3 text-center">Stage</th><th className="px-4 py-3 text-left">Assigned</th>
              </tr></thead>
              <tbody>{overdueRIAs.map(s => {
                const daysOverdue = calculateDaysElapsed(s.created_at) - 14;
                const sev = daysOverdue > 7 ? "bg-red-600 text-white" : daysOverdue > 3 ? "bg-red-500 text-white" : "bg-red-400 text-white";
                return (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-amber-700">{s.tracking_number}</td>
                    <td className="px-4 py-2.5 max-w-[200px] truncate">{s.title}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-red-700">+{daysOverdue}d</td>
                    <td className="px-4 py-2.5 text-center"><span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${sev}`}>{daysOverdue > 7 ? "Critical" : daysOverdue > 3 ? "High" : "Medium"}</span></td>
                    <td className="px-4 py-2.5 text-center text-xs">{s.current_stage}/15</td>
                    <td className="px-4 py-2.5 text-xs">{s.assigned_officer_name || <span className="text-gray-400 italic">Unassigned</span>}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ===== REPORT 3: Stage Duration ============================================
  const StageDurationReport = () => {
    const stageStats = RIA_STAGES.map(stage => {
      const entries = stageHistory.filter(h => h.stage_number === stage.number);
      const durations: number[] = [];

      entries.forEach(entry => {
        const nextEntry = stageHistory.find(h =>
          h.submission_id === entry.submission_id && h.stage_number === stage.number + 1
        );
        const sub = submissions.find(s => s.id === entry.submission_id);
        const endDate = nextEntry
          ? new Date(nextEntry.created_at)
          : sub && sub.current_stage === stage.number ? new Date() : null;
        if (endDate) {
          durations.push(Math.floor((endDate.getTime() - new Date(entry.created_at).getTime()) / 86400000));
        }
      });

      const avg = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      const min = durations.length > 0 ? Math.min(...durations) : 0;
      const max = durations.length > 0 ? Math.max(...durations) : 0;
      const expectedDays = 1; // baseline expected per stage
      const exceeding = durations.filter(d => d > expectedDays).length;
      const pctExceeding = durations.length > 0 ? (exceeding / durations.length) * 100 : 0;

      return { ...stage, avg: +avg.toFixed(1), min, max, total: durations.length, pctExceeding: +pctExceeding.toFixed(0), expectedDays };
    });

    const csvData = stageStats.map(s => ({
      stage: s.number, name: s.name, expected: s.expectedDays,
      avg_duration: s.avg, min: s.min, max: s.max,
      total_rias: s.total, pct_exceeding: s.pctExceeding,
    }));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Stage Duration Analysis</h3>
          <button onClick={() => exportToCSV(csvData, "stage_duration.csv")} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg"><Download className="h-3.5 w-3.5" />Export CSV</button>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
              <th className="px-4 py-3 text-left">Stage</th><th className="px-4 py-3 text-center">Expected</th>
              <th className="px-4 py-3 text-center">Avg Duration</th><th className="px-4 py-3 text-center">Min / Max</th>
              <th className="px-4 py-3 text-center">Total RIAs</th><th className="px-4 py-3 text-center">% Exceeding</th>
            </tr></thead>
            <tbody>{stageStats.map(s => {
              const variance = s.avg - s.expectedDays;
              const avgColor = variance > 0 ? "text-red-600 font-semibold" : "text-green-600";
              const pctColor = s.pctExceeding > 50 ? "bg-red-100 text-red-700" : s.pctExceeding > 25 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700";
              return (
                <tr key={s.number} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2.5"><span className="font-medium">Stage {s.number}:</span> {s.name}</td>
                  <td className="px-4 py-2.5 text-center text-xs">{s.expectedDays}d</td>
                  <td className="px-4 py-2.5 text-center"><span className={avgColor}>{s.avg}d</span>{variance > 0 && <span className="text-[10px] text-red-500 ml-1">(+{variance.toFixed(1)})</span>}</td>
                  <td className="px-4 py-2.5 text-center text-xs">{s.min}d / {s.max}d</td>
                  <td className="px-4 py-2.5 text-center text-xs">{s.total}</td>
                  <td className="px-4 py-2.5 text-center"><span className={`px-2 py-0.5 text-[10px] rounded ${pctColor}`}>{s.pctExceeding}%</span></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>
    );
  };

  // ===== REPORT 4: Stuck-in-Stage ============================================
  const StuckInStageReport = () => {
    const STUCK_THRESHOLD = 3;
    const stuckRIAs = filteredSubmissions
      .filter(s => s.status !== "completed" && s.status !== "rejected")
      .map(s => ({ ...s, daysInStage: getDaysInCurrentStage(s) }))
      .filter(s => s.daysInStage > STUCK_THRESHOLD)
      .sort((a, b) => b.daysInStage - a.daysInStage);

    const csvData = stuckRIAs.map(s => ({
      tracking_number: s.tracking_number, title: s.title,
      current_stage: s.current_stage, stage_name: s.stage_name,
      days_stuck: s.daysInStage, assigned_to: s.assigned_officer_name || "Unassigned",
    }));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Stuck-in-Stage Report</h3>
          <button onClick={() => exportToCSV(csvData, "stuck_stage.csv")} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg"><Download className="h-3.5 w-3.5" />Export CSV</button>
        </div>
        <p className="text-xs text-gray-500">Submissions with no stage progression in more than {STUCK_THRESHOLD} days.</p>
        {stuckRIAs.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
            <p className="text-green-700 font-medium">No stuck submissions. All active RIAs are progressing.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left">Tracking #</th><th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-center">Current Stage</th><th className="px-4 py-3 text-center">Days Stuck</th>
                <th className="px-4 py-3 text-center">Alert</th><th className="px-4 py-3 text-left">Assigned</th>
              </tr></thead>
              <tbody>{stuckRIAs.map(s => {
                const alertClass = s.daysInStage > 7 ? "bg-red-600 text-white" : s.daysInStage > 5 ? "bg-orange-500 text-white" : "bg-yellow-500 text-white";
                const alertLabel = s.daysInStage > 7 ? "Critical" : s.daysInStage > 5 ? "High" : "Medium";
                return (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-amber-700">{s.tracking_number}</td>
                    <td className="px-4 py-2.5 max-w-[200px] truncate">{s.title}</td>
                    <td className="px-4 py-2.5 text-center text-xs">Stage {s.current_stage}: {s.stage_name}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-orange-700">{s.daysInStage}d</td>
                    <td className="px-4 py-2.5 text-center"><span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${alertClass}`}>{alertLabel}</span></td>
                    <td className="px-4 py-2.5 text-xs">{s.assigned_officer_name || <span className="text-gray-400 italic">Unassigned</span>}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ===== REPORT 5: Officer Workload ==========================================
  const OfficerWorkloadReport = () => {
    const workloadData = staffList.map(staff => {
      const assigned = filteredSubmissions.filter(s => s.assigned_officer_id === staff.user_id);
      const active = assigned.filter(s => s.status !== "completed" && s.status !== "rejected");
      const completed = assigned.filter(s => s.status === "completed");

      const handlingTimes = completed
        .map(s => s.created_at && s.completed_at ? Math.floor((new Date(s.completed_at).getTime() - new Date(s.created_at).getTime()) / 86400000) : null)
        .filter((d): d is number => d !== null);
      const avgHandling = handlingTimes.length > 0 ? handlingTimes.reduce((a, b) => a + b, 0) / handlingTimes.length : 0;

      return {
        name: staff.full_name, email: staff.email,
        totalAssigned: assigned.length, activeCount: active.length,
        completedCount: completed.length, avgHandlingTime: +avgHandling.toFixed(1),
      };
    }).filter(w => w.totalAssigned > 0);

    const totalOfficers = workloadData.length;
    const avgActive = totalOfficers > 0 ? (workloadData.reduce((a, w) => a + w.activeCount, 0) / totalOfficers).toFixed(1) : "0";
    const avgTime = totalOfficers > 0 ? (workloadData.reduce((a, w) => a + w.avgHandlingTime, 0) / totalOfficers).toFixed(1) : "0";

    const csvData = workloadData.map(w => ({
      officer: w.name, email: w.email, total_assigned: w.totalAssigned,
      active: w.activeCount, completed: w.completedCount, avg_handling_days: w.avgHandlingTime,
    }));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Officer Workload</h3>
          <button onClick={() => exportToCSV(csvData, "officer_workload.csv")} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg"><Download className="h-3.5 w-3.5" />Export CSV</button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total Officers" value={totalOfficers} color="blue" />
          <StatCard label="Avg Active Cases" value={avgActive} color="yellow" />
          <StatCard label="Avg Handling Time" value={`${avgTime}d`} color="green" />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
              <th className="px-4 py-3 text-left">Officer</th><th className="px-4 py-3 text-center">Total</th>
              <th className="px-4 py-3 text-center">Active</th><th className="px-4 py-3 text-center">Completed</th>
              <th className="px-4 py-3 text-center">Avg Time</th><th className="px-4 py-3 text-center">Load</th>
            </tr></thead>
            <tbody>{workloadData.map(w => {
              const loadClass = w.activeCount > 5 ? "bg-red-100 text-red-700" : w.activeCount > 3 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700";
              const loadLabel = w.activeCount > 5 ? "Overloaded" : w.activeCount > 3 ? "Busy" : "Normal";
              const timeColor = w.avgHandlingTime > 14 ? "text-red-600" : w.avgHandlingTime > 10 ? "text-yellow-600" : "text-green-600";
              return (
                <tr key={w.email} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2.5"><div className="font-medium">{w.name}</div><div className="text-[10px] text-gray-400">{w.email}</div></td>
                  <td className="px-4 py-2.5 text-center">{w.totalAssigned}</td>
                  <td className="px-4 py-2.5 text-center font-semibold">{w.activeCount}</td>
                  <td className="px-4 py-2.5 text-center">{w.completedCount}</td>
                  <td className={`px-4 py-2.5 text-center font-semibold ${timeColor}`}>{w.avgHandlingTime}d</td>
                  <td className="px-4 py-2.5 text-center"><span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${loadClass}`}>{loadLabel}</span></td>
                </tr>
              );
            })}</tbody>
          </table>
          {workloadData.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No officer assignments found.</p>}
        </div>
      </div>
    );
  };

  // ===== REPORT 6: Bottleneck Heatmap ========================================
  const BottleneckHeatmapReport = () => {
    const heatData = RIA_STAGES.map(stage => {
      const entries = stageHistory.filter(h => h.stage_number === stage.number);
      const durations: number[] = [];
      entries.forEach(entry => {
        const next = stageHistory.find(h => h.submission_id === entry.submission_id && h.stage_number === stage.number + 1);
        const sub = submissions.find(s => s.id === entry.submission_id);
        const end = next ? new Date(next.created_at) : sub && sub.current_stage === stage.number ? new Date() : null;
        if (end) durations.push(Math.floor((end.getTime() - new Date(entry.created_at).getTime()) / 86400000));
      });
      const avg = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      const expected = 1;
      const variance = avg - expected;
      const severity: "critical" | "high" | "medium" | "low" = variance > 3 ? "critical" : variance > 1 ? "high" : variance > 0 ? "medium" : "low";
      return { ...stage, avg: +avg.toFixed(1), expected, variance: +variance.toFixed(1), severity, count: durations.length };
    });

    const heatColor: Record<string, string> = {
      critical: "bg-red-600 text-white",
      high: "bg-orange-500 text-white",
      medium: "bg-yellow-400 text-gray-900",
      low: "bg-green-500 text-white",
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Bottleneck Heatmap</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {heatData.map(s => (
            <div key={s.number} className={`rounded-lg p-3 text-center ${heatColor[s.severity]}`}>
              <div className="text-xs font-bold">Stage {s.number}</div>
              <div className="text-[10px] truncate mt-0.5">{s.name}</div>
              <div className="border-t border-white/30 mt-2 pt-2 text-[10px] space-y-0.5">
                <div>Avg: {s.avg}d</div>
                <div>Expected: {s.expected}d</div>
                {s.variance > 0 && <div className="font-bold">+{s.variance}d</div>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-[10px] text-gray-500 justify-center">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> On Track</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> Minor Delay</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500 inline-block" /> Significant</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-600 inline-block" /> Critical</span>
        </div>
      </div>
    );
  };

  // ===== REPORT 7: Audit Trail ===============================================
  const AuditTrailReport = () => {
    const [selectedRIA, setSelectedRIA] = useState("");
    const [auditSearch, setAuditSearch] = useState("");

    const auditFiltered = filteredSubmissions.filter(s => {
      if (!auditSearch) return true;
      const q = auditSearch.toLowerCase();
      return s.tracking_number.toLowerCase().includes(q) || s.title.toLowerCase().includes(q);
    });

    if (selectedRIA === "") {
      // LIST VIEW
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Audit Trail</h3>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={auditSearch} onChange={e => setAuditSearch(e.target.value)}
              placeholder="Search by tracking # or title..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left">Tracking #</th><th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-center">Stage</th><th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr></thead>
              <tbody>{auditFiltered.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-amber-700">{s.tracking_number}</td>
                  <td className="px-4 py-2.5 max-w-[200px] truncate">{s.title}</td>
                  <td className="px-4 py-2.5 text-center text-xs">{s.current_stage}/15</td>
                  <td className="px-4 py-2.5 text-center"><span className={`px-2 py-0.5 text-[10px] rounded border ${RIA_STATUS_COLORS[s.status]}`}>{RIA_STATUS_LABELS[s.status]}</span></td>
                  <td className="px-4 py-2.5 text-center">
                    <button onClick={() => setSelectedRIA(s.id)} className="px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100">View Trail</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
            {auditFiltered.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No submissions found.</p>}
          </div>
        </div>
      );
    }

    // DETAIL VIEW
    const sub = submissions.find(s => s.id === selectedRIA);
    if (!sub) return null;

    const subHistory = stageHistory.filter(h => h.submission_id === selectedRIA);
    const subComments = comments.filter(c => c.submission_id === selectedRIA);

    // Build unified timeline
    type TimelineEvent = { type: "stage" | "assignment" | "comment" | "document"; date: string | null; title: string; detail: string; actor: string; status: "done" | "current" | "pending"; stageNumber?: number };
    const timeline: TimelineEvent[] = [];

    // Stages
    RIA_STAGES.forEach(stage => {
      const entry = subHistory.find(h => h.stage_number === stage.number);
      const isDone = sub.current_stage > stage.number;
      const isCurrent = sub.current_stage === stage.number;
      timeline.push({
        type: "stage",
        stageNumber: stage.number,
        date: entry?.created_at || null,
        title: `Stage ${stage.number}: ${stage.name}`,
        detail: entry?.notes || "",
        actor: entry?.acted_by_name || (isDone ? "System" : "Pending"),
        status: isCurrent ? "current" : isDone ? "done" : "pending",
      });
    });

    // Assignment event
    if (sub.assigned_at) {
      timeline.push({
        type: "assignment", date: sub.assigned_at,
        title: "Officer Assigned",
        detail: `Assigned to ${sub.assigned_officer_name || "Unknown"}`,
        actor: sub.assigned_officer_name || "", status: "done",
      });
    }

    // Comments
    subComments.forEach(c => {
      timeline.push({
        type: "comment", date: c.created_at,
        title: "Comment Added",
        detail: c.comment,
        actor: c.user_name || "", status: "done",
      });
    });

    // Documents
    if (sub.document_filename) {
      timeline.push({
        type: "document", date: sub.created_at,
        title: "Initial Document Uploaded",
        detail: sub.document_filename,
        actor: sub.submitter_name, status: "done",
      });
    }
    if (sub.final_report_path) {
      timeline.push({
        type: "document", date: sub.completed_at || sub.updated_at,
        title: "Final Report Uploaded",
        detail: sub.final_report_path,
        actor: sub.assigned_officer_name || "", status: "done",
      });
    }

    // Sort: stages first by number, rest by date
    timeline.sort((a, b) => {
      if (a.type === "stage" && b.type === "stage") return (a.stageNumber || 0) - (b.stageNumber || 0);
      if (a.type === "stage") return -1;
      if (b.type === "stage") return 1;
      return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
    });

    const badgeColor: Record<string, string> = {
      stage: "bg-green-100 text-green-700",
      assignment: "bg-blue-100 text-blue-700",
      comment: "bg-purple-100 text-purple-700",
      document: "bg-orange-100 text-orange-700",
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedRIA("")} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg">
            <ArrowLeft className="h-3.5 w-3.5" />Back to List
          </button>
          <h3 className="text-lg font-bold text-gray-900">Audit Trail — {sub.tracking_number}</h3>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm">
          <p><span className="font-medium">Title:</span> {sub.title}</p>
          <p><span className="font-medium">Submitter:</span> {sub.submitter_name} · {sub.organization}</p>
          <p><span className="font-medium">Status:</span> {RIA_STATUS_LABELS[sub.status]} · Stage {sub.current_stage}/15</p>
        </div>
        <div className="space-y-3">
          {timeline.map((ev, idx) => {
            const opacity = ev.status === "pending" ? "opacity-60" : "";
            const borderColor = ev.status === "done" ? "border-green-300" : ev.status === "current" ? "border-blue-400" : "border-gray-200";
            const bgColor = ev.status === "pending" ? "bg-gray-50" : "bg-white";
            // Duration to next
            const nextEv = timeline[idx + 1];
            const durationDays = ev.date && nextEv?.date
              ? Math.floor((new Date(nextEv.date).getTime() - new Date(ev.date).getTime()) / 86400000)
              : null;
            const durationColor = durationDays !== null ? (durationDays <= 2 ? "text-green-600" : durationDays <= 5 ? "text-yellow-600" : "text-red-600") : "";

            return (
              <div key={idx} className={`border-l-4 ${borderColor} ${bgColor} rounded-r-lg p-3 ${opacity}`}>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`px-2 py-0.5 text-[10px] rounded font-medium ${ev.status === "current" ? "bg-blue-100 text-blue-700" : badgeColor[ev.type]}`}>{ev.type}</span>
                  <span className="text-sm font-semibold text-gray-800">{ev.title}</span>
                  {durationDays !== null && durationDays > 0 && ev.status === "done" && (
                    <span className={`text-[10px] font-medium ${durationColor}`}>({durationDays}d)</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {ev.actor && ev.actor !== "Pending" && <span className="flex items-center gap-1"><User className="h-3 w-3" />{ev.actor}</span>}
                  {ev.date && <span>{new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
                </div>
                {ev.detail && <p className="text-xs text-gray-600 mt-1">{ev.detail}</p>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ===== REPORT 8: Turnaround Time ==========================================
  const TurnaroundTimeReport = () => {
    const completedRIAs = filteredSubmissions.filter(s => s.status === "completed" && s.created_at && s.completed_at);
    const turnaroundData = completedRIAs.map(s => {
      const totalDays = Math.floor((new Date(s.completed_at!).getTime() - new Date(s.created_at).getTime()) / 86400000);
      return {
        id: s.id, tracking_number: s.tracking_number, title: s.title,
        totalDays, slaCompliance: totalDays <= 14 ? "Met" as const : "Exceeded" as const,
        variance: totalDays - 14,
        assignedTo: s.assigned_officer_name || "—",
      };
    }).sort((a, b) => b.totalDays - a.totalDays);

    const metSLA = turnaroundData.filter(r => r.slaCompliance === "Met").length;
    const slaRate = turnaroundData.length > 0 ? ((metSLA / turnaroundData.length) * 100).toFixed(0) : "0";
    const avgTurnaround = turnaroundData.length > 0 ? (turnaroundData.reduce((a, r) => a + r.totalDays, 0) / turnaroundData.length).toFixed(1) : "0";

    const csvData = turnaroundData.map(r => ({
      tracking_number: r.tracking_number, title: r.title,
      total_days: r.totalDays, sla: r.slaCompliance, variance: r.variance, assigned_to: r.assignedTo,
    }));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Turnaround Time</h3>
          <button onClick={() => exportToCSV(csvData, "turnaround_time.csv")} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg"><Download className="h-3.5 w-3.5" />Export CSV</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Completed RIAs" value={turnaroundData.length} color="blue" />
          <StatCard label="Avg Turnaround" value={`${avgTurnaround}d`} color="purple" />
          <StatCard label="SLA Compliance" value={`${slaRate}%`} color="green" />
          <StatCard label="Exceeded SLA" value={turnaroundData.length - metSLA} color="red" />
        </div>
        {turnaroundData.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No completed submissions yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left">Tracking #</th><th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-center">Total Days</th><th className="px-4 py-3 text-center">SLA</th>
                <th className="px-4 py-3 text-center">Variance</th><th className="px-4 py-3 text-left">Assigned</th>
              </tr></thead>
              <tbody>{turnaroundData.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-amber-700">{r.tracking_number}</td>
                  <td className="px-4 py-2.5 max-w-[200px] truncate">{r.title}</td>
                  <td className="px-4 py-2.5 text-center font-semibold">{r.totalDays}d</td>
                  <td className="px-4 py-2.5 text-center"><span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${r.slaCompliance === "Met" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{r.slaCompliance}</span></td>
                  <td className={`px-4 py-2.5 text-center font-semibold ${r.variance > 0 ? "text-red-600" : "text-green-600"}`}>{r.variance > 0 ? "+" : ""}{r.variance}d</td>
                  <td className="px-4 py-2.5 text-xs">{r.assignedTo}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ===== Report switch router ================================================
  const renderReport = () => {
    switch (activeReport) {
      case "live-status":      return <LiveStatusReport />;
      case "overdue":          return <OverdueReport />;
      case "stage-duration":   return <StageDurationReport />;
      case "stuck-stage":      return <StuckInStageReport />;
      case "officer-workload": return <OfficerWorkloadReport />;
      case "bottleneck":       return <BottleneckHeatmapReport />;
      case "audit":            return <AuditTrailReport />;
      case "turnaround":       return <TurnaroundTimeReport />;
      default:                 return <LiveStatusReport />;
    }
  };

  // ===== RENDER ==============================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">RIA Reports & Analytics</h2>
        <p className="text-gray-600 mt-1">Comprehensive tracking and performance reports.</p>
      </div>

      {/* Global filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Title, tracking #, organization, name..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400">
              <option value="all">All</option>
              <option value="submitted">Submitted</option>
              <option value="in_review">In Review</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sector</label>
            <select value={filterSector} onChange={e => setFilterSector(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400">
              <option value="all">All Sectors</option>
              {RIA_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="px-3 py-2 text-xs text-red-600 hover:text-red-800 border border-red-200 rounded-lg hover:bg-red-50">Clear</button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">Showing <strong>{filteredSubmissions.length}</strong> of <strong>{submissions.length}</strong> RIAs</p>
      </div>

      {/* Report selector — 2×4 grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {REPORTS.map(report => {
          const isActive = activeReport === report.id;
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors text-left ${
                isActive ? TAB_ACTIVE[report.color] : "bg-gray-50 border-transparent hover:bg-gray-100"
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{report.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active report content */}
      {loadingData ? (
        <p className="text-center text-gray-500 py-12">Loading report data…</p>
      ) : (
        renderReport()
      )}
    </div>
  );
}

// =============================================================================
// Stat card helper
// =============================================================================
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    blue:    "bg-blue-50 border-blue-200 text-blue-700",
    green:   "bg-green-50 border-green-200 text-green-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    red:     "bg-red-50 border-red-200 text-red-700",
    yellow:  "bg-yellow-50 border-yellow-200 text-yellow-700",
    purple:  "bg-purple-50 border-purple-200 text-purple-700",
  };
  return (
    <div className={`border rounded-lg px-4 py-3 ${colorMap[color] || colorMap.blue}`}>
      <p className="text-[10px] uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
