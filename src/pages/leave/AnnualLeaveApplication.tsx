import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import StaffLayout from "@/components/layout/StaffLayout";
import { toast } from "sonner";
import { CalendarDays, Send, AlertCircle, FileText, Calculator, Search, Users, ArrowLeft } from "lucide-react";
import { loadHolidaysFromDB, isNonWorkingDay } from "@/utils/holidays";
import { sendLeaveNotification } from "@/utils/sendLeaveNotification";
import {
  AnnualLeaveStatus,
  ANNUAL_LEAVE_STATUS_LABELS,
  ANNUAL_LEAVE_STATUS_COLORS,
} from "@/types/leave";

type StaffMember = {
  id: string;
  full_name: string;
  email: string;
  user_id: string | null;
  department_id: string | null;
  position_id: string | null;
  departments?: { name: string } | null;
  positions?: { title: string } | null;
};

export default function AnnualLeaveApplication() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/portal/login");
  }, [user, loading, navigate]);

  // Load public holidays from database
  const [holidaysReady, setHolidaysReady] = useState(false);
  useEffect(() => {
    loadHolidaysFromDB().then(() => setHolidaysReady(true));
  }, []);

  // Fetch staff profile
  const { data: staffProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["my_staff_profile_annual", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("staff_profiles")
        .select(`
          id, full_name, employee_number, nrc_number, other_names,
          department_id, position_id, date_joined, grade_id,
          departments:department_id(name),
          positions:position_id(title),
          grades:grade_id(name, level)
        `)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch annual leave ledger for current year
  const { data: ledger } = useQuery({
    queryKey: ["annual_leave_ledger", staffProfile?.id],
    enabled: !!staffProfile,
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      const { data, error } = await (supabase as any)
        .from("annual_leave_ledger")
        .select("*")
        .eq("employee_id", staffProfile!.id)
        .eq("year", currentYear)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch last approved annual leave
  const { data: lastLeave } = useQuery({
    queryKey: ["last_annual_leave", staffProfile?.id],
    enabled: !!staffProfile,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("annual_leave_applications")
        .select("id, resume_date, leave_start_date, days_commuted, status")
        .eq("employee_id", staffProfile!.id)
        .eq("status", "approved")
        .order("resume_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch staff members for approver selection
  const { data: staffMembers = [] } = useQuery({
    queryKey: ["staff_members_annual"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("staff_profiles")
        .select(`
          id, full_name, email, user_id, department_id, position_id,
          departments:department_id(name),
          positions:position_id(title)
        `)
        .not("user_id", "is", null)
        .order("full_name");
      if (error) throw error;
      return (data || []) as StaffMember[];
    },
  });

  // Approver selection state
  const [hodId, setHodId] = useState("");
  const [hrId, setHrId] = useState("");
  const [executiveDirectorId, setExecutiveDirectorId] = useState("");
  const [hodSearch, setHodSearch] = useState("");
  const [hrSearch, setHrSearch] = useState("");
  const [edSearch, setEdSearch] = useState("");
  const [hodOpen, setHodOpen] = useState(false);
  const [hrOpen, setHrOpen] = useState(false);
  const [edOpen, setEdOpen] = useState(false);

  // Form state - Part A
  const [leaveDaysApplied, setLeaveDaysApplied] = useState<number>(1);
  const [daysCommuted, setDaysCommuted] = useState<number>(0);
  const [startDate, setStartDate] = useState("");
  const [leaveAddress, setLeaveAddress] = useState("");
  const [signature, setSignature] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Derived: total days deducted
  const totalDaysDeducted = leaveDaysApplied + daysCommuted;

  // Auto-calculate resume date (excludes weekends + public holidays)
  const resumeDate = useMemo(() => {
    if (!startDate || leaveDaysApplied < 1) return "";
    const start = new Date(startDate);
    let daysToAdd = leaveDaysApplied - 1;
    let current = new Date(start);
    while (isNonWorkingDay(current)) {
      current.setDate(current.getDate() + 1);
    }
    while (daysToAdd > 0) {
      current.setDate(current.getDate() + 1);
      if (!isNonWorkingDay(current)) daysToAdd--;
    }
    // Resume date is the next working day after leave ends
    current.setDate(current.getDate() + 1);
    while (isNonWorkingDay(current)) {
      current.setDate(current.getDate() + 1);
    }
    return current.toISOString().split("T")[0];
  }, [startDate, leaveDaysApplied, holidaysReady]);

  // Current balance
  const currentBalance = ledger?.closing_balance ?? null;

  // Balance after this application
  const balanceAfter = useMemo(() => {
    if (currentBalance === null) return null;
    return currentBalance - totalDaysDeducted;
  }, [currentBalance, totalDaysDeducted]);

  // Extract name parts
  const surname = staffProfile?.full_name?.split(" ").slice(-1)[0] || "";
  const otherNames = staffProfile?.full_name?.split(" ").slice(0, -1).join(" ") || "";

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!staffProfile || !user) throw new Error("Staff profile not found");

      if (!signature) throw new Error("You must sign the application.");
      if (!startDate) throw new Error("Start date is required.");
      if (!leaveAddress.trim()) throw new Error("Leave address is required.");
      if (!hodId) throw new Error("Please select a Head of Department for approval.");
      if (!hrId) throw new Error("Please select an HR Officer for certification.");
      if (!executiveDirectorId) throw new Error("Please select an Executive Director for final approval.");

      // Resolve approver profiles
      const hodStaff = staffMembers.find(s => s.id === hodId);
      const hrStaff = staffMembers.find(s => s.id === hrId);
      const edStaff = staffMembers.find(s => s.id === executiveDirectorId);

      if (!hodStaff?.user_id) throw new Error("Selected H.o.D does not have a linked portal account.");
      if (!hrStaff?.user_id) throw new Error("Selected HR Officer does not have a linked portal account.");
      if (!edStaff?.user_id) throw new Error("Selected Executive Director does not have a linked portal account.");

      // Business rule: sufficient balance
      if (currentBalance !== null && totalDaysDeducted > currentBalance) {
        throw new Error(`Insufficient leave balance. You have ${currentBalance} days remaining.`);
      }

      // Business rule: start date in future
      if (new Date(startDate) <= new Date()) {
        throw new Error("Leave start date must be a future date.");
      }

      // Check overlapping
      const { data: overlapping } = await (supabase as any)
        .from("annual_leave_applications")
        .select("id")
        .eq("employee_id", staffProfile.id)
        .in("status", ["submitted", "hod_recommended", "hr_certified", "approved"])
        .or(`and(leave_start_date.lte.${resumeDate},resume_date.gte.${startDate})`);

      if (overlapping && overlapping.length > 0) {
        throw new Error("You already have an overlapping annual leave application.");
      }

      // Insert the application with approver details
      const { error } = await (supabase as any).from("annual_leave_applications").insert({
        employee_id: staffProfile.id,
        user_id: user.id,
        surname,
        other_names: otherNames,
        personnel_file_no: staffProfile.employee_number || null,
        nrc_number: (staffProfile as any).nrc_number || null,
        department: (staffProfile as any).departments?.name || "Unknown",
        position: (staffProfile as any).positions?.title || "Unknown",
        grade: (staffProfile as any).grades?.name || null,
        annual_salary: null,
        last_leave_return_date: lastLeave?.resume_date || null,
        last_leave_commuted_date: lastLeave?.days_commuted > 0 ? lastLeave?.resume_date : null,
        last_travel_allowance_date: null,
        leave_days_applied: leaveDaysApplied,
        leave_start_date: startDate,
        days_commuted: daysCommuted,
        total_days_deducted: totalDaysDeducted,
        leave_address: leaveAddress,
        resume_date: resumeDate || null,
        employee_signature: true,
        status: "submitted",
        leave_balance_before: currentBalance,
        leave_balance_after: balanceAfter,
        hod_approver_id: hodStaff.user_id,
        hod_approver_name: hodStaff.full_name,
        hod_approver_email: hodStaff.email,
        hr_approver_id: hrStaff.user_id,
        hr_approver_name: hrStaff.full_name,
        hr_approver_email: hrStaff.email,
        ed_approver_id: edStaff.user_id,
        ed_approver_name: edStaff.full_name,
        ed_approver_email: edStaff.email,
        applicant_email: (staffProfile as any).email || null,
      });

      if (error) throw error;

      // Send email notifications
      const emailBase = {
        applicant_name: staffProfile.full_name,
        leave_type: "Annual Leave",
        start_date: startDate,
        end_date: resumeDate || startDate,
        requested_days: leaveDaysApplied,
      };

      try {
        // Notify applicant
        if ((staffProfile as any).email) {
          await sendLeaveNotification({
            ...emailBase,
            notification_type: "submitted",
            recipients: [{ name: staffProfile.full_name, email: (staffProfile as any).email, role: "Applicant" }],
          });
        }
        // Notify H.o.D only (HR and ED notified at later stages)
        await sendLeaveNotification({
          ...emailBase,
          notification_type: "submitted_approver",
          recipients: [{ name: hodStaff.full_name, email: hodStaff.email, role: "Head of Department" }],
        });
      } catch {
        console.warn("Email notification could not be sent.");
      }
    },
    onSuccess: () => {
      toast.success("Annual leave application submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["my_annual_leave"] });
      navigate("/portal/leave");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitMutation.mutateAsync();
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <StaffLayout activeTab="annual-apply">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate("/portal/dashboard")}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 mb-2">Annual Leave Management</p>
          <h2 className="text-2xl font-bold text-gray-900">Annual Leave Application</h2>
          <p className="text-gray-600 mt-1">BRRA Annual Leave Form — Part A (Employee Application)</p>
        </div>

          {/* No staff profile warning */}
          {!profileLoading && !staffProfile && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800">Staff Profile Required</h3>
                  <p className="text-sm text-red-600 mt-1">
                    You must have a linked staff profile to apply for annual leave. Please contact HR/Admin.
                  </p>
                </div>
              </div>
            </div>
          )}

          {staffProfile && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* PART A Section 1: Personal & Employment Details */}
              <div className="bg-noir-elevated border border-border rounded-sm p-6">
                <h2 className="font-display text-lg font-bold mb-1 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Part A — Personal & Employment Details
                </h2>
                <p className="text-xs text-muted-foreground mb-4">(Auto-filled from HR Profile)</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ReadOnlyField label="Surname" value={surname} />
                  <ReadOnlyField label="Other Names" value={otherNames} />
                  <ReadOnlyField label="Personnel File No." value={staffProfile.employee_number || "—"} />
                  <ReadOnlyField label="NRC No." value={(staffProfile as any).nrc_number || "—"} />
                  <ReadOnlyField label="Department" value={(staffProfile as any).departments?.name || "—"} />
                  <ReadOnlyField label="Position" value={(staffProfile as any).positions?.title || "—"} />
                  <ReadOnlyField label="Grade" value={(staffProfile as any).grades?.name || "—"} />
                  <ReadOnlyField label="Date Joined" value={staffProfile.date_joined || "—"} />
                </div>
              </div>

              {/* PART A Section 2: Leave History */}
              <div className="bg-noir-elevated border border-border rounded-sm p-6">
                <h2 className="font-display text-lg font-bold mb-1 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Leave History
                </h2>
                <p className="text-xs text-muted-foreground mb-4">(System-derived from leave records)</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <ReadOnlyField
                    label="Date Returned After Last Leave"
                    value={lastLeave?.resume_date || "No previous leave"}
                  />
                  <ReadOnlyField
                    label="Date Leave Last Commuted"
                    value={lastLeave?.days_commuted > 0 ? (lastLeave?.resume_date || "—") : "Never commuted"}
                  />
                  <ReadOnlyField label="Travel Allowance Last Received" value="—" />
                </div>
              </div>

              {/* PART A Section 3: Leave Balance */}
              {ledger && (
                <div className="bg-noir-elevated border border-border rounded-sm p-6">
                  <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Annual Leave Balance ({new Date().getFullYear()})
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <BalanceCard label="Opening" value={ledger.opening_balance} />
                    <BalanceCard label="Earned" value={ledger.days_earned} color="text-green-600" />
                    <BalanceCard label="Taken" value={ledger.days_taken} color="text-orange-600" />
                    <BalanceCard label="Commuted" value={ledger.days_commuted} color="text-blue-600" />
                    <BalanceCard label="Available" value={ledger.closing_balance} color="text-primary" highlight />
                  </div>
                </div>
              )}

              {/* PART A Section 4: Leave Request */}
              <div className="bg-noir-elevated border border-border rounded-sm p-6">
                <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Annual Leave Request
                </h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  {/* Days Applied */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                      Days Applied For *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={leaveDaysApplied}
                      onChange={(e) => setLeaveDaysApplied(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-sm"
                    />
                    {currentBalance !== null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Available: <span className="text-primary font-semibold">{currentBalance} days</span>
                      </p>
                    )}
                  </div>

                  {/* Days to Commute */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                      Days to Commute
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={daysCommuted}
                      onChange={(e) => setDaysCommuted(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave days converted to cash (deducted from balance)
                    </p>
                  </div>

                  {/* Total Days Deducted */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                      Total Days Deducted
                    </label>
                    <div className="px-4 py-3 bg-muted border border-border rounded-sm text-sm font-bold text-primary">
                      {totalDaysDeducted} days
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Applied + Commuted</p>
                  </div>

                  {/* Balance After */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                      Balance After Application
                    </label>
                    <div className={`px-4 py-3 bg-muted border border-border rounded-sm text-sm font-bold ${
                      balanceAfter !== null && balanceAfter < 0 ? "text-red-600" : "text-green-600"
                    }`}>
                      {balanceAfter !== null ? `${balanceAfter} days` : "—"}
                    </div>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                      First Day of Leave *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-sm"
                      required
                    />
                  </div>

                  {/* Resume Date */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                      Duty Resumes On (Auto)
                    </label>
                    <input
                      type="date"
                      value={resumeDate}
                      readOnly
                      className="w-full px-4 py-3 bg-muted border border-border rounded-sm text-sm cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated (excludes weekends &amp; public holidays)</p>
                  </div>

                  {/* Leave Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                      Address During Leave *
                    </label>
                    <textarea
                      value={leaveAddress}
                      onChange={(e) => setLeaveAddress(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-sm resize-none"
                      placeholder="Physical address where you can be reached during leave..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Validation warnings */}
              {currentBalance !== null && totalDaysDeducted > currentBalance && (
                <div className="bg-red-50 border border-red-200 rounded-sm p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">
                    Total days deducted ({totalDaysDeducted}) exceed your available balance ({currentBalance} days).
                    Please reduce the days applied or days commuted.
                  </p>
                </div>
              )}

              {/* Approver Selection */}
              <div className="bg-noir-elevated border border-border rounded-sm p-6">
                <h2 className="font-display text-lg font-bold mb-1 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Approval Routing
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Select the approvers for this application. The form will be routed: H.o.D → HR Officer → Executive Director.
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {/* H.o.D Selection */}
                  <div className="relative">
                    <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">Head of Department *</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={hodSearch}
                        onChange={(e) => { setHodSearch(e.target.value); setHodOpen(true); }}
                        onFocus={() => setHodOpen(true)}
                        placeholder={hodId ? staffMembers.find(s => s.id === hodId)?.full_name : "Search staff..."}
                        className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    {hodOpen && (
                      <div className="absolute z-20 mt-1 w-full max-h-40 overflow-y-auto bg-background border border-border rounded-sm shadow-lg">
                        {staffMembers
                          .filter(s => s.full_name.toLowerCase().includes(hodSearch.toLowerCase()))
                          .slice(0, 8)
                          .map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => { setHodId(s.id); setHodSearch(s.full_name); setHodOpen(false); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                              <span className="font-medium">{s.full_name}</span>
                              <span className="text-xs text-muted-foreground ml-2">{s.positions?.title || ""}</span>
                            </button>
                          ))}
                      </div>
                    )}
                    {hodId && <p className="text-xs text-green-600 mt-1">✓ {staffMembers.find(s => s.id === hodId)?.full_name}</p>}
                  </div>

                  {/* HR Officer Selection */}
                  <div className="relative">
                    <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">HR Officer *</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={hrSearch}
                        onChange={(e) => { setHrSearch(e.target.value); setHrOpen(true); }}
                        onFocus={() => setHrOpen(true)}
                        placeholder={hrId ? staffMembers.find(s => s.id === hrId)?.full_name : "Search staff..."}
                        className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    {hrOpen && (
                      <div className="absolute z-20 mt-1 w-full max-h-40 overflow-y-auto bg-background border border-border rounded-sm shadow-lg">
                        {staffMembers
                          .filter(s => s.full_name.toLowerCase().includes(hrSearch.toLowerCase()))
                          .slice(0, 8)
                          .map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => { setHrId(s.id); setHrSearch(s.full_name); setHrOpen(false); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                              <span className="font-medium">{s.full_name}</span>
                              <span className="text-xs text-muted-foreground ml-2">{s.positions?.title || ""}</span>
                            </button>
                          ))}
                      </div>
                    )}
                    {hrId && <p className="text-xs text-green-600 mt-1">✓ {staffMembers.find(s => s.id === hrId)?.full_name}</p>}
                  </div>

                  {/* Executive Director Selection */}
                  <div className="relative">
                    <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">Executive Director *</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={edSearch}
                        onChange={(e) => { setEdSearch(e.target.value); setEdOpen(true); }}
                        onFocus={() => setEdOpen(true)}
                        placeholder={executiveDirectorId ? staffMembers.find(s => s.id === executiveDirectorId)?.full_name : "Search staff..."}
                        className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    {edOpen && (
                      <div className="absolute z-20 mt-1 w-full max-h-40 overflow-y-auto bg-background border border-border rounded-sm shadow-lg">
                        {staffMembers
                          .filter(s => s.full_name.toLowerCase().includes(edSearch.toLowerCase()))
                          .slice(0, 8)
                          .map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => { setExecutiveDirectorId(s.id); setEdSearch(s.full_name); setEdOpen(false); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                              <span className="font-medium">{s.full_name}</span>
                              <span className="text-xs text-muted-foreground ml-2">{s.positions?.title || ""}</span>
                            </button>
                          ))}
                      </div>
                    )}
                    {executiveDirectorId && <p className="text-xs text-green-600 mt-1">✓ {staffMembers.find(s => s.id === executiveDirectorId)?.full_name}</p>}
                  </div>
                </div>
              </div>

              {/* Employee Signature */}
              <div className="bg-noir-elevated border border-border rounded-sm p-6">
                <h2 className="font-display text-lg font-bold mb-4">Employee Declaration & Signature</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  I hereby apply for annual leave as stated above. I declare that the information provided is correct.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="signature"
                    checked={signature}
                    onChange={(e) => setSignature(e.target.checked)}
                    className="h-5 w-5 rounded border-border text-primary"
                    required
                  />
                  <label htmlFor="signature" className="text-sm font-medium">
                    I confirm and digitally sign this application
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => navigate("/portal/leave")}
                  className="px-6 py-3 text-sm border border-border hover:border-primary rounded-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !startDate || !signature || !leaveAddress.trim() || !hodId || !hrId || !executiveDirectorId}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Submitting…" : "Submit Annual Leave Application"}
                </button>
              </div>
            </form>
          )}
      </div>
    </StaffLayout>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      <p className="px-4 py-2.5 bg-muted border border-border rounded-sm text-sm">{value}</p>
    </div>
  );
}

function BalanceCard({ label, value, color, highlight }: { label: string; value: number; color?: string; highlight?: boolean }) {
  return (
    <div className={`border rounded-sm p-3 text-center ${highlight ? "border-primary bg-primary/5" : "border-border"}`}>
      <p className={`text-xl font-bold ${color || "text-foreground"}`}>{value}</p>
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
