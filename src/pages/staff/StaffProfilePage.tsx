import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import StaffLayout from "@/components/layout/StaffLayout";
import { toast } from "sonner";
import { UserCircle, Save, AlertCircle, CheckCircle2 } from "lucide-react";

type Dept = { id: string; name: string };
type Pos = { id: string; title: string; department_id: string | null };
type Grade = { id: string; name: string };

type StaffProfileData = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  employee_number: string | null;
  department_id: string | null;
  position_id: string | null;
  grade_id: string | null;
  date_joined: string | null;
  is_active: boolean;
  notes: string | null;
};

export default function StaffProfilePage() {
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
    <StaffLayout activeTab="profile">
      <StaffProfileForm />
    </StaffLayout>
  );
}

function StaffProfileForm() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const cls = "w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500";

  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", employee_number: "",
    department_id: "", position_id: "", grade_id: "",
    date_joined: "", notes: "",
  });

  // Fetch staff profile linked to this user
  const { data: staffProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["my_staff_profile_full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as StaffProfileData | null;
    },
  });

  const { data: departments = [] } = useQuery<Dept[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: positions = [] } = useQuery<Pos[]>({
    queryKey: ["positions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("positions").select("id, title, department_id").order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ["grades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grades").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Populate form when staff profile loads
  useEffect(() => {
    if (staffProfile) {
      setForm({
        full_name: staffProfile.full_name || "",
        email: staffProfile.email || "",
        phone: staffProfile.phone || "",
        employee_number: staffProfile.employee_number || "",
        department_id: staffProfile.department_id || "",
        position_id: staffProfile.position_id || "",
        grade_id: staffProfile.grade_id || "",
        date_joined: staffProfile.date_joined || "",
        notes: staffProfile.notes || "",
      });
    }
  }, [staffProfile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!staffProfile) throw new Error("No staff profile found");
      const { error } = await supabase
        .from("staff_profiles")
        .update({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          employee_number: form.employee_number.trim() || null,
          department_id: form.department_id || null,
          position_id: form.position_id || null,
          grade_id: form.grade_id || null,
          date_joined: form.date_joined || null,
          notes: form.notes.trim() || null,
        })
        .eq("id", staffProfile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my_staff_profile_full"] });
      qc.invalidateQueries({ queryKey: ["my_staff_profile"] });
      qc.invalidateQueries({ queryKey: ["staff_profiles"] });
      toast.success("Profile updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredPositions = form.department_id
    ? positions.filter(p => !p.department_id || p.department_id === form.department_id)
    : positions;

  const isProfileIncomplete = !staffProfile?.phone || !staffProfile?.department_id || !staffProfile?.position_id;

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (!staffProfile) {
    return (
      <div className="max-w-lg mx-auto py-20">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">No Staff Profile Found</h3>
          <p className="text-sm text-red-600">
            Your account has not been linked to a staff profile yet. Please contact your administrator to set up your staff profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 mb-2">Staff Portal</p>
          <h2 className="text-3xl font-bold text-gray-900">My Profile</h2>
          <p className="text-gray-600 mt-1">View and update your staff profile information.</p>
        </div>
        {staffProfile.is_active ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" /> Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold">
            <AlertCircle className="h-3.5 w-3.5" /> Inactive
          </span>
        )}
      </div>

      {/* Incomplete banner */}
      {isProfileIncomplete && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-amber-800">Profile Incomplete</h4>
            <p className="text-sm text-amber-700 mt-0.5">
              Please complete your profile to access all staff features. Fill in your phone, department, and position.
            </p>
          </div>
        </div>
      )}

      {/* Profile form */}
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {/* Personal Info */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-amber-600" />
            Personal Information
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Full Name *</label>
              <input
                type="text"
                className={cls}
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Email *</label>
              <input
                type="email"
                className={cls}
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone *</label>
              <input
                type="text"
                className={cls}
                placeholder="Enter your phone number"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Employee Number</label>
              <input
                type="text"
                className={cls}
                placeholder="Enter your employee number"
                value={form.employee_number}
                onChange={e => setForm(f => ({ ...f, employee_number: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Work Info */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-amber-600" />
            Work Information
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Department *</label>
              <select
                className={cls}
                value={form.department_id}
                onChange={e => setForm(f => ({ ...f, department_id: e.target.value, position_id: "" }))}
              >
                <option value="">— Select —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Position *</label>
              <select
                className={cls}
                value={form.position_id}
                onChange={e => setForm(f => ({ ...f, position_id: e.target.value }))}
              >
                <option value="">— Select —</option>
                {filteredPositions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Grade</label>
              <select
                className={cls}
                value={form.grade_id}
                onChange={e => setForm(f => ({ ...f, grade_id: e.target.value }))}
              >
                <option value="">— Select —</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Date Joined</label>
              <input
                type="date"
                className={cls}
                value={form.date_joined}
                onChange={e => setForm(f => ({ ...f, date_joined: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Additional Notes</h3>
          <textarea
            rows={3}
            className={cls}
            placeholder="Any additional information…"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 flex items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            Fields marked with * are required for profile completion.
          </p>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={!form.full_name.trim() || !form.email.trim() || updateMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors text-sm disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
