import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { UserPlus, MailCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function PortalRegister() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirm) return setError("Passwords do not match");
    setSubmitting(true);
    try {
      const res = await register(name.trim(), email.trim(), password);
      if (!res.ok) {
        setError(res.error || "Registration failed");
        return;
      }
      if (res.needsEmailConfirmation) {
        setEmailSent(true);
        return;
      }
      toast.success("Account created");
      navigate("/portal/dashboard");
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <PageLayout>
        <section className="min-h-[70vh] flex items-center container-narrow py-20">
          <div className="w-full max-w-md mx-auto p-10 bg-noir-elevated border border-border rounded-sm text-center">
            <MailCheck className="h-12 w-12 text-primary mx-auto mb-6" />
            <h1 className="font-display text-2xl font-bold mb-3">Check your email</h1>
            <p className="text-sm text-muted-foreground mb-2">
              A confirmation link has been sent to <span className="text-foreground font-medium">{email}</span>.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Click the link in the email to activate your account, then sign in.
            </p>
            <Link
              to="/portal/login"
              className="inline-block px-6 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all text-sm"
            >
              Go to Sign In
            </Link>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="min-h-[70vh] flex items-center container-narrow py-20">
        <div className="w-full max-w-md mx-auto p-10 bg-noir-elevated border border-border rounded-sm">
          <UserPlus className="h-10 w-10 text-primary mb-6" />
          <h1 className="font-display text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-sm text-muted-foreground mb-6">Register to track submissions and manage compliance.</p>
          <form className="space-y-5" onSubmit={onSubmit}>
            <Field label="Full Name" type="text" value={name} onChange={setName} />
            <Field label="Email" type="email" value={email} onChange={setEmail} />
            <Field label="Password" type="password" value={password} onChange={setPassword} />
            <Field label="Confirm Password" type="password" value={confirm} onChange={setConfirm} />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full px-6 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all disabled:opacity-60">
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-6">
            Already have an account? <Link to="/portal/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </section>
    </PageLayout>
  );
}

function Field({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">{label}</label>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-sm"
      />
    </div>
  );
}