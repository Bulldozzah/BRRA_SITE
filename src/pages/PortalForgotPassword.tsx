import { Link } from "react-router-dom";
import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { KeyRound, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function PortalForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/portal/reset-password`,
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      setSent(true);
      toast.success("Password reset email sent!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send reset email");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <section className="min-h-[70vh] flex items-center container-narrow py-20">
        <div className="w-full max-w-md mx-auto p-10 bg-noir-elevated border border-border rounded-sm">
          {!sent ? (
            <>
              <KeyRound className="h-10 w-10 text-primary mb-6" />
              <h1 className="font-display text-3xl font-bold mb-2">Forgot Password?</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              <form className="space-y-5" onSubmit={onSubmit}>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-sm"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Send Reset Link"}
                </button>
              </form>
              
              <div className="mt-6">
                <Link
                  to="/portal/login"
                  className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to Login
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="font-display text-2xl font-bold mb-2">Check Your Email</h1>
              <p className="text-sm text-muted-foreground mb-6">
                We've sent a password reset link to <strong className="text-foreground">{email}</strong>
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-sm p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-xs text-blue-800 font-medium mb-1">Next Steps:</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Check your inbox for the reset email</li>
                      <li>• Click the link in the email to reset your password</li>
                      <li>• The link will expire in 1 hour</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Didn't receive the email?{" "}
                  <button
                    onClick={() => setSent(false)}
                    className="text-primary hover:underline"
                  >
                    Try again
                  </button>
                </p>
                <Link
                  to="/portal/login"
                  className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
