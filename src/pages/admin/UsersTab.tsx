import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Shield, User, Users, Search } from "lucide-react";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: "user" | "staff" | "admin";
  created_at: string;
};

type Role = "user" | "staff" | "admin";

const roleStyles: Record<Role, string> = {
  admin: "bg-gradient-gold text-primary-foreground",
  staff: "bg-primary/20 text-primary border border-primary/40",
  user: "bg-secondary text-foreground border border-border",
};

const roleIcons: Record<Role, React.ReactNode> = {
  admin: <Shield className="h-3 w-3" />,
  staff: <Users className="h-3 w-3" />,
  user: <User className="h-3 w-3" />,
};

export default function UsersTab() {
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["all_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Role }) => {
      const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["all_profiles"] });
      toast.success(`Role updated to ${variables.role}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = profiles.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const counts = { admin: 0, staff: 0, user: 0 };
  profiles.forEach(p => counts[p.role]++);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold">User Management</h2>
        <p className="text-sm text-muted-foreground mt-1">Assign roles to registered users</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(["admin", "staff", "user"] as Role[]).map(role => (
          <div key={role} className="border border-border rounded-sm p-4 bg-noir-elevated/30">
            <p className="text-2xl font-bold font-display">{counts[role]}</p>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">{role}s</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No users found.</p>
      ) : (
        <div className="border border-border rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-noir-elevated/60 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Joined</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="px-4 py-3 w-32 text-center">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-noir-elevated/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                    {p.id === currentUser?.id && (
                      <span className="text-[10px] text-primary font-mono">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-mono rounded-sm ${roleStyles[p.role]}`}>
                      {roleIcons[p.role]}
                      {p.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={p.role}
                      disabled={p.id === currentUser?.id}
                      onChange={e => updateRoleMutation.mutate({ id: p.id, role: e.target.value as Role })}
                      className="px-2 py-1 bg-background border border-border rounded-sm text-xs focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      title={p.id === currentUser?.id ? "Cannot change your own role" : "Change role"}
                    >
                      <option value="user">user</option>
                      <option value="staff">staff</option>
                      <option value="admin">admin</option>
                    </select>
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
