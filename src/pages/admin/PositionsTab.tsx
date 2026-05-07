import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

type Position = {
  id: string;
  title: string;
  department_id: string | null;
  description: string | null;
  created_at: string;
};

type Department = { id: string; name: string };

const blank = { title: "", department_id: "", description: "" };

export default function PositionsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState(blank);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(blank);

  const { data: positions = [], isLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("id, title, department_id, description, created_at")
        .order("title");
      if (error) throw error;
      return data as Position[];
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("id, name").order("name");
      if (error) throw error;
      return data as Department[];
    },
  });

  const deptName = (id: string | null) => departments.find(d => d.id === id)?.name ?? "—";

  const addMutation = useMutation({
    mutationFn: async (payload: typeof blank) => {
      const { error } = await supabase.from("positions").insert({
        title: payload.title.trim(),
        department_id: payload.department_id || null,
        description: payload.description.trim() || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["positions"] });
      setForm(blank);
      setShowAdd(false);
      toast.success("Position created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: typeof blank }) => {
      const { error } = await supabase.from("positions").update({
        title: payload.title.trim(),
        department_id: payload.department_id || null,
        description: payload.description.trim() || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["positions"] });
      setEditId(null);
      toast.success("Position updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("positions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["positions"] });
      toast.success("Position deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (p: Position) => {
    setEditId(p.id);
    setEditForm({ title: p.title, department_id: p.department_id ?? "", description: p.description ?? "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Positions</h2>
          <p className="text-sm text-muted-foreground mt-1">{positions.length} position{positions.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); setEditId(null); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-gold text-primary-foreground text-xs font-semibold uppercase tracking-wider rounded-sm hover:shadow-gold transition-all"
        >
          {showAdd ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showAdd ? "Cancel" : "Add Position"}
        </button>
      </div>

      {showAdd && (
        <div className="border border-primary/40 bg-noir-elevated/60 rounded-sm p-6 space-y-4">
          <p className="text-xs font-mono uppercase tracking-wider text-primary">New Position</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Title *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} />
            <SelectField
              label="Department"
              value={form.department_id}
              onChange={v => setForm(f => ({ ...f, department_id: v }))}
              options={departments}
            />
          </div>
          <Field label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} textarea />
          <button
            onClick={() => addMutation.mutate(form)}
            disabled={!form.title.trim() || addMutation.isPending}
            className="px-5 py-2 bg-gradient-gold text-primary-foreground text-xs font-semibold uppercase tracking-wider rounded-sm disabled:opacity-50"
          >
            {addMutation.isPending ? "Saving…" : "Save Position"}
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
      ) : positions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No positions yet.</p>
      ) : (
        <div className="border border-border rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-noir-elevated/60 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Department</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Description</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {positions.map(p => (
                <tr key={p.id} className="hover:bg-noir-elevated/30 transition-colors">
                  {editId === p.id ? (
                    <>
                      <td className="px-4 py-2"><input className={inputCls} value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} /></td>
                      <td className="px-4 py-2">
                        <select className={inputCls} value={editForm.department_id} onChange={e => setEditForm(f => ({ ...f, department_id: e.target.value }))}>
                          <option value="">— None —</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2 hidden md:table-cell"><input className={inputCls} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} /></td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1 justify-end">
                          <IconBtn onClick={() => updateMutation.mutate({ id: p.id, payload: editForm })} title="Save"><Check className="h-3.5 w-3.5 text-green-500" /></IconBtn>
                          <IconBtn onClick={() => setEditId(null)} title="Cancel"><X className="h-3.5 w-3.5" /></IconBtn>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{p.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{deptName(p.department_id)}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell truncate max-w-xs">{p.description ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <IconBtn onClick={() => startEdit(p)} title="Edit"><Pencil className="h-3.5 w-3.5" /></IconBtn>
                          <IconBtn onClick={() => { if (confirm("Delete this position?")) deleteMutation.mutate(p.id); }} title="Delete"><Trash2 className="h-3.5 w-3.5 text-destructive" /></IconBtn>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full px-2 py-1 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary";

function Field({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  const cls = "w-full px-3 py-2 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary";
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-1.5">{label}</label>
      {textarea
        ? <textarea rows={2} className={cls} value={value} onChange={e => onChange(e.target.value)} />
        : <input type="text" className={cls} value={value} onChange={e => onChange(e.target.value)} />}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Department[] }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-1.5">{label}</label>
      <select
        className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">— None —</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button title={title} onClick={onClick} className="p-1.5 rounded-sm hover:bg-border transition-colors">
      {children}
    </button>
  );
}
