import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import PageLayout from "@/components/layout/PageLayout";
import { toast } from "sonner";
import { CalendarDays, Send, AlertCircle, FileText, Search, Users } from "lucide-react";
import { LeaveType, LEAVE_TYPE_LABELS } from "@/types/leave";
import { loadHolidaysFromDB, isNonWorkingDay, countWorkingDays } from "@/utils/holidays";
import { sendLeaveNotification } from "@/utils/sendLeaveNotification";

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

export default function LeaveApplication() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/portal/login");
  }, [user, loading, navigate]);

  // Load public holidays from database on mount
  const [holidaysReady, setHolidaysReady] = useState(false);
  useEffect(() => {
    loadHolidaysFromDB().then(() => setHolidaysReady(true));
  }, []);

  // Fetch staff profile for the logged-in user
  const { data: staffProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["my_staff_profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select(`
          id, full_name, email, employee_number, department_id, position_id,
          date_joined,
          departments:department_id(name),
          positions:position_id(title)
        `)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch leave settings
  const { data: leaveSettings = [] } = useQuery({
    queryKey: ["leave_settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("leave_settings")
        .select("*")
        .order("leave_type");
      if (error) throw error;
      return data;
    },
  });

  // Fetch leave balances for this employee
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

  // Fetch last approved leave
  const { data: lastLeave } = useQuery({
    queryKey: ["my_last_leave", staffProfile?.id],
    enabled: !!staffProfile,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("leave_applications")
        .select("end_date")
        .eq("employee_id", staffProfile!.id)
        .eq("status", "approved")
        .order("end_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch all staff members for H.o.D and Executive Director selection
  const { data: staffMembers = [] } = useQuery<StaffMember[]>({
    queryKey: ["staff_members_for_approvers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select(`
          id, full_name, email, user_id, department_id, position_id,
          departments:department_id(name),
          positions:position_id(title)
        `)
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return data as StaffMember[];
    },
  });

  // Form state
  const [leaveType, setLeaveType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState("");
  const [requestedDays, setRequestedDays] = useState<number>(1);
  const [leaveAddress, setLeaveAddress] = useState("");
  const [hodId, setHodId] = useState("");
  const [executiveDirectorId, setExecutiveDirectorId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auto-calculate end date (excludes weekends + Zambian public holidays)
  const endDate = useMemo(() => {
    if (!startDate || requestedDays < 1) return "";
    const start = new Date(startDate);
    let daysToAdd = requestedDays - 1;
    let current = new Date(start);
    // Skip forward if start itself is a non-working day
    while (isNonWorkingDay(current)) {
      current.setDate(current.getDate() + 1);
    }
    while (daysToAdd > 0) {
      current.setDate(current.getDate() + 1);
      if (!isNonWorkingDay(current)) daysToAdd--;
    }
    return current.toISOString().split("T")[0];
  }, [startDate, requestedDays, holidaysReady]);

  // Calculate months since last leave
  const monthsSinceLastLeave = useMemo(() => {
    if (!lastLeave?.end_date) return null;
    const lastEnd = new Date(lastLeave.end_date);
    const now = new Date();
    const months = (now.getFullYear() - lastEnd.getFullYear()) * 12 + (now.getMonth() - lastEnd.getMonth());
    return Math.max(0, months);
  }, [lastLeave]);

  // Get current balance for selected leave type
  const currentBalance = useMemo(() => {
    const bal = balances.find((b: any) => b.leave_type === leaveType);
    return bal ? bal.days_remaining : null;
  }, [balances, leaveType]);

  // Get settings for selected leave type
  const currentSettings = useMemo(() => {
    return leaveSettings.find((s: any) => s.leave_type === leaveType);
  }, [leaveSettings, leaveType]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!staffProfile || !user) throw new Error("Staff profile not found");

      // Business rule: cannot exceed balance (for annual leave)
      if (leaveType === "annual" && currentBalance !== null && requestedDays > currentBalance) {
        throw new Error(`Insufficient leave balance. You have ${currentBalance} days remaining.`);
      }

      // Business rule: start date must be in the future
      if (new Date(startDate) <= new Date()) {
        throw new Error("Leave start date must be a future date.");
      }

      // Business rule: check overlapping dates
      const { data: overlapping } = await (supabase as any)
        .from("leave_applications")
        .select("id")
        .eq("employee_id", staffProfile.id)
        .in("status", ["pending", "recommended", "approved"])
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (overlapping && overlapping.length > 0) {
        throw new Error("You already have a leave application for overlapping dates.");
      }

      if (!hodId) throw new Error("Please select a Head of Department for approval.");
      if (!executiveDirectorId) throw new Error("Please select an Executive Director for approval.");

      // Resolve user_id (profiles.id) from staff_profiles for the foreign key
      const hodStaffProfile = staffMembers.find(s => s.id === hodId);
      const edStaffProfile = staffMembers.find(s => s.id === executiveDirectorId);

      if (!hodStaffProfile?.user_id) throw new Error("Selected H.o.D does not have a linked portal account.");
      if (!edStaffProfile?.user_id) throw new Error("Selected Executive Director does not have a linked portal account.");

      const { error } = await (supabase as any).from("leave_applications").insert({
        employee_id: staffProfile.id,
        user_id: user.id,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        requested_days: requestedDays,
        leave_address: leaveAddress || null,
        last_leave_end_date: lastLeave?.end_date || null,
        months_since_last_leave: monthsSinceLastLeave,
        leave_rate: currentSettings?.rate_per_month || 2.5,
        days_accrued: monthsSinceLastLeave !== null && currentSettings
          ? monthsSinceLastLeave * currentSettings.rate_per_month
          : null,
        leave_balance: currentBalance,
        status: "pending",
        hod_id: hodStaffProfile.user_id,
        hod_name: hodStaffProfile.full_name,
        hod_email: hodStaffProfile.email,
        executive_director_id: edStaffProfile.user_id,
        ed_name: edStaffProfile.full_name,
        ed_email: edStaffProfile.email,
      });

      if (error) throw error;

      // Send email to applicant: your leave is pending
      const emailBase = {
        applicant_name: staffProfile.full_name,
        leave_type: LEAVE_TYPE_LABELS[leaveType],
        start_date: startDate,
        end_date: endDate,
        requested_days: requestedDays,
      };

      try {
        // Notify applicant
        await sendLeaveNotification({
          ...emailBase,
          notification_type: "submitted",
          recipients: [
            { name: staffProfile.full_name, email: staffProfile.email, role: "Applicant" },
          ],
        });

        // Notify H.o.D only (ED gets notified after H.o.D recommends)
        await sendLeaveNotification({
          ...emailBase,
          notification_type: "submitted_approver",
          recipients: [
            { name: hodStaffProfile.full_name, email: hodStaffProfile.email, role: "Head of Department" },
          ],
        });
      } catch {
        console.warn("Email notification could not be sent.");
      }
    },
    onSuccess: () => {
      toast.success("Leave application submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["my_leave_applications"] });
      navigate("/portal/leave");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || requestedDays < 1) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!hodId) {
      toast.error("Please select a Head of Department for approval");
      return;
    }
    if (!executiveDirectorId) {
      toast.error("Please select an Executive Director for approval");
      return;
    }
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
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3">Leave Management</p>
            <h1 className="font-display text-3xl font-bold mb-2">Apply for Leave</h1>
            <p className="text-muted-foreground">Complete the form below to submit your leave application.</p>
          </div>

          {/* No staff profile warning */}
          {!profileLoading && !staffProfile && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800">Staff Profile Required</h3>
                  <p className="text-sm text-red-600 mt-1">
                    You must have a linked staff profile to apply for leave. Please contact HR/Admin to set up your profile.
                  </p>
                </div>
              </div>
            </div>
          )}

          {staffProfile && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Part I - Personal & Employment Details (Auto-filled) */}
              <div className="bg-noir-elevated border border-border rounded-sm p-6">
                <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Part I — Personal & Employment Details
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <ReadOnlyField label="Name" value={staffProfile.full_name} />
                  <ReadOnlyField label="Employee No." value={staffProfile.employee_number || "—"} />
                  <ReadOnlyField label="Department" value={(staffProfile as any).departments?.name || "—"} />
                  <ReadOnlyField label="Position" value={(staffProfile as any).positions?.title || "—"} />
                  <ReadOnlyField label="Last Leave Ended" value={lastLeave?.end_date || "No previous leave"} />
                  <ReadOnlyField
                    label="Months Since Last Leave"
                    value={monthsSinceLastLeave !== null ? `${monthsSinceLastLeave} months` : "N/A"}
                  />
                </div>
              </div>

              {/* Leave Balance Summary */}
              {balances.length > 0 && (
                <div className="bg-noir-elevated border border-border rounded-sm p-6">
                  <h2 className="font-display text-lg font-bold mb-4">Leave Balance Summary</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {balances.map((bal: any) => (
                      <div key={bal.id} className="border border-border rounded-sm p-3 text-center">
                        <p className="text-xl font-bold text-primary">{bal.days_remaining}</p>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
                          {LEAVE_TYPE_LABELS[bal.leave_type as LeaveType]?.replace(" Leave", "") || bal.leave_type}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Part I - Leave Application Details */}
              <div className="bg-noir-elevated border border-border rounded-sm p-6">
                <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Leave Application Details
                </h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  {/* Leave Type */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                      Leave Type *
                    </label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-sm"
                    >
                      {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Requested Days */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                      Number of Days *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={requestedDays}
                      onChange={(e) => setRequestedDays(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-sm"
                    />
                    {currentBalance !== null && leaveType === "annual" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Balance: <span className="text-primary font-semibold">{currentBalance} days</span>
                      </p>
                    )}
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

                  {/* End Date (Auto-calculated) */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                      Duty Resumed On (Auto)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      readOnly
                      className="w-full px-4 py-3 bg-muted border border-border rounded-sm text-sm cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated (excludes weekends &amp; public holidays)</p>
                  </div>

                  {/* Leave Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                      Address During Leave
                    </label>
                    <textarea
                      value={leaveAddress}
                      onChange={(e) => setLeaveAddress(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-sm resize-none"
                      placeholder="Where you can be reached during leave..."
                    />
                  </div>
                </div>

                {/* Attachment notice */}
                {currentSettings?.requires_attachment && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-sm p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>Note:</strong> {LEAVE_TYPE_LABELS[leaveType]} requires a supporting document (e.g. medical certificate).
                      Please submit the attachment to HR after applying.
                    </p>
                  </div>
                )}
              </div>

              {/* Part II - Approval Routing */}
              <div className="bg-noir-elevated border border-border rounded-sm p-6">
                <h2 className="font-display text-lg font-bold mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Approval Routing
                </h2>
                <p className="text-xs text-muted-foreground mb-5">
                  Select the H.o.D and Executive Director who will review your leave application. They will be notified by email.
                </p>
                <div className="grid sm:grid-cols-2 gap-5">
                  <SearchableStaffSelect
                    label="Head of Department (H.o.D) *"
                    placeholder="Search H.o.D by name or email..."
                    staffMembers={staffMembers}
                    selectedId={hodId}
                    onSelect={setHodId}
                    excludeId={executiveDirectorId}
                  />
                  <SearchableStaffSelect
                    label="Executive Director *"
                    placeholder="Search Executive Director by name or email..."
                    staffMembers={staffMembers}
                    selectedId={executiveDirectorId}
                    onSelect={setExecutiveDirectorId}
                    excludeId={hodId}
                  />
                </div>
              </div>

              {/* Validation warnings */}
              {leaveType === "annual" && currentBalance !== null && requestedDays > currentBalance && (
                <div className="bg-red-50 border border-red-200 rounded-sm p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">
                    Requested days ({requestedDays}) exceed your available balance ({currentBalance} days).
                    Please reduce the number of days.
                  </p>
                </div>
              )}

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
                  disabled={submitting || !startDate || requestedDays < 1 || !hodId || !executiveDirectorId}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Submitting…" : "Submit Application"}
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

function SearchableStaffSelect({
  label,
  placeholder,
  staffMembers,
  selectedId,
  onSelect,
  excludeId,
}: {
  label: string;
  placeholder: string;
  staffMembers: StaffMember[];
  selectedId: string;
  onSelect: (id: string) => void;
  excludeId?: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedStaff = staffMembers.find(s => s.id === selectedId);

  // Filter staff: match search term and exclude the other selected approver
  const filtered = staffMembers.filter(s => {
    if (excludeId && s.id === excludeId) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          className="w-full px-4 py-3 pr-10 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
          placeholder={placeholder}
          value={isOpen ? searchTerm : (selectedStaff ? `${selectedStaff.full_name} (${selectedStaff.email})` : "")}
          onChange={e => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setSearchTerm("");
            setIsOpen(true);
          }}
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>

      {selectedStaff && !isOpen && (
        <p className="text-xs text-muted-foreground mt-1">
          {(selectedStaff as any).departments?.name || "No dept."} · {(selectedStaff as any).positions?.title || "No position"}
        </p>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-sm shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-4 text-sm text-muted-foreground text-center">
              No staff members found
            </div>
          ) : (
            filtered.map(staff => (
              <div
                key={staff.id}
                className={`px-4 py-3 text-sm hover:bg-primary/5 cursor-pointer border-b border-border/50 last:border-0 ${
                  staff.id === selectedId ? "bg-primary/10" : ""
                }`}
                onClick={() => {
                  onSelect(staff.id);
                  setSearchTerm("");
                  setIsOpen(false);
                }}
              >
                <div className="font-medium">{staff.full_name}</div>
                <div className="text-xs text-muted-foreground">
                  {staff.email} · {(staff as any).departments?.name || "—"} · {(staff as any).positions?.title || "—"}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
