import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { toast } from "sonner";
import {
  CalendarDays, Users, TrendingUp, FileText, Download,
  Settings, Plus, Trash2, Save, Calendar,
} from "lucide-react";
import { invalidateHolidayCache } from "@/utils/holidays";
import {
  LeaveType,
  LeaveStatus,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_COLORS,
} from "@/types/leave";

export default function AdminLeavePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/portal/login");
    else if (user.role !== "admin") navigate("/portal/dashboard");
  }, [user, loading, navigate]);

  if (loading) return null;
  if (!user || user.role !== "admin") return null;

  return (
    <AdminLayout activeTab="leave">
      <LeaveAdminContent />
    </AdminLayout>
  );
}

function LeaveAdminContent() {
  const [activeTab, setActiveTab] = useState<"overview" | "applications" | "balances" | "settings" | "holidays">("overview");

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: TrendingUp },
    { id: "applications" as const, label: "All Applications", icon: FileText },
    { id: "balances" as const, label: "Leave Balances", icon: Users },
    { id: "settings" as const, label: "Leave Settings", icon: Settings },
    { id: "holidays" as const, label: "Public Holidays", icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
        <p className="text-gray-600 mt-1">Manage leave applications, balances, and policy settings.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-amber-500 text-amber-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "applications" && <ApplicationsTab />}
        {activeTab === "balances" && <BalancesTab />}
        {activeTab === "settings" && <SettingsTab />}
        {activeTab === "holidays" && <HolidaysTab />}
      </div>
    </div>
  );
}

