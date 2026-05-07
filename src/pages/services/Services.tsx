import PageLayout from "@/components/layout/PageLayout";
import PageHero from "@/components/sections/PageHero";
import heroServices from "@/assets/hero-services.jpg";
import { Link } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, FileSearch, Building2, Database,
  CheckCircle2, BarChart3, Scale, Users, Phone,
} from "lucide-react";

const coreServices = [
  { icon: FileSearch, title: "Regulatory Impact Assessment", desc: "Evidence-based analysis of proposed regulations." },
  { icon: Building2, title: "Regulatory Services Centres", desc: "Physical centers for improved service delivery." },
  { icon: Database, title: "e-Services", desc: "Digital platforms for business compliance." },
];

const riaPillars = [
  { icon: BarChart3, title: "Evidence-Based Policy Making", desc: "Decisions grounded in data and analysis." },
  { icon: Scale, title: "Cost-Benefit Analysis", desc: "Comprehensive assessment of regulatory impacts." },
  { icon: Users, title: "Stakeholder Input", desc: "Inclusive consultation with affected parties." },
];

const riaSteps = [
  { n: 1, title: "Problem Identification", desc: "Identify the regulatory problem that needs to be addressed." },
  { n: 2, title: "Objective Setting", desc: "Define clear objectives for the proposed regulation." },
  { n: 3, title: "Options Analysis", desc: "Identify and analyze alternative regulatory and non-regulatory options." },
  { n: 4, title: "Impact Assessment", desc: "Assess the costs and benefits of each option." },
  { n: 5, title: "Stakeholder Consultation", desc: "Engage with affected parties to gather input and feedback." },
  { n: 6, title: "Recommendation", desc: "Select and recommend the most appropriate option." },
];

const riaPrinciples = [
  "Clearly outline the objectives of the proposed policy or law",
  "Provide an in-depth analysis of the problem that is being addressed",
  "Provide different options being considered and why the preferred option is the best approach",
  "Provide details of who is affected by the problem and who is likely to be affected by the solution",
  "Analyse whether the benefits justify the costs and what the likely costs for business and consumers are",
];

const riaWhy = [
  "Helps assess and bring out all potential impacts (social, economic and environmental) — positive or negative — that can result from a proposed intervention",
  "Helps examine the likely impacts on consumers, businesses and government, and communicate findings to decision makers",
  "Helps determine whether the benefits justify the costs",
  "Ensures that regulations are as effective and efficient as possible",
  "Requires extensive stakeholder consultation to identify options and discuss benefits and costs",
  "Helps consider non-regulatory options",
  "Helps assess if a proposed regulation impedes growth of businesses through burdensome or costly compliance",
  "Helps assess if the regulatory intervention overly adds to costs of the enforcing regulatory agency",
];

const rscBenefits = [
  "One-stop shop for business licensing",
  "Reduced processing times",
  "Expert guidance and support",
];

const eRegistryContains = [
  "Texts of relevant laws and subsidiary legislation on business regulation",
  "Name or title of the business license",
  "License period or validity",
  "License fees",
  "Downloadable application forms",
  "Contacts of issuing agencies",
];

