import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import StaffLayout from "@/components/layout/StaffLayout";
import { toast } from "sonner";
import {
  CalendarDays, Clock, CheckCircle2, XCircle, TrendingUp, Plus,
  User, ChevronDown, ChevronUp, MessageSquare, FileText, AlertCircle, ArrowLeft,
} from "lucide-react";
import {
  LeaveApplication,
  LeaveType,
  LeaveStatus,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_COLORS,
} from "@/types/leave";

export default function StaffLeavePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/portal/login");
    else if (user.role !== "staff" && user.role !== "admin") navigate("/portal/dashboard");
  }, [user, loading, navigate]);

  if (loading) return null;
  if (!user || (user.role !== "staff" && user.role !== "admin")) return null;

  return (
    <StaffLayout activeTab="overview">
      <StaffLeaveOverview />
    </StaffLayout>
  );
}

function StaffLeaveOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  // My leave applications
  const { data: myApplications = [] } = useQuery({
    queryKey: ["my_leave_applications", staffProfile?.id],
    enabled: !!staffProfile,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("leave_applications")
        .select("*")
        .eq("employee_id", staffProfile!.id)
        .order("application_date", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as LeaveApplication[];
    },
  });

  // My leave balances
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

  // Pending approvals (applications from other staff needing review)
  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ["staff_pending_approvals"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("leave_applications")
        .select(`
          *,
          employee:employee_id(full_name, employee_number, department_id)
        `)
        .in("status", ["pending", "recommended"])
        .order("application_date", { ascending: false });
      if (error) throw error;
      return (data || []).filter((a: any) => a.user_id !== user!.id);
    },
  });

  // All applications stats
  const { data: allApps = [] } = useQuery({
    queryKey: ["staff_all_leave_stats"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("leave_applications")
        .select("id, status, leave_type, requested_days")
        .order("application_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const stats = {
    pending: allApps.filter((a: any) => a.status === "pending").length,
    recommended: allApps.filter((a: any) => a.status === "recommended").length,
    approved: allApps.filter((a: any) => a.status === "approved").length,
    rejected: allApps.filter((a: any) => a.status === "rejected").length,
    total: allApps.length,
  };

  const myPending = myApplications.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate("/portal/dashboard")}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      {/* Welcome */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 mb-2">Leave Management Overview</p>
          <h2 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}</h2>
          <p className="text-gray-600 mt-1">Manage your leave and review staff applications.</p>
        </div>
        <Link
          to="/portal/leave/apply"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors text-sm"
        >
          <Plus className="h-4 w-4" /> Apply for Leave
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Applications" value={stats.total} color="text-gray-700" icon={FileText} />
        <StatCard label="Pending Review" value={stats.pending} color="text-yellow-600" icon={Clock} />
        <StatCard label="Recommended" value={stats.recommended} color="text-blue-600" icon={CheckCircle2} />
        <StatCard label="Approved" value={stats.approved} color="text-green-600" icon={CheckCircle2} />
        <StatCard label="Rejected" value={stats.rejected} color="text-red-600" icon={XCircle} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Leave Balances */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              My Leave Balances ({new Date().getFullYear()})
            </h3>
            <Link to="/portal/leave" className="text-xs text-amber-600 hover:underline">View All</Link>
          </div>
          {!staffProfile ? (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">No staff profile linked. Contact HR/Admin.</p>
            </div>
          ) : balances.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No balances configured yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {balances.map((bal: any) => (
                <div key={bal.id} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xl font-bold text-amber-600">{bal.days_remaining}</p>
                  <p className="text-xs text-gray-500">of {bal.total_entitlement} days</p>
                  <p className="text-xs font-medium text-gray-700 mt-1">
                    {LEAVE_TYPE_LABELS[bal.leave_type as LeaveType]?.replace(" Leave", "") || bal.leave_type}
                  </p>
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, (bal.days_remaining / bal.total_entitlement) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Recent Applications */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-amber-600" />
              My Recent Applications
            </h3>
            <Link to="/portal/leave" className="text-xs text-amber-600 hover:underline">View All</Link>
          </div>
          {myApplications.length === 0 ? (
            <div className="text-center py-6">
              <CalendarDays className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No applications yet.</p>
              <Link to="/portal/leave/apply" className="text-xs text-amber-600 hover:underline mt-1 inline-block">Apply Now</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {myApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{LEAVE_TYPE_LABELS[app.leave_type]}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(app.start_date)} — {formatDate(app.end_date)} ({app.requested_days}d)
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${LEAVE_STATUS_COLORS[app.status]}`}>
                    {LEAVE_STATUS_LABELS[app.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Approvals - Action Required */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Pending Leave Reviews
            {pendingApprovals.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full font-semibold">
                {pendingApprovals.length}
              </span>
            )}
          </h3>
          <Link to="/portal/staff/leave/approvals" className="text-xs text-amber-600 hover:underline">View All Approvals</Link>
        </div>
        {pendingApprovals.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No applications awaiting your review.</p>
        ) : (
          <div className="space-y-2">
            {pendingApprovals.slice(0, 5).map((app: any) => (
              <Link
                key={app.id}
                to="/portal/staff/leave/approvals"
                className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{app.employee?.full_name || "Unknown"}</p>
                    <p className="text-xs text-gray-500">
                      {LEAVE_TYPE_LABELS[app.leave_type as LeaveType]} • {app.requested_days} days • {formatDate(app.start_date)}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${LEAVE_STATUS_COLORS[app.status as LeaveStatus]}`}>
                  {LEAVE_STATUS_LABELS[app.status as LeaveStatus]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="p-2 bg-gray-50 rounded-lg">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
      </div>
      <p className="text-xs text-gray-500 mt-3">{label}</p>
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
