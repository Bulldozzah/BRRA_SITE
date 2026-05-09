import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import PageLayout from "@/components/layout/PageLayout";
import {
  CalendarDays, Plus, Clock, CheckCircle2, XCircle, AlertCircle,
  Calendar, TrendingUp,
} from "lucide-react";
import {
  LeaveApplication,
  LeaveType,
  LeaveStatus,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_COLORS,
} from "@/types/leave";

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
        .select("*")
        .eq("employee_id", staffProfile!.id)
        .order("application_date", { ascending: false });
      if (error) throw error;
      return data as LeaveApplication[];
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

  if (!user) return null;

  // Stats
  const pending = applications.filter((a) => a.status === "pending").length;
  const approved = applications.filter((a) => a.status === "approved").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  return (
    <PageLayout>
      <section className="container-wide py-16">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3">Leave Management</p>
            <h1 className="font-display text-4xl font-bold mb-2">My Leave</h1>
            <p className="text-muted-foreground">View your leave history, balances, and apply for new leave.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/portal/leave/apply"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all"
            >
              <Plus className="h-4 w-4" /> Apply for Leave
            </Link>
            <Link
              to="/portal/leave/annual/apply"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary font-semibold rounded-sm hover:bg-primary hover:text-primary-foreground transition-all"
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

            {/* Applications Table */}
            <div>
              <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Leave Applications
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </PageLayout>
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
