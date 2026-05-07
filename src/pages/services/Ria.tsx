import PageLayout from "@/components/layout/PageLayout";
import PageHero from "@/components/sections/PageHero";
import heroRia from "@/assets/hero-ria.jpg";
import { Link } from "react-router-dom";
import {
  CheckCircle2, ArrowRight, Target, Search, GitBranch, Users, Scale,
  BarChart3, MessagesSquare, Wallet, Sparkles, Ban, TrendingUp, Building2,
  Clock, AlertTriangle, FileText, Receipt, ShieldCheck,
} from "lucide-react";

const principles = [
  { icon: Target, title: "Clearly Outline Objectives", desc: "Clearly outline the objectives of the proposed policy or law." },
  { icon: Search, title: "In-Depth Problem Analysis", desc: "Provide an in-depth analysis of the problem that is being addressed." },
  { icon: GitBranch, title: "Consider Options", desc: "Provide different options being considered and why the preferred option is the best approach." },
  { icon: Users, title: "Identify Affected Parties", desc: "Provide details of who is affected by the problem and who is likely to be affected by the solution." },
  { icon: Scale, title: "Cost-Benefit Analysis", desc: "Analyse whether the benefits justify the costs and what the likely costs for business and consumers are." },
];

const importance = [
  { icon: BarChart3, title: "Comprehensive Impact Assessment", desc: "Helps assess and bring out all potential impacts (social, economic and environmental), positive or negative, of a proposed policy or regulatory intervention." },
  { icon: Users, title: "Stakeholder Impact Analysis", desc: "Examines likely impacts on consumers, businesses and government, and communicates findings and recommendations to decision makers." },
  { icon: Wallet, title: "Cost-Justification", desc: "Helps determine whether the benefits justify the costs." },
  { icon: Sparkles, title: "Efficiency and Effectiveness", desc: "Ensures that regulations are as effective and efficient as possible." },
  { icon: MessagesSquare, title: "Stakeholder Consultation", desc: "Requires extensive stakeholder consultation to identify options and discuss benefits and costs." },
  { icon: Ban, title: "Non-Regulatory Options", desc: "Helps consider non-regulatory options." },
  { icon: TrendingUp, title: "Business Growth Assessment", desc: "Assesses if a proposed regulation impedes business growth through burdensome, bureaucratic or costly compliance." },
  { icon: Building2, title: "Agency Cost Assessment", desc: "Assesses if the regulatory intervention overly adds to costs of the enforcing regulatory agency." },
];

const requirements = [
  { icon: FileText, title: "Policy or Law Impact", desc: "A policy or law (including statutory instruments) that have an impact on the business environment." },
  { icon: Receipt, title: "Fees and Charges", desc: "A fee, charge or levy collected pursuant to the issuance of a licence, permit, certificate or authorisation as prescribed by any given law." },
];

export default function Ria() {
  return (
    <PageLayout>
      <PageHero
        eyebrow="Regulatory Impact Assessment"
        title="Regulatory Impact Assessment"
        description="A systematic approach to evaluating the potential impacts of proposed regulations on businesses, the economy and society — ensuring effective and efficient regulatory frameworks."
        backgroundImage={heroRia}
      >
      
      </PageHero>

      {/* Principles */}
      <section className="py-20 container-wide">
        <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
          <div className="lg:col-span-5">
            <div className="eyebrow mb-3">Guidelines</div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">
              Principles of Regulatory Impact Assessment
            </h2>
          </div>
          <p className="lg:col-span-7 text-muted-foreground leading-relaxed text-lg">
            A good RIA should include relevant information on the proposed policy or legislation and explain how issues
            being proposed for regulation could cause specific problems if not addressed. A good RIA should:
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {principles.map((p) => (
            <div key={p.title} className="bg-background p-8">
              <p.icon className="h-9 w-9 text-primary mb-5" strokeWidth={1.5} />
              <h3 className="font-display text-lg font-bold mb-3">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Importance */}
      <section className="border-t border-border bg-noir-elevated/40 py-20">
        <div className="container-wide">
          <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
            <div className="lg:col-span-5">
              <div className="eyebrow mb-3">Importance</div>
              <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">
                Why RIA Should Be Undertaken
              </h2>
            </div>
            <p className="lg:col-span-7 text-muted-foreground leading-relaxed text-lg">
              Conducting RIA with respect to a proposed policy or law is important in that it:
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
            {importance.map((p) => (
              <div key={p.title} className="bg-background p-8">
                <p.icon className="h-8 w-8 text-primary mb-5" strokeWidth={1.5} />
                <h3 className="font-display text-base font-bold mb-3">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Should Conduct */}
      <section className="py-20 container-wide border-t border-border">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-background border border-border rounded-sm p-10">
            <ShieldCheck className="h-10 w-10 text-primary mb-5" strokeWidth={1.5} />
            <div className="eyebrow mb-3">Responsibility</div>
            <h3 className="font-display text-2xl font-bold mb-4">Who Should Conduct RIA</h3>
            <p className="text-muted-foreground leading-relaxed">
              RIA should be conducted by public bodies and regulatory agencies proposing, amending or repealing a policy
              or regulatory framework.
            </p>
          </div>

          <div className="bg-background border border-border rounded-sm p-10">
            <FileText className="h-10 w-10 text-primary mb-5" strokeWidth={1.5} />
            <div className="eyebrow mb-3">Requirements</div>
            <h3 className="font-display text-2xl font-bold mb-4">Regulatory Framework Requiring RIA</h3>
            <p className="text-muted-foreground leading-relaxed mb-5">
              A RIA must be prepared when introducing, amending or repealing:
            </p>
            <ul className="space-y-4">
              {requirements.map((r) => (
                <li key={r.title} className="flex gap-3">
                  <r.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-display font-semibold mb-1">{r.title}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-t border-border bg-noir-elevated/40 py-20">
        <div className="container-wide grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <Clock className="h-10 w-10 text-primary mb-5" strokeWidth={1.5} />
            <div className="eyebrow mb-3">Timeline</div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">
              When Should the RIA Process Start?
            </h2>
          </div>
          <div className="lg:col-span-7 space-y-6">
            <p className="text-muted-foreground leading-relaxed text-lg">
              The RIA process should start as early as possible when considering to introduce an intervention, amend or
              repeal a regulatory framework.
            </p>
            <div className="bg-background border-l-4 border-primary p-6 rounded-sm">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="eyebrow mb-2 text-primary">Critical Requirement</div>
                  <p className="font-display font-semibold text-lg leading-snug">
                    RIA must be conducted before a new intervention is introduced.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 container-wide">
        <div className="bg-gradient-noir border border-border rounded-sm p-12 lg:p-16 text-center">
          <div className="eyebrow mb-3 justify-center">Get Started</div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold mb-5 max-w-2xl mx-auto">
            Ready to Conduct an RIA?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Submit your Regulatory Impact Assessment framework for review and guidance.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/ria-submission" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-primary-foreground font-display font-semibold text-sm rounded-sm hover:opacity-90 transition-opacity">
              Submit RIA <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/ria-tracking" className="inline-flex items-center gap-2 px-6 py-3 border border-border bg-background text-foreground font-display font-semibold text-sm rounded-sm hover:bg-noir-elevated transition-colors">
              Track Submission
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
