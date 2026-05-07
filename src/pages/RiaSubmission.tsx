import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import PageHero from "@/components/sections/PageHero";
import heroRiaSubmission from "@/assets/hero-ria-submission.jpg";
import { CheckCircle2, Upload } from "lucide-react";

export default function RiaSubmission() {
  const [submitted, setSubmitted] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ref = "RIA-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    setSubmitted(ref);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <PageLayout>
      <PageHero eyebrow="Submit RIA" title="Submit a Regulatory Impact Assessment."
        description="Complete the form below. You'll receive a tracking number to follow your submission's progress." backgroundImage={heroRiaSubmission} />

      <section className="py-16 container-narrow">
        {submitted ? (
          <div className="p-10 bg-noir-elevated border border-primary/40 rounded-sm text-center">
            <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-5" />
            <h3 className="font-display text-2xl font-bold mb-3">Submission received</h3>
            <p className="text-muted-foreground mb-6">Your tracking number is</p>
            <div className="font-mono text-2xl text-gradient-gold font-bold mb-8">{submitted}</div>
            <button onClick={() => setSubmitted(null)} className="px-6 py-3 border border-border rounded-sm hover:border-primary hover:text-primary transition-all">Submit another</button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Field label="Submitting Institution" required />
              <Field label="Contact Person" required />
              <Field label="Email" type="email" required />
              <Field label="Phone" />
            </div>
            <Field label="Proposed Regulation Title" required />
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">Sector</label>
              <select className="w-full px-4 py-3 bg-noir-elevated border border-border rounded-sm focus:outline-none focus:border-primary text-sm">
                <option>Trade & Commerce</option><option>Agriculture</option><option>Mining</option><option>Manufacturing</option><option>Tourism</option><option>Health</option><option>Education</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">Description / Rationale</label>
              <textarea rows={6} className="w-full px-4 py-3 bg-noir-elevated border border-border rounded-sm focus:outline-none focus:border-primary text-sm" />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">Supporting Documents</label>
              <div className="border-2 border-dashed border-border rounded-sm p-10 text-center hover:border-primary transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Drop files or click to upload (PDF, DOCX)</p>
              </div>
            </div>
            <button type="submit" className="w-full px-6 py-4 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all">
              Submit Assessment
            </button>
          </form>
        )}
      </section>
    </PageLayout>
  );
}

function Field({ label, type = "text", required }: { label: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
        {label}{required && <span className="text-destructive ml-1">*</span>}
      </label>
      <input type={type} required={required} className="w-full px-4 py-3 bg-noir-elevated border border-border rounded-sm focus:outline-none focus:border-primary text-sm" />
    </div>
  );
}
