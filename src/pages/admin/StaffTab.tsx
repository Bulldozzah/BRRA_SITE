import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";

type StaffProfile = {
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

type Dept = { id: string; name: string };
type Pos = { id: string; title: string; department_id: string | null };
type Grade = { id: string; name: string };
type Profile = { id: string; full_name: string; email: string };

const blankForm = {
  full_name: "", email: "", phone: "", employee_number: "",
  department_id: "", position_id: "", grade_id: "",
  date_joined: "", is_active: true, notes: "", user_id: "",
};

export default function StaffTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(blankForm);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id, user_id, full_name, email, phone, employee_number, department_id, position_id, grade_id, date_joined, is_active, notes")
        .order("full_name");
      if (error) throw error;
      return data as StaffProfile[];
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

  const { data: profiles = [] } = useQuery<Profile[]>({
    queryKey: ["profiles_list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const lookup = {
    dept: (id: string | null) => departments.find(d => d.id === id)?.name ?? "—",
    pos: (id: string | null) => positions.find(p => p.id === id)?.title ?? "—",
    grade: (id: string | null) => grades.find(g => g.id === id)?.name ?? "—",
  };

  const toPayload = (f: typeof blankForm) => ({
    full_name: f.full_name.trim(),
    email: f.email.trim(),
    phone: f.phone.trim() || null,
    employee_number: f.employee_number.trim() || null,
    department_id: f.department_id || null,
    position_id: f.position_id || null,
    grade_id: f.grade_id || null,
    date_joined: f.date_joined || null,
    is_active: f.is_active,
    notes: f.notes.trim() || null,
    user_id: f.user_id || null,
  });

  const addMutation = useMutation({
    mutationFn: async (f: typeof blankForm) => {
      const { error } = await supabase.from("staff_profiles").insert({ ...toPayload(f), created_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff_profiles"] });
      setForm(blankForm);
      setShowAdd(false);
      toast.success("Staff profile created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: typeof blankForm }) => {
      const { error } = await supabase.from("staff_profiles").update(toPayload(f)).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff_profiles"] });
      setEditId(null);
      toast.success("Staff profile updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff_profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff_profiles"] });
      toast.success("Staff profile deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (s: StaffProfile) => {
    setEditId(s.id);
    setExpanded(null);
    setEditForm({
      full_name: s.full_name, email: s.email, phone: s.phone ?? "",
      employee_number: s.employee_number ?? "", department_id: s.department_id ?? "",
      position_id: s.position_id ?? "", grade_id: s.grade_id ?? "",
      date_joined: s.date_joined ?? "", is_active: s.is_active,
      notes: s.notes ?? "", user_id: s.user_id ?? "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Staff Profiles</h2>
          <p className="text-sm text-muted-foreground mt-1">{staff.length} staff member{staff.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); setEditId(null); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-gold text-primary-foreground text-xs font-semibold uppercase tracking-wider rounded-sm hover:shadow-gold transition-all"
        >
          {showAdd ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showAdd ? "Cancel" : "Add Staff"}
        </button>
      </div>

      {showAdd && (
        <StaffForm
          form={form}
          setForm={setForm}
          departments={departments}
          positions={positions}
          grades={grades}
          profiles={profiles}
          onSubmit={() => addMutation.mutate(form)}
          isPending={addMutation.isPending}
          label="Create Staff Profile"
        />
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
      ) : staff.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No staff profiles yet.</p>
      ) : (
        <div className="space-y-2">
          {staff.map(s => (
            <div key={s.id} className="border border-border rounded-sm overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-3 bg-noir-elevated/30 hover:bg-noir-elevated/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium text-sm">{s.full_name}</span>
                    {s.employee_number && (
                      <span className="text-xs font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded-sm">{s.employee_number}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-sm ${s.is_active ? "bg-green-500/20 text-green-400" : "bg-destructive/20 text-destructive"}`}>
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.email} · {lookup.dept(s.department_id)} · {lookup.pos(s.position_id)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(s)} className="p-1.5 rounded-sm hover:bg-border transition-colors" title="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { if (confirm("Delete this staff profile?")) deleteMutation.mutate(s.id); }} className="p-1.5 rounded-sm hover:bg-border transition-colors" title="Delete">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                  <button onClick={() => setExpanded(expanded === s.id ? null : s.id)} className="p-1.5 rounded-sm hover:bg-border transition-colors" title="Details">
                    {expanded === s.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {expanded === s.id && editId !== s.id && (
                <div className="px-4 py-4 bg-background border-t border-border grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <Detail label="Grade" value={lookup.grade(s.grade_id)} />
                  <Detail label="Phone" value={s.phone} />
                  <Detail label="Date Joined" value={s.date_joined} />
                  <Detail label="Notes" value={s.notes} />
                </div>
              )}

              {editId === s.id && (
                <div className="border-t border-border p-4 bg-background">
                  <StaffForm
                    form={editForm}
                    setForm={setEditForm}
                    departments={departments}
                    positions={positions}
                    grades={grades}
                    profiles={profiles}
                    onSubmit={() => updateMutation.mutate({ id: s.id, f: editForm })}
                    onCancel={() => setEditId(null)}
                    isPending={updateMutation.isPending}
                    label="Update Staff Profile"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <span className="font-mono uppercase tracking-wider text-muted-foreground text-[10px]">{label}</span>
      <p className="text-foreground mt-0.5">{value ?? "—"}</p>
    </div>
  );
}

function StaffForm({
  form, setForm, departments, positions, grades, profiles,
  onSubmit, onCancel, isPending, label,
}: {
  form: typeof blankForm;
  setForm: React.Dispatch<React.SetStateAction<typeof blankForm>>;
  departments: Dept[];
  positions: Pos[];
  grades: Grade[];
  profiles: Profile[];
  onSubmit: () => void;
  onCancel?: () => void;
  isPending: boolean;
  label: string;
}) {
  const cls = "w-full px-3 py-2 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary";
  const filteredPositions = form.department_id
    ? positions.filter(p => !p.department_id || p.department_id === form.department_id)
    : positions;

  return (
    <div className="border border-primary/40 bg-noir-elevated/60 rounded-sm p-6 space-y-4">
      <p className="text-xs font-mono uppercase tracking-wider text-primary">{label}</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <F label="Full Name *" value={form.full_name} onChange={v => setForm(f => ({ ...f, full_name: v }))} />
        <F label="Email *" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" />
        <F label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
        <F label="Employee Number" value={form.employee_number} onChange={v => setForm(f => ({ ...f, employee_number: v }))} />
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-1.5">Department</label>
          <select className={cls} value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value, position_id: "" }))}>
            <option value="">— None —</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-1.5">Position</label>
          <select className={cls} value={form.position_id} onChange={e => setForm(f => ({ ...f, position_id: e.target.value }))}>
            <option value="">— None —</option>
            {filteredPositions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-1.5">Grade</label>
          <select className={cls} value={form.grade_id} onChange={e => setForm(f => ({ ...f, grade_id: e.target.value }))}>
            <option value="">— None —</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <F label="Date Joined" value={form.date_joined} onChange={v => setForm(f => ({ ...f, date_joined: v }))} type="date" />
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-1.5">Link to Portal User</label>
          <select className={cls} value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}>
            <option value="">— Not linked —</option>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active_check"
          checked={form.is_active}
          onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
          className="rounded"
        />
        <label htmlFor="is_active_check" className="text-xs font-mono uppercase tracking-wider text-primary">Active</label>
      </div>
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-1.5">Notes</label>
        <textarea rows={2} className={cls} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>
      <div className="flex gap-3">
        <button
          onClick={onSubmit}
          disabled={!form.full_name.trim() || !form.email.trim() || isPending}
          className="px-5 py-2 bg-gradient-gold text-primary-foreground text-xs font-semibold uppercase tracking-wider rounded-sm disabled:opacity-50"
        >
          {isPending ? "Saving…" : label}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="px-5 py-2 border border-border text-xs font-semibold uppercase tracking-wider rounded-sm hover:border-primary transition-colors">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function F({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-1.5">{label}</label>
      <input type={type} className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
