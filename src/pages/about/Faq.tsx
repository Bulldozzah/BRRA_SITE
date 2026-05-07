import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import PageHero from "@/components/sections/PageHero";
import heroFaq from "@/assets/hero-faq.jpg";
import { ChevronDown, Search } from "lucide-react";

const faqs = [
  { c: "General", q: "Why are Business licenses important?", a: "For compliance purposes: business licenses, permits and registrations serve the purpose of advising the licensing authorities that the business is functioning and meeting safety, soundness and tax regulations for the authorities." },
  { c: "General", q: "How and where do I report a complaint about a business?", a: "For assistance in determining where to file a complaint against a business entity and how to proceed, please refer to the concerned institutions as mentioned on the portal." },
  { c: "Licensing", q: "What is a Business License?", a: "A business license is a legal authorization to operate a business in a city, town, municipality or within the boundaries of any country." },
  { c: "Licensing", q: "Who needs a Business License?", a: "Any person or entity willing to start a business within a given jurisdiction." },
  { c: "Licensing", q: "Do I need to renew my license?", a: "Yes. Most business licenses must be renewed periodically — typically annually. Renewal requirements and timelines vary by license type and issuing authority. Please check the specific terms with the relevant institution listed on the portal." },
  { c: "Licensing", q: "Will I need to pay for the license?", a: "For some of the licenses, a fee is required. For more clarification, please check with the concerned institutions through the contact details provided on the portal." },
  { c: "Licensing", q: "How much time do I have to wait in order to get my license?", a: "The time required to process a license is mentioned on the portal and it differs from one license to another." },
  { c: "Licensing", q: "How and where do I report my complaint about my business license?", a: "For assistance in determining where to file a complaint against a business entity and how to proceed, please refer to the concerned institutions as mentioned on the portal." },
];

const categories = ["All", "General", "Licensing"] as const;

export default function Faq() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<number | null>(0);
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const filtered = faqs.filter(
    (f) =>
      (category === "All" || f.c === category) &&
      (f.q + f.a).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageLayout>
      <PageHero eyebrow="Help" title="Frequently asked questions" description="Quick answers to common questions about BRRA and its services." backgroundImage={heroFaq} />
      <section className="py-16 container-narrow">
        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search FAQs..." className="w-full pl-12 pr-4 py-4 bg-noir-elevated border border-border rounded-sm focus:outline-none focus:border-primary text-sm" />
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((c) => {
            const count = c === "All" ? faqs.length : faqs.filter((f) => f.c === c).length;
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => { setCategory(c); setOpen(null); }}
                className={`px-4 py-2 rounded-sm text-xs font-display font-semibold uppercase tracking-wider border transition-colors ${
                  active
                    ? "bg-gradient-gold text-primary-foreground border-transparent"
                    : "bg-noir-elevated text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
                }`}
              >
                {c} <span className="opacity-60 ml-1">({count})</span>
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-muted-foreground text-sm py-8 text-center">No questions match your search.</p>
          )}
          {filtered.map((f, i) => (
            <div key={i} className="border border-border bg-noir-elevated rounded-sm overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left">
                <div>
                  <div className="text-xs text-primary font-mono mb-1.5">{f.c}</div>
                  <div className="font-display font-semibold">{f.q}</div>
                </div>
                <ChevronDown className={`h-5 w-5 text-primary shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && <div className="px-6 pb-6 text-muted-foreground leading-relaxed">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
