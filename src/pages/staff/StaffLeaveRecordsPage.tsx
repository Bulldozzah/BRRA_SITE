import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import StaffLayout from "@/components/layout/StaffLayout";
import { FileText, Search, Download, CalendarDays, ArrowLeft } from "lucide-react";
import {
  LeaveType,
  LeaveStatus,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_COLORS,
  AnnualLeaveStatus,
  ANNUAL_LEAVE_STATUS_LABELS,
  ANNUAL_LEAVE_STATUS_COLORS,
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
      <LeaveRecordsContent navigate={navigate} />
    </StaffLayout>
  );
}

function LeaveRecordsContent({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const [activeTab, setActiveTab] = useState<"normal" | "annual">("normal");

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

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Records</h2>
          <p className="text-gray-600 mt-1">Complete leave register across all staff.</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("normal")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "normal"
              ? "border-amber-500 text-amber-700"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <FileText className="h-4 w-4" />
          Normal Leave
        </button>
        <button
          onClick={() => setActiveTab("annual")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "annual"
              ? "border-amber-500 text-amber-700"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          Annual Leave
        </button>
      </div>

      {activeTab === "normal" ? <NormalLeaveTab /> : <AnnualLeaveTab />}
    </div>
  );
}

// =============================================================================
// Normal Leave Tab (existing functionality)
// =============================================================================
function NormalLeaveTab() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<LeaveType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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
    if (dateFrom && r.start_date < dateFrom) return false;
    if (dateTo && r.end_date > dateTo) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (r.employee?.full_name || "").toLowerCase();
      const empNo = (r.employee?.employee_number || "").toLowerCase();
      if (!name.includes(q) && !empNo.includes(q)) return false;
    }
    return true;
  });

  // Summary stats - overall
  const totalDays = filtered
    .filter((r: any) => r.status === "approved")
    .reduce((sum: number, r: any) => sum + (r.approved_days || r.requested_days || 0), 0);

  // Group by employee and calculate totals per staff member (respects date filter)
  const staffSummary = filtered
    .filter((r: any) => r.status === "approved")
    .reduce((acc: any, r: any) => {
      const empId = r.employee_id;
      const empName = r.employee?.full_name || "Unknown";
      const empNo = r.employee?.employee_number || "";
      const leaveType = r.leave_type;
      const days = r.approved_days || r.requested_days || 0;

      if (!acc[empId]) {
        acc[empId] = {
          name: empName,
          employeeNumber: empNo,
          totalDays: 0,
          byType: {},
        };
      }

      acc[empId].totalDays += days;

      if (!acc[empId].byType[leaveType]) {
        acc[empId].byType[leaveType] = 0;
      }
      acc[empId].byType[leaveType] += days;

      return acc;
    }, {});

  const staffSummaryArray = Object.values(staffSummary).sort((a: any, b: any) => 
    b.totalDays - a.totalDays
  );

  return (
    <div className="space-y-6">
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

      {/* Staff Summary by Leave Type */}
      {staffSummaryArray.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Leave Summary by Staff Member</h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">Employee</th>
                  <th className="px-4 py-3 text-left">Employee No.</th>
                  <th className="px-4 py-3 text-left">Total Days</th>
                  <th className="px-4 py-3 text-left">Leave Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffSummaryArray.map((staff: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{staff.name}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {staff.employeeNumber || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 bg-amber-50 border border-amber-200 rounded text-amber-700 font-semibold">
                        {staff.totalDays} days
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(staff.byType).map(([type, days]: [string, any]) => (
                          <span key={type} className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs">
                            <span className="text-gray-600">{LEAVE_TYPE_LABELS[type as LeaveType] || type}:</span>
                            <span className="font-semibold text-gray-900">{days}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
        {/* Date From */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">From Date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
        {/* Date To */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">To Date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
        {/* Clear dates */}
        {(dateFrom || dateTo) && (
          <div className="flex items-end">
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Dates
            </button>
          </div>
        )}
      </div>

      {/* Detailed Records Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Individual Leave Applications</h3>
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
    </div>
  );
}

// =============================================================================
// Annual Leave Tab
// =============================================================================
function AnnualLeaveTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AnnualLeaveStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["annual_leave_records"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("annual_leave_applications")
        .select("*")
        .order("application_date", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = records.filter((r: any) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (dateFrom && r.leave_start_date < dateFrom) return false;
    if (dateTo && r.leave_start_date > dateTo) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (`${r.surname} ${r.other_names}`).toLowerCase();
      const dept = (r.department || "").toLowerCase();
      if (!name.includes(q) && !dept.includes(q) && !(r.personnel_file_no || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Summary stats
  const totalApproved = filtered.filter((r: any) => r.status === "approved");
  const totalDays = totalApproved.reduce((sum: number, r: any) => sum + (r.leave_days_applied || 0), 0);

  // Group by employee for staff summary
  const staffSummary = totalApproved.reduce((acc: any, r: any) => {
    const empId = r.employee_id;
    const empName = `${r.surname}, ${r.other_names}`;
    const dept = r.department || "";
    const days = r.leave_days_applied || 0;
    const commuted = r.days_commuted || 0;

    if (!acc[empId]) {
      acc[empId] = {
        name: empName,
        department: dept,
        personnelNo: r.personnel_file_no || "",
        totalDays: 0,
        totalCommuted: 0,
        applications: 0,
      };
    }

    acc[empId].totalDays += days;
    acc[empId].totalCommuted += commuted;
    acc[empId].applications += 1;

    return acc;
  }, {});

  const staffSummaryArray = Object.values(staffSummary).sort((a: any, b: any) =>
    b.totalDays - a.totalDays
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          <span className="text-amber-700 font-semibold">{filtered.length}</span>
          <span className="text-amber-600 ml-1">records</span>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          <span className="text-green-700 font-semibold">{totalDays}</span>
          <span className="text-green-600 ml-1">days approved</span>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <span className="text-blue-700 font-semibold">{totalApproved.length}</span>
          <span className="text-blue-600 ml-1">approved</span>
        </div>
      </div>

      {/* Staff Summary */}
      {staffSummaryArray.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Annual Leave Summary by Staff Member</h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">Employee</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Personnel No.</th>
                  <th className="px-4 py-3 text-left">Total Days</th>
                  <th className="px-4 py-3 text-left">Days Commuted</th>
                  <th className="px-4 py-3 text-left">Applications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffSummaryArray.map((staff: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{staff.name}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {staff.department || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {staff.personnelNo || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 bg-amber-50 border border-amber-200 rounded text-amber-700 font-semibold">
                        {staff.totalDays} days
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {staff.totalCommuted > 0 ? (
                        <span className="font-medium">{staff.totalCommuted} days</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 bg-blue-50 border border-blue-200 rounded text-blue-700 font-medium text-xs">
                        {staff.applications}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Search Employee</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, department, or file no..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AnnualLeaveStatus | "all")}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Statuses</option>
            {Object.entries(ANNUAL_LEAVE_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">From Date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To Date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
        {(dateFrom || dateTo) && (
          <div className="flex items-end">
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Dates
            </button>
          </div>
        )}
      </div>

      {/* Detailed Records Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Individual Annual Leave Applications</h3>
        {isLoading ? (
          <p className="text-center text-gray-500 py-12">Loading records…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <CalendarDays className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No annual leave records found.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">Employee</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Period</th>
                  <th className="px-4 py-3 text-left">Days</th>
                  <th className="px-4 py-3 text-left">Commuted</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.surname}, {r.other_names}</p>
                      {r.personnel_file_no && <p className="text-xs text-gray-400">File: {r.personnel_file_no}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{r.department}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(r.leave_start_date)} — {formatDate(r.resume_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{r.leave_days_applied}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.days_commuted || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded border ${ANNUAL_LEAVE_STATUS_COLORS[r.status as AnnualLeaveStatus]}`}>
                        {ANNUAL_LEAVE_STATUS_LABELS[r.status as AnnualLeaveStatus]}
                      </span>
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
