import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "staff" | "user";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthCtx {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string): Promise<AppUser | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("id", uid)
        .maybeSingle();
      if (error || !data) return null;
      return { id: data.id, name: data.full_name, email: data.email, role: data.role as Role };
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Restore session on page load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (!cancelled) setUser(profile);
      }
      if (!cancelled) setLoading(false);
    });

    // IMPORTANT: Only handle sign-out here. Never make DB queries inside
    // onAuthStateChange — it causes a deadlock in supabase-js v2.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message };
      if (!data.user) return { ok: false, error: "Login failed" };

      // Fetch profile — session is now active so RLS will pass
      const profile = await fetchProfile(data.user.id);
      if (profile) {
        setUser(profile);
      } else {
        // Fallback: profile row might not exist yet (trigger delay)
        setUser({
          id: data.user.id,
          name: data.user.user_metadata?.full_name || "",
          email: data.user.email || email,
          role: "user",
        });
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || "Login failed" };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ ok: boolean; error?: string; needsEmailConfirmation?: boolean }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) return { ok: false, error: error.message };
      if (!data.user) return { ok: false, error: "Registration failed" };

      // Auto-subscribe to newsletter
      try {
        await (supabase as any).from("newsletter_subscribers").upsert(
          { user_id: data.user.id, email, name, is_subscribed: true },
          { onConflict: "email" }
        );
      } catch {
        // Non-critical - don't block registration if newsletter subscribe fails
      }

      // No session = email confirmation required
      if (!data.session) {
        return { ok: true, needsEmailConfirmation: true };
      }

      // Session active (confirmation disabled) — fetch or fallback
      const profile = await fetchProfile(data.user.id);
      setUser(profile || { id: data.user.id, name, email, role: "user" });
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || "Registration failed" };
    }
  };

  const logout = async () => {
    setUser(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}