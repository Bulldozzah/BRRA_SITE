import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import StaffLayout from "@/components/layout/StaffLayout";
import {
  CalendarDays, Plus, Clock, CheckCircle2, XCircle, AlertCircle,
  Calendar, TrendingUp, Download, ArrowLeft,
} from "lucide-react";
import {
  LeaveApplication,
  AnnualLeaveApplication,
  LeaveType,
  LeaveStatus,
  AnnualLeaveStatus,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_COLORS,
  ANNUAL_LEAVE_STATUS_LABELS,
  ANNUAL_LEAVE_STATUS_COLORS,
} from "@/types/leave";
import { generateLeavePDF } from "@/utils/generateLeavePDF";
import { generateAnnualLeavePDF } from "@/utils/generateAnnualLeavePDF";

export default function LeaveDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/portal/login");
  }, [user, loading, navigate]);

  // Fetch staff profile
  const { data: staffProfile } = useQuery({
    queryKey: ["my_staff_profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id, full_name, employee_number, department_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch leave applications
  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ["my_leave_applications", staffProfile?.id],
    enabled: !!staffProfile,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("leave_applications")
        .select(`
          *,
          employee:employee_id(full_name, employee_number, department:department_id(name), position:position_id(title))
        `)
        .eq("employee_id", staffProfile!.id)
        .order("application_date", { ascending: false });
      if (error) throw error;
      // Flatten nested department/position for PDF compatibility
      return (data || []).map((app: any) => ({
        ...app,
        department: app.employee?.department || null,
        position: app.employee?.position || null,
      })) as LeaveApplication[];
    },
  });

  // Fetch leave balances
  const { data: balances = [] } = useQuery({
    queryKey: ["my_leave_balances", staffProfile?.id],
    enabled: !!staffProfile,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("leave_balances")
        .select("*")
        .eq("employee_id", staffProfile!.id)
        .eq("year", new Date().getFullYear());
      if (error) throw error;
      return data;
    },
  });

  // Fetch annual leave applications
  const { data: annualApplications = [], isLoading: annualLoading } = useQuery({
    queryKey: ["my_annual_leave", staffProfile?.id],
    enabled: !!staffProfile,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("annual_leave_applications")
        .select("*, approval:annual_leave_approvals(*)")
        .eq("employee_id", staffProfile!.id)
        .order("application_date", { ascending: false });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        approval: Array.isArray(d.approval) ? d.approval[0] || null : d.approval,
      })) as AnnualLeaveApplication[];
    },
  });

  if (!user) return null;

  // Stats
  const pending = applications.filter((a) => a.status === "pending").length;
  const approved = applications.filter((a) => a.status === "approved").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  return (
    <StaffLayout activeTab="my-leave">
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 mb-2">Leave Management</p>
            <h2 className="text-2xl font-bold text-gray-900">My Leave</h2>
            <p className="text-gray-600 mt-1">View your leave history, balances, and apply for new leave.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/portal/leave/apply"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors text-sm"
            >
              <Plus className="h-4 w-4" /> Apply for Leave
            </Link>
            <Link
              to="/portal/leave/annual/apply"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-amber-600 text-amber-700 font-semibold rounded-lg hover:bg-amber-50 transition-colors text-sm"
            >
              <CalendarDays className="h-4 w-4" /> Annual Leave (BRRA Form)
            </Link>
          </div>
        </div>

        {/* No staff profile */}
        {!staffProfile && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800">Staff Profile Required</h3>
                <p className="text-sm text-red-600 mt-1">
                  You need a linked staff profile to use the leave system. Please contact HR/Admin.
                </p>
              </div>
            </div>
          </div>
        )}

        {staffProfile && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              <StatCard icon={Clock} label="Pending" value={pending} color="text-yellow-600" />
              <StatCard icon={CheckCircle2} label="Approved" value={approved} color="text-green-600" />
              <StatCard icon={XCircle} label="Rejected" value={rejected} color="text-red-600" />
              <StatCard icon={Calendar} label="Total Applications" value={applications.length} color="text-primary" />
            </div>

            {/* Leave Balances */}
            {balances.length > 0 && (
              <div className="mb-10">
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Leave Balances ({new Date().getFullYear()})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {balances.map((bal: any) => (
                    <div key={bal.id} className="bg-noir-elevated border border-border rounded-sm p-4">
                      <p className="text-2xl font-bold text-primary">{bal.days_remaining}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        of {bal.total_entitlement} days
                      </p>
                      <p className="text-xs font-mono uppercase tracking-wider text-foreground mt-2">
                        {LEAVE_TYPE_LABELS[bal.leave_type as LeaveType]?.replace(" Leave", "") || bal.leave_type}
                      </p>
                      <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (bal.days_remaining / bal.total_entitlement) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Annual Leave Applications */}
            <div className="mb-10">
              <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Annual Leave Applications (BRRA Form)
              </h2>

              {annualLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
              ) : annualApplications.length === 0 ? (
                <div className="text-center py-8 bg-noir-elevated border border-border rounded-sm">
                  <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No annual leave applications yet.</p>
                  <Link
                    to="/portal/leave/annual/apply"
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 text-sm text-primary border border-primary rounded-sm hover:bg-primary/10 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Apply Now
                  </Link>
                </div>
              ) : (
                <div className="border border-border rounded-sm overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-noir-elevated/60 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="text-left px-4 py-3">Period</th>
                        <th className="text-left px-4 py-3">Days</th>
                        <th className="text-left px-4 py-3">Resume</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-left px-4 py-3 hidden sm:table-cell">Applied</th>
                        <th className="text-left px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {annualApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-noir-elevated/30 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(app.leave_start_date)}
                          </td>
                          <td className="px-4 py-3">
                            {app.leave_days_applied}
                            {app.days_commuted > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">(+{app.days_commuted} commuted)</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(app.resume_date)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-mono rounded-sm border ${ANNUAL_LEAVE_STATUS_COLORS[app.status]}`}
                            >
                              {ANNUAL_LEAVE_STATUS_LABELS[app.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                            {formatDate(app.application_date)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => generateAnnualLeavePDF(app)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/30 rounded-sm hover:bg-primary/20 transition-colors"
                              title="Download annual leave form as PDF"
                            >
                              <Download className="h-3.5 w-3.5" />
                              PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Other Leave Applications Table */}
            <div>
              <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Other Leave Applications
              </h2>

              {appsLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
              ) : applications.length === 0 ? (
                <div className="text-center py-12 bg-noir-elevated border border-border rounded-sm">
                  <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No leave applications yet.</p>
                  <Link
                    to="/portal/leave/apply"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm text-primary border border-primary rounded-sm hover:bg-primary/10 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Apply Now
                  </Link>
                </div>
              ) : (
                <div className="border border-border rounded-sm overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-noir-elevated/60 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="text-left px-4 py-3">Type</th>
                        <th className="text-left px-4 py-3">Dates</th>
                        <th className="text-left px-4 py-3">Days</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-left px-4 py-3 hidden sm:table-cell">Applied</th>
                        <th className="text-left px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {applications.map((app) => (
                        <tr key={app.id} className="hover:bg-noir-elevated/30 transition-colors">
                          <td className="px-4 py-3 font-medium">
                            {LEAVE_TYPE_LABELS[app.leave_type] || app.leave_type}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(app.start_date)} — {formatDate(app.end_date)}
                          </td>
                          <td className="px-4 py-3">
                            {app.approved_days ?? app.requested_days}
                            {app.approved_days && app.approved_days !== app.requested_days && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (req: {app.requested_days})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-mono rounded-sm border ${
                                LEAVE_STATUS_COLORS[app.status]
                              }`}
                            >
                              {LEAVE_STATUS_LABELS[app.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                            {formatDate(app.application_date)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => generateLeavePDF(app)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/30 rounded-sm hover:bg-primary/20 transition-colors"
                              title="Download leave form as PDF"
                            >
                              <Download className="h-3.5 w-3.5" />
                              PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </StaffLayout>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-noir-elevated border border-border rounded-sm p-5">
      <Icon className={`h-6 w-6 ${color} mb-3`} />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
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
