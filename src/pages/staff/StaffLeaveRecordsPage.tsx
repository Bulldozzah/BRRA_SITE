import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import StaffLayout from "@/components/layout/StaffLayout";
import { FileText, Search, Download } from "lucide-react";
import {
  LeaveType,
  LeaveStatus,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_COLORS,
} from "@/types/leave";

export default function StaffLeaveRecordsPage() {
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
    <StaffLayout activeTab="records">
      <LeaveRecordsContent />
    </StaffLayout>
  );
}

function LeaveRecordsContent() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<LeaveType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "all">("all");

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["staff_leave_records"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("leave_applications")
        .select(`
          *,
          employee:employee_id(full_name, employee_number, department_id)
        `)
        .order("application_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = records.filter((r: any) => {
    if (typeFilter !== "all" && r.leave_type !== typeFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (r.employee?.full_name || "").toLowerCase();
      const empNo = (r.employee?.employee_number || "").toLowerCase();
      if (!name.includes(q) && !empNo.includes(q)) return false;
    }
    return true;
  });

  // Summary stats
  const totalDays = filtered
    .filter((r: any) => r.status === "approved")
    .reduce((sum: number, r: any) => sum + (r.approved_days || r.requested_days || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Records</h2>
          <p className="text-gray-600 mt-1">Complete leave register across all staff.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
            <span className="text-amber-700 font-semibold">{filtered.length}</span>
            <span className="text-amber-600 ml-1">records</span>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <span className="text-green-700 font-semibold">{totalDays}</span>
            <span className="text-green-600 ml-1">days approved</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Search Employee</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or employee number..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
        {/* Leave Type */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Leave Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as LeaveType | "all")}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Types</option>
            {Object.entries(LEAVE_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        {/* Status */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeaveStatus | "all")}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Statuses</option>
            {Object.entries(LEAVE_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-center text-gray-500 py-12">Loading records…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No leave records found.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Period</th>
                <th className="px-4 py-3 text-left">Days</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">HoD</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.employee?.full_name || "—"}</p>
                    <p className="text-xs text-gray-400">{r.employee?.employee_number || ""}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {LEAVE_TYPE_LABELS[r.leave_type as LeaveType] || r.leave_type}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatDate(r.start_date)} — {formatDate(r.end_date)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{r.approved_days ?? r.requested_days}</span>
                    {r.approved_days && r.approved_days !== r.requested_days && (
                      <span className="text-xs text-gray-400 ml-1">(req: {r.requested_days})</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded border ${LEAVE_STATUS_COLORS[r.status as LeaveStatus]}`}>
                      {LEAVE_STATUS_LABELS[r.status as LeaveStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {r.hod_recommendation ? (
                      <span className={`text-xs font-medium capitalize ${r.hod_recommendation === "recommended" ? "text-blue-600" : "text-orange-600"}`}>
                        {r.hod_recommendation.replace("_", " ")}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                    {formatDate(r.application_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
