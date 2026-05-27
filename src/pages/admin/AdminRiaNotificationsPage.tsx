import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { toast } from "sonner";
import { Plus, Trash2, Mail, Search, ToggleLeft, ToggleRight, X } from "lucide-react";

type Recipient = {
  id: string;
  staff_profile_id: string | null;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

type StaffMember = {
  id: string;
  full_name: string;
  email: string;
};

export default function AdminRiaNotificationsPage() {
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
    <AdminLayout activeTab="ria-notifications">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">RIA Request Notifications</h2>
          <p className="text-gray-600 mt-1">
            Manage staff who receive an email notification when a public user submits a RIA permission request.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <RiaNotificationsTab />
        </div>
      </div>
    </AdminLayout>
  );
}

function RiaNotificationsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [addMode, setAddMode] = useState<"staff" | "manual">("staff");
  const [search, setSearch] = useState("");

  const { data: recipients = [], isLoading } = useQuery<Recipient[]>({
    queryKey: ["ria_notification_recipients"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ria_notification_recipients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: staffMembers = [] } = useQuery<StaffMember[]>({
    queryKey: ["staff_members_simple"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id, full_name, email")
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return data as StaffMember[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload: { staff_profile_id: string | null; name: string; email: string }) => {
      const { error } = await (supabase as any)
        .from("ria_notification_recipients")
        .insert({ ...payload, added_by: user?.id, is_active: true });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ria_notification_recipients"] });
      setShowAdd(false);
      setSelectedStaff(null);
      setManualName("");
      setManualEmail("");
      setStaffSearch("");
      toast.success("Recipient added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from("ria_notification_recipients")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ria_notification_recipients"] });
      toast.success("Recipient updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("ria_notification_recipients")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ria_notification_recipients"] });
      toast.success("Recipient removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleAdd = () => {
    if (addMode === "staff") {
      if (!selectedStaff) { toast.error("Please select a staff member."); return; }
      const alreadyExists = recipients.some(r => r.email === selectedStaff.email);
      if (alreadyExists) { toast.error("This staff member is already in the notification list."); return; }
      addMutation.mutate({ staff_profile_id: selectedStaff.id, name: selectedStaff.full_name, email: selectedStaff.email });
    } else {
      if (!manualName.trim() || !manualEmail.trim()) { toast.error("Name and email are required."); return; }
      const alreadyExists = recipients.some(r => r.email === manualEmail.trim());
      if (alreadyExists) { toast.error("This email is already in the notification list."); return; }
      addMutation.mutate({ staff_profile_id: null, name: manualName.trim(), email: manualEmail.trim() });
    }
  };

  const filteredStaff = staffMembers.filter(s =>
    s.full_name.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(staffSearch.toLowerCase())
  );

  const filteredRecipients = recipients.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = recipients.filter(r => r.is_active).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex items-center gap-3 text-sm flex-wrap">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          <span className="text-amber-700 font-semibold">{recipients.length}</span>
          <span className="text-amber-600 ml-1">total recipients</span>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          <span className="text-green-700 font-semibold">{activeCount}</span>
          <span className="text-green-600 ml-1">active (will be emailed)</span>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
          <span className="text-gray-700 font-semibold">{recipients.length - activeCount}</span>
          <span className="text-gray-500 ml-1">inactive</span>
        </div>
      </div>

      {/* Info note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Mail className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold">How this works</p>
          <p className="mt-0.5 text-blue-700">
            When a public user submits a "Request to Submit RIA", all <strong>active</strong> recipients below will receive
            an email notification. They can then review and approve/reject the request from the
            <strong> RIA Management → Submission Requests</strong> section on the staff dashboard.
          </p>
        </div>
      </div>

      {/* Add recipient */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Notification Recipients</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors"
        >
          {showAdd ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showAdd ? "Cancel" : "Add Recipient"}
        </button>
      </div>

      {showAdd && (
        <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-5 space-y-4">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Add New Recipient</p>

          {/* Toggle add mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setAddMode("staff")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${addMode === "staff" ? "bg-amber-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-amber-300"}`}
            >
              Select from Staff
            </button>
            <button
              onClick={() => setAddMode("manual")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${addMode === "manual" ? "bg-amber-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-amber-300"}`}
            >
              Enter Manually
            </button>
          </div>

          {addMode === "staff" ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={(e) => { setStaffSearch(e.target.value); setSelectedStaff(null); }}
                  placeholder="Search staff by name or email..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              {staffSearch && !selectedStaff && filteredStaff.length > 0 && (
                <div className="border border-gray-200 rounded-lg bg-white max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {filteredStaff.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedStaff(s); setStaffSearch(s.full_name); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-amber-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{s.full_name}</p>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </button>
                  ))}
                </div>
              )}
              {selectedStaff && (
                <div className="flex items-center gap-3 bg-white border border-green-200 rounded-lg px-4 py-2.5">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{selectedStaff.full_name}</p>
                    <p className="text-xs text-gray-500">{selectedStaff.email}</p>
                  </div>
                  <button onClick={() => { setSelectedStaff(null); setStaffSearch(""); }} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="name@brra.org.zm"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={addMutation.isPending}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50"
          >
            {addMutation.isPending ? "Adding…" : "Add to Notification List"}
          </button>
        </div>
      )}

      {/* Search */}
      {recipients.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipients..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
      )}

      {/* Recipients list */}
      {isLoading ? (
        <p className="text-center text-gray-500 py-12 text-sm">Loading…</p>
      ) : filteredRecipients.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
          <Mail className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {recipients.length === 0
              ? "No notification recipients yet. Add staff members to notify them of new RIA requests."
              : "No recipients match your search."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">Recipient</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Added</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecipients.map((r) => (
                <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${!r.is_active ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.name}</p>
                    {!r.staff_profile_id && (
                      <span className="text-[10px] text-gray-400 italic">Manual entry</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded border ${
                      r.is_active
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    }`}>
                      {r.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleMutation.mutate({ id: r.id, is_active: !r.is_active })}
                        title={r.is_active ? "Deactivate" : "Activate"}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-500"
                      >
                        {r.is_active
                          ? <ToggleRight className="h-4 w-4 text-green-600" />
                          : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                      </button>
                      <button
                        onClick={() => { if (confirm(`Remove ${r.name} from notification list?`)) deleteMutation.mutate(r.id); }}
                        title="Remove"
                        className="p-1.5 rounded hover:bg-red-50 transition-colors text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
