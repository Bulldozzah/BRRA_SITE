import PageLayout from "@/components/layout/PageLayout";
import PageHero from "@/components/sections/PageHero";
import heroRiaSubmission from "@/assets/hero-ria-submission.jpg";
import { FileText, UserPlus, LogIn, ArrowRight, CheckCircle2, Clock, Send } from "lucide-react";

export default function RiaSubmission() {
  return (
    <PageLayout>
      <PageHero eyebrow="Submit RIA" title="Submit a Regulatory Impact Assessment."
        description="Register or login to request submission of your RIA. Staff will review your request and grant access." backgroundImage={heroRiaSubmission} />

      <section className="py-16 container-narrow">
        <div className="space-y-8">
          {/* How it works */}
          <div className="bg-noir-elevated border border-border rounded-sm p-8">
            <h3 className="font-display text-xl font-bold mb-6 text-center">How to Submit a RIA</h3>
            <div className="grid sm:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs font-mono uppercase tracking-wider text-primary mb-1">Step 1</p>
                <p className="text-sm font-medium">Register / Login</p>
                <p className="text-xs text-muted-foreground mt-1">Create an account or sign in to the portal.</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs font-mono uppercase tracking-wider text-primary mb-1">Step 2</p>
                <p className="text-sm font-medium">Request to Submit</p>
                <p className="text-xs text-muted-foreground mt-1">Submit a request with details about your proposed regulation.</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs font-mono uppercase tracking-wider text-primary mb-1">Step 3</p>
                <p className="text-sm font-medium">Await Approval</p>
                <p className="text-xs text-muted-foreground mt-1">You'll receive an email when your request is reviewed.</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs font-mono uppercase tracking-wider text-primary mb-1">Step 4</p>
                <p className="text-sm font-medium">Submit Your RIA</p>
                <p className="text-xs text-muted-foreground mt-1">Once approved, complete and submit your full RIA document.</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/portal/register" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all">
              <UserPlus className="h-4 w-4" />
              Register Now
            </a>
            <a href="/portal/login" className="inline-flex items-center gap-2 px-8 py-4 border border-border font-medium rounded-sm hover:border-primary hover:text-primary transition-colors">
              <LogIn className="h-4 w-4" />
              Login
            </a>
            <a href="/portal/ria" className="inline-flex items-center gap-2 px-8 py-4 border border-primary/30 text-primary font-medium rounded-sm hover:bg-primary/5 transition-colors">
              <ArrowRight className="h-4 w-4" />
              Go to RIA Portal
            </a>
          </div>

          {/* Track existing */}
          <div className="text-center pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">Already submitted?</p>
            <a href="/portal/ria" className="text-primary text-sm font-medium hover:underline">Track your submission →</a>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