// ===================== OVERVIEW TAB =====================
function OverviewTab() {
  const { data: stats } = useQuery({
    queryKey: ["admin_leave_stats"],
    queryFn: async () => {
      const [pending, recommended, approved, rejected] = await Promise.all([
        (supabase as any).from("leave_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("leave_applications").select("id", { count: "exact", head: true }).eq("status", "recommended"),
        (supabase as any).from("leave_applications").select("id", { count: "exact", head: true }).eq("status", "approved"),
        (supabase as any).from("leave_applications").select("id", { count: "exact", head: true }).eq("status", "rejected"),
      ]);
      return {
        pending: pending.count ?? 0,
        recommended: recommended.count ?? 0,
        approved: approved.count ?? 0,
        rejected: rejected.count ?? 0,
        total: (pending.count ?? 0) + (recommended.count ?? 0) + (approved.count ?? 0) + (rejected.count ?? 0),
      };
    },
  });

  // Monthly summary
  const { data: monthly = [] } = useQuery({
    queryKey: ["admin_leave_monthly"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("leave_applications")
        .select("leave_type, status, requested_days, start_date")
        .eq("status", "approved")
        .gte("start_date", `${new Date().getFullYear()}-01-01`);
      if (error) throw error;
      return data || [];
    },
  });

  const totalDaysApproved = monthly.reduce((sum: number, a: any) => sum + (a.requested_days || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Applications" value={stats?.total ?? 0} color="text-gray-700" />
        <StatCard label="Pending" value={stats?.pending ?? 0} color="text-yellow-600" />
        <StatCard label="Recommended" value={stats?.recommended ?? 0} color="text-blue-600" />
        <StatCard label="Approved" value={stats?.approved ?? 0} color="text-green-600" />
        <StatCard label="Rejected" value={stats?.rejected ?? 0} color="text-red-600" />
      </div>

      {/* Year Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 mb-3">
          {new Date().getFullYear()} Summary
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold text-amber-600">{totalDaysApproved}</p>
            <p className="text-sm text-gray-500">Total Days Approved</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{monthly.length}</p>
            <p className="text-sm text-gray-500">Approved Applications</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">
              {monthly.length > 0 ? (totalDaysApproved / monthly.length).toFixed(1) : 0}
            </p>
            <p className="text-sm text-gray-500">Avg Days Per Application</p>
          </div>
        </div>
      </div>

      {/* Leave by type breakdown */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Approved Leave by Type ({new Date().getFullYear()})</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(LEAVE_TYPE_LABELS).map(([type, label]) => {
            const count = monthly.filter((m: any) => m.leave_type === type).length;
            const days = monthly.filter((m: any) => m.leave_type === type).reduce((s: number, a: any) => s + (a.requested_days || 0), 0);
            return (
              <div key={type} className="border border-gray-200 rounded-lg p-3">
                <p className="text-lg font-bold">{count}</p>
                <p className="text-xs text-gray-500">{label.replace(" Leave", "")}</p>
                <p className="text-xs text-amber-600 mt-1">{days} days</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===================== APPLICATIONS TAB =====================
function ApplicationsTab() {
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "all">("all");

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["admin_all_leave_applications", statusFilter],
    queryFn: async () => {
      let query = (supabase as any)
        .from("leave_applications")
        .select(`
          *,
          employee:employee_id(full_name, employee_number)
        `)
        .order("application_date", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "recommended", "approved", "rejected", "cancelled"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
              statusFilter === s
                ? "border-amber-500 text-amber-700 bg-amber-50"
                : "border-gray-200 text-gray-600 hover:border-amber-300"
            }`}
          >
            {s === "all" ? "All" : LEAVE_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-center text-gray-500 py-8">Loading…</p>
      ) : applications.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No applications found.</p>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Dates</th>
                <th className="px-4 py-3 text-left">Days</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.map((app: any) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{app.employee?.full_name || "—"}</p>
                    <p className="text-xs text-gray-400">{app.employee?.employee_number || ""}</p>
                  </td>
                  <td className="px-4 py-3">{LEAVE_TYPE_LABELS[app.leave_type as LeaveType] || app.leave_type}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(app.start_date)} — {formatDate(app.end_date)}
                  </td>
                  <td className="px-4 py-3">
                    {app.approved_days ?? app.requested_days}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${LEAVE_STATUS_COLORS[app.status as LeaveStatus]}`}>
                      {LEAVE_STATUS_LABELS[app.status as LeaveStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(app.application_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ===================== BALANCES TAB =====================
function BalancesTab() {
  const queryClient = useQueryClient();

  const { data: balances = [], isLoading } = useQuery({
    queryKey: ["admin_all_leave_balances"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("leave_balances")
        .select(`
          *,
          employee:employee_id(full_name, employee_number)
        `)
        .eq("year", new Date().getFullYear())
        .order("employee_id");
      if (error) throw error;
      return data;
    },
  });

  // Group by employee
  const grouped: Record<string, { name: string; empNo: string; balances: any[] }> = {};
  balances.forEach((b: any) => {
    if (!grouped[b.employee_id]) {
      grouped[b.employee_id] = {
        name: b.employee?.full_name || "Unknown",
        empNo: b.employee?.employee_number || "",
        balances: [],
      };
    }
    grouped[b.employee_id].balances.push(b);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Employee Leave Balances ({new Date().getFullYear()})</h3>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-500 py-8">Loading…</p>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-center text-gray-500 py-8">No balances configured. Balances are created when staff profiles are set up.</p>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([empId, emp]) => (
            <div key={empId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{emp.name}</p>
                  <p className="text-xs text-gray-500">{emp.empNo}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {emp.balances.map((bal: any) => (
                  <div key={bal.id} className="bg-gray-50 rounded p-2 text-center">
                    <p className="text-sm font-bold text-amber-600">{bal.days_remaining}/{bal.total_entitlement}</p>
                    <p className="text-[10px] uppercase text-gray-500">{(LEAVE_TYPE_LABELS[bal.leave_type as LeaveType] || bal.leave_type).replace(" Leave", "")}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== SETTINGS TAB =====================
function SettingsTab() {
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["leave_settings_admin"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("leave_settings")
        .select("*")
        .order("leave_type");
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (setting: any) => {
      const { error } = await (supabase as any)
        .from("leave_settings")
        .update({
          days_per_year: setting.days_per_year,
          rate_per_month: setting.rate_per_month,
          requires_attachment: setting.requires_attachment,
          max_carry_over: setting.max_carry_over,
          description: setting.description,
        })
        .eq("id", setting.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Setting updated");
      queryClient.invalidateQueries({ queryKey: ["leave_settings_admin"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900">Leave Policy Settings</h3>
        <p className="text-sm text-gray-500 mt-1">Configure entitlement days, accrual rates, and requirements per leave type.</p>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-500 py-8">Loading…</p>
      ) : (
        <div className="space-y-3">
          {settings.map((setting: any) => (
            <SettingRow key={setting.id} setting={setting} onSave={(s) => updateMutation.mutate(s)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SettingRow({ setting, onSave }: { setting: any; onSave: (s: any) => void }) {
  const [daysPerYear, setDaysPerYear] = useState(setting.days_per_year);
  const [ratePerMonth, setRatePerMonth] = useState(setting.rate_per_month);
  const [requiresAttachment, setRequiresAttachment] = useState(setting.requires_attachment);
  const [maxCarryOver, setMaxCarryOver] = useState(setting.max_carry_over || 0);

  const hasChanges =
    daysPerYear !== setting.days_per_year ||
    ratePerMonth !== setting.rate_per_month ||
    requiresAttachment !== setting.requires_attachment ||
    maxCarryOver !== (setting.max_carry_over || 0);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">{LEAVE_TYPE_LABELS[setting.leave_type as LeaveType] || setting.leave_type}</h4>
        {hasChanges && (
          <button
            onClick={() => onSave({ ...setting, days_per_year: daysPerYear, rate_per_month: ratePerMonth, requires_attachment: requiresAttachment, max_carry_over: maxCarryOver })}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
          >
            <Save className="h-3 w-3" /> Save
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Days/Year</label>
          <input
            type="number"
            value={daysPerYear}
            onChange={(e) => setDaysPerYear(parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Rate/Month</label>
          <input
            type="number"
            step="0.1"
            value={ratePerMonth}
            onChange={(e) => setRatePerMonth(parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Max Carry Over</label>
          <input
            type="number"
            value={maxCarryOver}
            onChange={(e) => setMaxCarryOver(parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresAttachment}
              onChange={(e) => setRequiresAttachment(e.target.checked)}
              className="h-4 w-4 text-amber-600 rounded"
            />
            <span className="text-xs text-gray-600">Requires Attachment</span>
          </label>
        </div>
      </div>
      {setting.description && (
        <p className="text-xs text-gray-400 mt-2">{setting.description}</p>
      )}
    </div>
  );
}

// ===================== SHARED =====================
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
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

// ===================== HOLIDAYS TAB =====================
function HolidaysTab() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ["public_holidays", yearFilter],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("public_holidays")
        .select("*")
        .eq("year", yearFilter)
        .order("holiday_date");
      if (error) throw error;
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (holiday: { name: string; holiday_date: string; year: number; recurring: boolean; description?: string }) => {
      const { error } = await (supabase as any)
        .from("public_holidays")
        .insert(holiday);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Holiday added");
      queryClient.invalidateQueries({ queryKey: ["public_holidays"] });
      invalidateHolidayCache();
      setShowAddForm(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await (supabase as any)
        .from("public_holidays")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Holiday updated");
      queryClient.invalidateQueries({ queryKey: ["public_holidays"] });
      invalidateHolidayCache();
      setEditingId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("public_holidays")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Holiday deleted");
      queryClient.invalidateQueries({ queryKey: ["public_holidays"] });
      invalidateHolidayCache();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Public Holidays</h3>
          <p className="text-sm text-gray-500 mt-1">Manage Zambian public holidays. These are excluded from leave day calculations.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
          >
            {[2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Holiday
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <HolidayForm
          onSubmit={(data) => addMutation.mutate({ ...data, year: yearFilter })}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Holidays List */}
      {isLoading ? (
        <p className="text-center text-gray-500 py-8">Loading holidays…</p>
      ) : holidays.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg">
          <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No holidays configured for {yearFilter}.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {holidays.map((h: any) => (
            <div key={h.id} className="border border-gray-200 rounded-lg p-4">
              {editingId === h.id ? (
                <HolidayForm
                  initialData={h}
                  onSubmit={(data) => updateMutation.mutate({ id: h.id, ...data })}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-amber-50 rounded-lg flex flex-col items-center justify-center border border-amber-200">
                      <p className="text-xs text-amber-600 font-semibold uppercase">
                        {new Date(h.holiday_date + "T00:00:00").toLocaleDateString("en-GB", { month: "short" })}
                      </p>
                      <p className="text-2xl font-bold text-amber-700">
                        {new Date(h.holiday_date + "T00:00:00").getDate()}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{h.name}</p>
                      <p className="text-xs text-gray-500">{h.description || "—"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {new Date(h.holiday_date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long" })}
                        </span>
                        {h.recurring && (
                          <span className="px-2 py-0.5 text-[10px] bg-blue-50 text-blue-600 rounded border border-blue-200">
                            Recurring
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingId(h.id)}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${h.name}"?`)) deleteMutation.mutate(h.id);
                      }}
                      className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HolidayForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: any;
  onSubmit: (data: { name: string; holiday_date: string; recurring: boolean; description?: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [date, setDate] = useState(initialData?.holiday_date || "");
  const [recurring, setRecurring] = useState(initialData?.recurring ?? true);
  const [description, setDescription] = useState(initialData?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) {
      toast.error("Name and date are required");
      return;
    }
    onSubmit({ name, holiday_date: date, recurring, description });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Holiday Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Independence Day"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="recurring"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
          className="h-4 w-4 text-amber-600 rounded"
        />
        <label htmlFor="recurring" className="text-sm text-gray-600">
          Recurring (same date every year)
        </label>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Save className="h-3.5 w-3.5" /> {initialData ? "Update" : "Add"} Holiday
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
