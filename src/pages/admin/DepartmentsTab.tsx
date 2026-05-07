import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

type Department = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  created_at: string;
};

const blank = { name: "", code: "", description: "" };

export default function DepartmentsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState(blank);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(blank);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name, code, description, created_at")
        .order("name");
      if (error) throw error;
      return data as Department[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload: typeof blank) => {
      const { error } = await supabase.from("departments").insert({
        name: payload.name.trim(),
        code: payload.code.trim() || null,
        description: payload.description.trim() || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      setForm(blank);
      setShowAdd(false);
      toast.success("Department created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: typeof blank }) => {
      const { error } = await supabase.from("departments").update({
        name: payload.name.trim(),
        code: payload.code.trim() || null,
        description: payload.description.trim() || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      setEditId(null);
      toast.success("Department updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("departments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (d: Department) => {
    setEditId(d.id);
    setEditForm({ name: d.name, code: d.code ?? "", description: d.description ?? "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Departments</h2>
          <p className="text-sm text-muted-foreground mt-1">{departments.length} department{departments.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); setEditId(null); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-gold text-primary-foreground text-xs font-semibold uppercase tracking-wider rounded-sm hover:shadow-gold transition-all"
        >
          {showAdd ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showAdd ? "Cancel" : "Add Department"}
        </button>
      </div>

      {showAdd && (
        <div className="border border-primary/40 bg-noir-elevated/60 rounded-sm p-6 space-y-4">
          <p className="text-xs font-mono uppercase tracking-wider text-primary">New Department</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <Field label="Code" value={form.code} onChange={v => setForm(f => ({ ...f, code: v }))} />
          </div>
          <Field label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} textarea />
          <button
            onClick={() => addMutation.mutate(form)}
            disabled={!form.name.trim() || addMutation.isPending}
            className="px-5 py-2 bg-gradient-gold text-primary-foreground text-xs font-semibold uppercase tracking-wider rounded-sm disabled:opacity-50"
          >
            {addMutation.isPending ? "Saving…" : "Save Department"}
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
      ) : departments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No departments yet.</p>
      ) : (
        <div className="border border-border rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-noir-elevated/60 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Code</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Description</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {departments.map(d => (
                <tr key={d.id} className="hover:bg-noir-elevated/30 transition-colors">
                  {editId === d.id ? (
                    <>
                      <td className="px-4 py-2"><input className={inputCls} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></td>
                      <td className="px-4 py-2"><input className={inputCls} value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))} /></td>
                      <td className="px-4 py-2 hidden md:table-cell"><input className={inputCls} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} /></td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1 justify-end">
                          <IconBtn onClick={() => updateMutation.mutate({ id: d.id, payload: editForm })} title="Save"><Check className="h-3.5 w-3.5 text-green-500" /></IconBtn>
                          <IconBtn onClick={() => setEditId(null)} title="Cancel"><X className="h-3.5 w-3.5" /></IconBtn>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{d.code ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell truncate max-w-xs">{d.description ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <IconBtn onClick={() => startEdit(d)} title="Edit"><Pencil className="h-3.5 w-3.5" /></IconBtn>
                          <IconBtn onClick={() => { if (confirm("Delete this department?")) deleteMutation.mutate(d.id); }} title="Delete"><Trash2 className="h-3.5 w-3.5 text-destructive" /></IconBtn>
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

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button title={title} onClick={onClick} className="p-1.5 rounded-sm hover:bg-border transition-colors">
      {children}
    </button>
  );
}
