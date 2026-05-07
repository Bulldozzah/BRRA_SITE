import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import PageHero from "@/components/sections/PageHero";
import heroRiaTracking from "@/assets/hero-ria-tracking.jpg";
import { Search, CheckCircle2, Clock, Circle } from "lucide-react";

const stages = [
  "Received", "Initial review", "Sector assignment", "Officer assigned",
  "Stakeholder consultation", "Impact analysis", "Recommendation", "Final decision"
];

export default function RiaTracking() {
  const [ref, setRef] = useState("");
  const [shown, setShown] = useState(false);
  const currentStage = 4;

  return (
    <PageLayout>
      <PageHero eyebrow="Track" title="Track your RIA submission."
        description="Enter your tracking number to view the status and progress of your assessment." backgroundImage={heroRiaTracking} />

      <section className="py-12 container-narrow">
        <form onSubmit={(e) => { e.preventDefault(); setShown(true); }} className="flex gap-3 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. RIA-AB12CD" className="w-full pl-12 pr-4 py-3 bg-noir-elevated border border-border rounded-sm focus:outline-none focus:border-primary text-sm font-mono uppercase" />
          </div>
          <button type="submit" className="px-6 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all">Track</button>
        </form>

        {shown && ref && (
          <div className="p-10 bg-noir-elevated border border-border rounded-sm">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
              <div>
                <div className="eyebrow mb-1">Reference</div>
                <div className="font-mono text-xl text-gradient-gold font-bold">{ref.toUpperCase()}</div>
              </div>
              <div className="px-4 py-2 bg-primary/10 border border-primary/40 text-primary text-xs font-mono uppercase tracking-wider">In progress</div>
            </div>

            <div className="space-y-1">
              {stages.map((s, i) => {
                const done = i < currentStage;
                const active = i === currentStage;
                return (
                  <div key={s} className="flex items-center gap-4 py-3">
                    {done ? <CheckCircle2 className="h-5 w-5 text-primary" /> :
                     active ? <Clock className="h-5 w-5 text-primary animate-shimmer" /> :
                     <Circle className="h-5 w-5 text-muted-foreground/40" />}
                    <span className={`font-display ${done || active ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>{s}</span>
                    {active && <span className="ml-auto text-xs font-mono text-primary uppercase tracking-wider">Current</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </PageLayout>
  );
}
