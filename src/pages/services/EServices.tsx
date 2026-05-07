import PageLayout from "@/components/layout/PageLayout";
import PageHero from "@/components/sections/PageHero";
import heroEServices from "@/assets/hero-e-services.jpg";
import { Link } from "react-router-dom";
import { Database, Layers, Network, CheckCircle2, ArrowUpRight, ArrowRight } from "lucide-react";

const eRegistryContains = [
  "Texts of relevant laws and subsidiary legislation on business regulation",
  "Name or title of the business license",
  "License period or validity",
  "License fees",
  "Downloadable application forms",
  "Contacts of issuing agencies",
];

const eRegistryProvides = [
  {
    title: "Easy access to information",
    desc: "Exhaustive information about business regulation and licensing, providing improved transparency of business licensing and other administrative procedures.",
  },
  {
    title: "Legal security & certainty",
    desc: "Only business regulation licenses, permits, certificates and authorizations published in the e-Registry have legal effect, validity and enforceability for business activities.",
  },
];

const slsOutcomes = [
  "A reduction in the number of licenses and reduced compliance costs in all sectors",
  "The target is to have single licensing regimes for all sectors in the medium term",
];

const ossisNewStakeholders = [
  "Financial Intelligence Center (FIC)",
  "Workers Compensation Fund Control Board (WCFCB)",
  "Zambia Public Procurement Agency (ZPPA)",
];

const ossisObjectives = [
  { phase: "Phase 1", desc: "Establish a shared business application that will enable speedy first-time business registrations across RSC agencies." },
  { phase: "Phase 2", desc: "Allow businesses and individuals to register or comply with post-registration requirements from one desk (permits, fees, authorisations, levies and licenses)." },
  { phase: "Phase 3", desc: "Establish a virtual Regulatory Services Centre with an e-submission platform." },
];

export default function EServices() {
  return (
    <PageLayout>
      <PageHero
        eyebrow="Digital Services"
        title="e-Services"
        description="Digital solutions to simplify business registration and compliance across Zambia."
        backgroundImage={heroEServices}
      />

      {/* e-Registry */}
      <section className="py-20 container-wide">
        <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
          <div className="lg:col-span-6">
            <Database className="h-10 w-10 text-primary mb-5" strokeWidth={1.5} />
            <div className="eyebrow mb-3">Service · 01</div>
            <h2 className="font-display text-3xl lg:text-5xl font-bold leading-tight">e-Registry</h2>
          </div>
          <div className="lg:col-span-6 space-y-5 text-muted-foreground leading-relaxed text-lg">
            <p>
              The Act defines an e-Registry as a centralized database and online transaction platform holding
              information on licenses, permits, certificates, authorizations and regulations — including formalities
              businesses must comply with — and capable of facilitating online application processing.
            </p>
            <p>
              Establishment of an e-Registry is one of the key provisions of the Business Regulatory Act of 2014.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-background border border-border rounded-sm p-8">
            <h3 className="font-display text-xl font-bold mb-5">The e-Registry shall contain</h3>
            <ul className="space-y-3">
              {eRegistryContains.map((c) => (
                <li key={c} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/90 leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-background border border-border rounded-sm p-8">
            <h3 className="font-display text-xl font-bold mb-5">The e-Registry shall provide</h3>
            <div className="space-y-5">
              {eRegistryProvides.map((p) => (
                <div key={p.title}>
                  <div className="font-display font-semibold mb-1">{p.title}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <a
          href="https://www.businesslicenses.gov.zm"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-primary-foreground font-display font-semibold text-sm rounded-sm hover:opacity-90 transition-opacity"
        >
          Access e-Registry <ArrowUpRight className="h-4 w-4" />
        </a>
      </section>

      {/* Single Licensing System */}
      <section className="border-t border-border bg-noir-elevated/40 py-20">
        <div className="container-wide">
          <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
            <div className="lg:col-span-6">
              <Layers className="h-10 w-10 text-primary mb-5" strokeWidth={1.5} />
              <div className="eyebrow mb-3">Service · 02</div>
              <h2 className="font-display text-3xl lg:text-5xl font-bold leading-tight">Single Licensing System</h2>
            </div>
            <div className="lg:col-span-6 space-y-5 text-muted-foreground leading-relaxed text-lg">
              <p>
                According to the Business Regulatory Act, a Single Licensing System is designed to facilitate compliance
                with multiple licensing requirements by multiple regulatory bodies through a single regulatory point or
                a Regulatory Services Centre.
              </p>
              <p>
                In other words, it is an integrated approach to processing and issuing all required licenses and permits
                for businesses operating in a given sector.
              </p>
            </div>
          </div>

          <div className="bg-background border border-border rounded-sm p-8 lg:p-10">
            <div className="eyebrow mb-3">Expected Outcomes</div>
            <h3 className="font-display text-2xl font-bold mb-6">Reducing complexity, lowering compliance costs.</h3>
            <ul className="space-y-3 max-w-3xl">
              {slsOutcomes.map((o) => (
                <li key={o} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/90 leading-relaxed">{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* OSSIS */}
      <section className="py-20 container-wide border-t border-border">
        <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
          <div className="lg:col-span-6">
            <Network className="h-10 w-10 text-primary mb-5" strokeWidth={1.5} />
            <div className="eyebrow mb-3">Service · 03</div>
            <h2 className="font-display text-3xl lg:text-5xl font-bold leading-tight">One Stop Shop Integrated System (OSSIS)</h2>
          </div>
          <p className="lg:col-span-6 text-muted-foreground leading-relaxed text-lg">
            PACRA, with assistance from Private Sector Development for Industrialisation and Job Creation (PSDIJC),
            developed the One Stop Shop Integrated System (OSSIS) to facilitate sharing of information captured by
            various stakeholder agencies.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-background border border-border rounded-sm p-8">
            <div className="eyebrow mb-3">Initial Phase</div>
            <h3 className="font-display text-xl font-bold mb-3">Three institutions piloted</h3>
            <p className="text-muted-foreground leading-relaxed">
              PACRA, ZRA and NAPSA were piloted in the initial phase of OSSIS.
            </p>
          </div>
          <div className="bg-background border border-border rounded-sm p-8">
            <div className="eyebrow mb-3">Current Phase</div>
            <h3 className="font-display text-xl font-bold mb-3">Successfully scaling up</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The trial phase has been successfully implemented and is being up-scaled to include more stakeholders. New
              stakeholders that have come on board include:
            </p>
            <ul className="space-y-2">
              {ossisNewStakeholders.map((s) => (
                <li key={s} className="flex gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-1" />
                  <span className="text-sm text-foreground/90">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="eyebrow mb-3">Objectives of OSSIS</div>
        <h3 className="font-display text-2xl lg:text-3xl font-bold mb-8">A three-phase rollout.</h3>
        <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
          {ossisObjectives.map((o, i) => (
            <div key={o.phase} className="bg-background p-8">
              <div className="font-display text-5xl font-bold text-primary/30 mb-3">0{i + 1}</div>
              <div className="eyebrow mb-2 text-primary">{o.phase}</div>
              <p className="text-foreground/90 leading-relaxed">{o.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 container-wide">
        <div className="bg-gradient-noir border border-border rounded-sm p-12 lg:p-16 text-center">
          <div className="eyebrow mb-3 justify-center">Need Assistance?</div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold mb-5 max-w-2xl mx-auto">
            Our team is ready to help you navigate the e-Services platform.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Get in touch with us for guidance on accessing and using our digital services.
          </p>
          <Link to="/about" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-primary-foreground font-display font-semibold text-sm rounded-sm hover:opacity-90 transition-opacity">
            Contact Us <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