export default function Services() {
  return (
    <PageLayout>
      <PageHero
        eyebrow="What We Offer"
        title="Our Services"
        description="Enhancing Zambia's regulatory environment, reducing the cost of doing business, and supporting sustainable economic growth."
        backgroundImage={heroServices}
      />

      {/* Core Services */}
      <section className="py-20 container-wide">
        <div className="grid lg:grid-cols-12 gap-12 items-end mb-12">
          <div className="lg:col-span-6">
            <div className="eyebrow mb-3">Our Core Services</div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">
              Three pillars supporting Zambia's business community.
            </h2>
          </div>
          <p className="lg:col-span-6 text-muted-foreground leading-relaxed">
            BRRA provides essential services to improve Zambia's regulatory environment, reduce the cost of doing
            business, and support sustainable economic growth.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
          {coreServices.map((s, i) => (
            <div key={s.title} className="bg-background p-8 hover:bg-noir-elevated transition-colors">
              <div className="text-xs text-primary font-mono mb-6">0{i + 1}</div>
              <s.icon className="h-9 w-9 text-primary mb-5" strokeWidth={1.5} />
              <h3 className="font-display text-xl font-bold mb-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RIA */}
      <section id="ria" className="border-t border-border bg-noir-elevated/40 py-20">
        <div className="container-wide">
          <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
            <div className="lg:col-span-6">
              <div className="eyebrow mb-3">Service · 01</div>
              <h2 className="font-display text-3xl lg:text-5xl font-bold leading-tight">
                Regulatory Impact Assessment (RIA)
              </h2>
            </div>
            <p className="lg:col-span-6 text-muted-foreground leading-relaxed text-lg">
              A vital process that ensures regulations are effective, efficient, and evidence-based. RIA analyzes the
              potential consequences of new rules to prevent unnecessary burdens on businesses while achieving policy
              objectives.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border border border-border mb-16">
            {riaPillars.map((p) => (
              <div key={p.title} className="bg-background p-8">
                <p.icon className="h-8 w-8 text-primary mb-4" strokeWidth={1.5} />
                <h3 className="font-display text-lg font-bold mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <Link
            to="/ria-submission"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-primary-foreground font-display font-semibold text-sm rounded-sm hover:opacity-90 transition-opacity mb-16"
          >
            Submit RIA Framework <ArrowRight className="h-4 w-4" />
          </Link>

          {/* RIA Process */}
          <div className="mb-16">
            <div className="eyebrow mb-3">RIA Process Steps</div>
            <h3 className="font-display text-2xl lg:text-3xl font-bold mb-10">A six-step methodology.</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
              {riaSteps.map((s) => (
                <div key={s.n} className="bg-background p-8">
                  <div className="font-display text-5xl font-bold text-primary/30 mb-3">{String(s.n).padStart(2, "0")}</div>
                  <h4 className="font-display text-lg font-bold mb-2">{s.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed RIA info */}
          <div className="eyebrow mb-3">Detailed Information</div>
          <h3 className="font-display text-2xl lg:text-3xl font-bold mb-10">Principles and practice of RIA.</h3>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-background border border-border rounded-sm p-8">
              <h4 className="font-display text-xl font-bold mb-4">Principles of Regulatory Impact Assessment</h4>
              <p className="text-muted-foreground leading-relaxed mb-5">
                A good RIA should include relevant information on the proposed policy or legislation and explain how
                issues being proposed for regulation could cause specific problems if not addressed. A good RIA should:
              </p>
              <ul className="space-y-3">
                {riaPrinciples.map((p) => (
                  <li key={p} className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/90 leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-background border border-border rounded-sm p-8">
              <h4 className="font-display text-xl font-bold mb-4">Why RIA Should Be Undertaken</h4>
              <p className="text-muted-foreground leading-relaxed mb-5">
                Conducting RIA with respect to a proposed policy or law is important because it:
              </p>
              <ul className="space-y-3">
                {riaWhy.map((p) => (
                  <li key={p} className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/90 leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-background border border-border rounded-sm p-8">
              <h4 className="font-display text-lg font-bold mb-3">Who Should Conduct RIA</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                RIA should be conducted by public bodies and regulatory agencies proposing, amending or repealing a
                policy or regulatory framework.
              </p>
            </div>
            <div className="bg-background border border-border rounded-sm p-8">
              <h4 className="font-display text-lg font-bold mb-3">Regulatory Framework Requiring RIA</h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">A RIA must be prepared when introducing, amending or repealing:</p>
              <ul className="space-y-2 text-sm text-foreground/90">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> A policy or law (including statutory instruments) impacting the business environment</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> A fee, charge or levy collected pursuant to a licence, permit, certificate or authorisation</li>
              </ul>
            </div>
            <div className="bg-background border border-border rounded-sm p-8">
              <h4 className="font-display text-lg font-bold mb-3">When Should the RIA Process Start?</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The RIA process should start as early as possible when considering to introduce an intervention, amend
                or repeal a regulatory framework. RIA must be conducted before a new intervention is introduced.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RSC */}
      <section id="rsc" className="py-20 container-wide border-t border-border">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7">
            <div className="eyebrow mb-3">Service · 02</div>
            <h2 className="font-display text-3xl lg:text-5xl font-bold leading-tight mb-6">
              Regulatory Services Centres (RSC)
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg mb-8">
              Physical locations established to improve regulatory service delivery across Zambia. BRRA coordinates the
              establishment and rollout of these centers to reduce the cost of doing business and improve accessibility.
            </p>
            <Link to="/rsc" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-primary-foreground font-display font-semibold text-sm rounded-sm hover:opacity-90 transition-opacity">
              View RSC Locations <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="lg:col-span-5 bg-noir-elevated border border-border rounded-sm p-8">
            <div className="eyebrow mb-4">Benefits</div>
            <ul className="space-y-4">
              {rscBenefits.map((b) => (
                <li key={b} className="flex gap-3 items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/90 leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* e-Registry */}
      <section id="eregistry" className="border-t border-border bg-noir-elevated/40 py-20">
        <div className="container-wide">
          <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
            <div className="lg:col-span-6">
              <div className="eyebrow mb-3">Service · 03</div>
              <h2 className="font-display text-3xl lg:text-5xl font-bold leading-tight">e-Registry</h2>
            </div>
            <p className="lg:col-span-6 text-muted-foreground leading-relaxed text-lg">
              A centralized database and online transaction platform holding information on licenses, permits,
              certificates, authorizations and regulations as defined by the Business Regulatory Act of 2014.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-background border border-border rounded-sm p-8">
              <h4 className="font-display text-xl font-bold mb-5">What the e-Registry Contains</h4>
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
              <h4 className="font-display text-xl font-bold mb-5">What the e-Registry Provides</h4>
              <div className="space-y-5">
                <div>
                  <div className="font-display font-semibold mb-1">Easy Access to Information</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Improved transparency of business licensing and other administrative procedures.
                  </p>
                </div>
                <div>
                  <div className="font-display font-semibold mb-1">Legal Security & Certainty</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Only published licenses have legal effect, validity and enforceability for business activities.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <a
            href="https://www.businesslicenses.gov.zm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-primary-foreground font-display font-semibold text-sm rounded-sm hover:opacity-90 transition-opacity"
          >
            Visit e-Registry Portal <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 container-wide">
        <div className="bg-gradient-noir border border-border rounded-sm p-12 lg:p-16 text-center">
          <div className="eyebrow mb-3 justify-center">Need Assistance?</div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold mb-5 max-w-2xl mx-auto">
            Our team is ready to help you navigate the regulatory landscape and access our services.
          </h2>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Link to="/about" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-primary-foreground font-display font-semibold text-sm rounded-sm hover:opacity-90 transition-opacity">
              Contact Us <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="tel:+260211259165" className="inline-flex items-center gap-2 px-6 py-3 border border-border bg-background text-foreground font-display font-semibold text-sm rounded-sm hover:bg-noir-elevated transition-colors">
              <Phone className="h-4 w-4" /> Call: +260 211 259165
            </a>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
