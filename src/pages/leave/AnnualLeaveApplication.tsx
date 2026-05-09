import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import PageLayout from "@/components/layout/PageLayout";
import { toast } from "sonner";
import { CalendarDays, Send, AlertCircle, FileText, Calculator } from "lucide-react";
import { loadHolidaysFromDB, isNonWorkingDay } from "@/utils/holidays";
import {
  AnnualLeaveStatus,
  ANNUAL_LEAVE_STATUS_LABELS,
  ANNUAL_LEAVE_STATUS_COLORS,
} from "@/types/leave";

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
          id, full_name, employee_number, department_id, position_id,
          date_joined, grade_id,
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

      // Insert the application
      const { error } = await (supabase as any).from("annual_leave_applications").insert({
        employee_id: staffProfile.id,
        user_id: user.id,
        surname,
        other_names: otherNames,
        personnel_file_no: staffProfile.employee_number || null,
        nrc_number: null,
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
      });

      if (error) throw error;
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
    <PageLayout>
      <section className="container-wide py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3">Annual Leave Management</p>
            <h1 className="font-display text-3xl font-bold mb-2">Annual Leave Application</h1>
            <p className="text-muted-foreground">BRRA Annual Leave Form — Part A (Employee Application)</p>
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
                  disabled={submitting || !startDate || !signature || !leaveAddress.trim()}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Submitting…" : "Submit Annual Leave Application"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </PageLayout>
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
