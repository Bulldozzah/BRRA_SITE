import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function PortalLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      if (!res.ok) {
        setError(res.error || "Login failed");
        return;
      }
      toast.success("Welcome back");
      navigate("/portal/dashboard");
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <section className="min-h-[70vh] flex items-center container-narrow py-20">
        <div className="w-full max-w-md mx-auto p-10 bg-noir-elevated border border-border rounded-sm">
          <Lock className="h-10 w-10 text-primary mb-6" />
          <h1 className="font-display text-3xl font-bold mb-2">Portal Login</h1>
          <p className="text-sm text-muted-foreground mb-6">Sign in to access your dashboard, submissions and management tools.</p>
          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-sm" />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-sm" />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full px-6 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all disabled:opacity-60">{submitting ? "Signing in…" : "Sign in"}</button>
          </form>
          <div className="mt-6 space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              No account? <Link to="/portal/register" className="text-primary hover:underline">Register</Link>
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
