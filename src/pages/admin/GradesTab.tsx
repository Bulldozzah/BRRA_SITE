import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

type Grade = {
  id: string;
  name: string;
  level: number | null;
  description: string | null;
  created_at: string;
};

const blank = { name: "", level: "", description: "" };

export default function GradesTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState(blank);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(blank);

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ["grades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("id, name, level, description, created_at")
        .order("level", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as Grade[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload: typeof blank) => {
      const { error } = await supabase.from("grades").insert({
        name: payload.name.trim(),
        level: payload.level ? parseInt(payload.level) : null,
        description: payload.description.trim() || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grades"] });
      setForm(blank);
      setShowAdd(false);
      toast.success("Grade created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: typeof blank }) => {
      const { error } = await supabase.from("grades").update({
        name: payload.name.trim(),
        level: payload.level ? parseInt(payload.level) : null,
        description: payload.description.trim() || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grades"] });
      setEditId(null);
      toast.success("Grade updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("grades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grades"] });
      toast.success("Grade deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (g: Grade) => {
    setEditId(g.id);
    setEditForm({ name: g.name, level: g.level != null ? String(g.level) : "", description: g.description ?? "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Grades</h2>
          <p className="text-sm text-muted-foreground mt-1">{grades.length} grade{grades.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); setEditId(null); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-gold text-primary-foreground text-xs font-semibold uppercase tracking-wider rounded-sm hover:shadow-gold transition-all"
        >
          {showAdd ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showAdd ? "Cancel" : "Add Grade"}
        </button>
      </div>

      {showAdd && (
        <div className="border border-primary/40 bg-noir-elevated/60 rounded-sm p-6 space-y-4">
          <p className="text-xs font-mono uppercase tracking-wider text-primary">New Grade</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <Field label="Level (number)" value={form.level} onChange={v => setForm(f => ({ ...f, level: v }))} type="number" />
          </div>
          <Field label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} textarea />
          <button
            onClick={() => addMutation.mutate(form)}
            disabled={!form.name.trim() || addMutation.isPending}
            className="px-5 py-2 bg-gradient-gold text-primary-foreground text-xs font-semibold uppercase tracking-wider rounded-sm disabled:opacity-50"
          >
            {addMutation.isPending ? "Saving…" : "Save Grade"}
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
      ) : grades.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No grades yet.</p>
      ) : (
        <div className="border border-border rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-noir-elevated/60 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Level</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Description</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {grades.map(g => (
                <tr key={g.id} className="hover:bg-noir-elevated/30 transition-colors">
                  {editId === g.id ? (
                    <>
                      <td className="px-4 py-2"><input className={inputCls} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></td>
                      <td className="px-4 py-2"><input type="number" className={inputCls} value={editForm.level} onChange={e => setEditForm(f => ({ ...f, level: e.target.value }))} /></td>
                      <td className="px-4 py-2 hidden md:table-cell"><input className={inputCls} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} /></td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1 justify-end">
                          <IconBtn onClick={() => updateMutation.mutate({ id: g.id, payload: editForm })} title="Save"><Check className="h-3.5 w-3.5 text-green-500" /></IconBtn>
                          <IconBtn onClick={() => setEditId(null)} title="Cancel"><X className="h-3.5 w-3.5" /></IconBtn>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{g.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{g.level ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell truncate max-w-xs">{g.description ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <IconBtn onClick={() => startEdit(g)} title="Edit"><Pencil className="h-3.5 w-3.5" /></IconBtn>
                          <IconBtn onClick={() => { if (confirm("Delete this grade?")) deleteMutation.mutate(g.id); }} title="Delete"><Trash2 className="h-3.5 w-3.5 text-destructive" /></IconBtn>
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

function Field({ label, value, onChange, textarea, type = "text" }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean; type?: string }) {
  const cls = "w-full px-3 py-2 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary";
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-1.5">{label}</label>
      {textarea
        ? <textarea rows={2} className={cls} value={value} onChange={e => onChange(e.target.value)} />
        : <input type={type} className={cls} value={value} onChange={e => onChange(e.target.value)} />}
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
