import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function PortalResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    // Check if we have a valid recovery token
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidToken(true);
      } else {
        toast.error("Invalid or expired reset link");
        setTimeout(() => navigate("/portal/login"), 2000);
      }
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Password updated successfully!");
      setTimeout(() => navigate("/portal/login"), 1500);
    } catch (err: any) {
      toast.error(err?.message || "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  };

  if (!validToken) {
    return (
      <PageLayout>
        <section className="min-h-[70vh] flex items-center container-narrow py-20">
          <div className="w-full max-w-md mx-auto p-10 bg-noir-elevated border border-border rounded-sm text-center">
            <p className="text-muted-foreground">Validating reset link...</p>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="min-h-[70vh] flex items-center container-narrow py-20">
        <div className="w-full max-w-md mx-auto p-10 bg-noir-elevated border border-border rounded-sm">
          <Lock className="h-10 w-10 text-primary mb-6" />
          <h1 className="font-display text-3xl font-bold mb-2">Reset Password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your new password below.
          </p>
          
          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-sm"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-sm"
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}

            <button
              type="submit"
              disabled={submitting || password !== confirmPassword}
              className="w-full px-6 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all disabled:opacity-60"
            >
              {submitting ? "Updating…" : "Reset Password"}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-xs text-muted-foreground text-center">
              Remember your password?{" "}
              <Link to="/portal/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
