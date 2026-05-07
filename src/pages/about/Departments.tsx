import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import PageHero from "@/components/sections/PageHero";
import heroDepartments from "@/assets/hero-departments.jpg";
import {
  Crown, Scale, Handshake, Gavel, Users, Wallet, ShieldCheck,
  CheckCircle2, ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

const departments = [
  {
    id: "executive",
    icon: Crown,
    name: "Office of the Executive Director",
    tagline: "Strategic leadership and coordination of Agency programmes and activities.",
    body: "The Office of the Director and Chief Executive Officer (CEO) provides strategic focus and direction, as well as coordinating the implementation of the programmes and activities of the Agency. It ensures effective linkages among and within Departments, strengthens internal systems, and improves coordination and communication for effective performance. The Director and CEO is responsible for executing the annual work plan as approved by the Committee.",
    points: [
      "Provide strategic focus and direction",
      "Coordinate implementation of programmes and activities",
      "Ensure effective linkages among and within Departments",
      "Strengthen internal systems",
      "Execute annual work plan as approved by the Committee",
    ],
  },
  {
    id: "regulatory",
    icon: Scale,
    name: "Regulatory Affairs Department",
    tagline: "Ensuring policies and laws regulating business activity are sound and of high quality.",
    body: "The Regulatory Affairs Department is responsible for ensuring that policies and laws regulating business activity are sound, of high quality and do not unnecessarily add to the cost of doing business.",
    points: [
      "Review and approve proposed policies and laws regulating business activity",
      "Review regulatory frameworks and recommend appropriate interventions",
      "Develop standards and guidelines for RIAs and public consultations",
      "Provide technical support to Regulatory Agencies and Public Bodies on RIAs",
      "Monitor and evaluate the business regulatory environment across sectors",
    ],
  },
  {
    id: "facilitation",
    icon: Handshake,
    name: "Business Facilitation and Engagement Department",
    tagline: "Coordinating interventions to improve regulatory services delivery.",
    body: "This Department coordinates the development and implementation of interventions aimed at improving regulatory services delivery in order to reduce the cost of doing business.",
    points: [
      "Maintain and continuously update the e-Registry",
      "Coordinate the establishment of Single Licensing Systems for sectors",
      "Roll out Regulatory Services Centres (RSCs) for efficient service delivery",
      "Engage regulators and stakeholders on regulatory matters",
      "Deliver capacity building programmes for regulatory agencies",
    ],
  },
  {
    id: "legal",
    icon: Gavel,
    name: "Legal Unit",
    tagline: "Providing secretarial and legal services to the Committee.",
    body: "The Legal Unit provides secretarial and legal services to the Committee and ensures compliance with the Business Regulatory Act No. 3 of 2014.",
    points: [
      "Provide secretarial services to the Committee",
      "Provide legal services and advice",
      "Ensure compliance with the Business Regulatory Act No. 3 of 2014",
      "Draft and review legal documents",
      "Handle legal matters and compliance issues",
    ],
  },
  {
    id: "hr",
    icon: Users,
    name: "Human Capital and Administration Unit",
    tagline: "Managing human resources and providing logistical support services.",
    body: "The Human Capital and Administration Unit is responsible for the efficient and effective management and provision of logistical support services, including developing the human and institutional capacity of the Agency.",
    points: [
      "Manage and develop human resources",
      "Provide logistical support services",
      "Develop institutional capacity",
      "Coordinate staff training and development",
      "Ensure efficient and effective service delivery",
    ],
  },
  {
    id: "finance",
    icon: Wallet,
    name: "Finance Unit",
    tagline: "Managing financial resources and ensuring prudent utilization.",
    body: "The Finance Unit manages the Agency's financial resources, including acquisition and prudent utilization, record-keeping, budget input, financial reporting and bank reconciliations.",
    points: [
      "Manage and acquire financial resources",
      "Ensure prudent utilization of financial resources",
      "Keep record of financial transactions",
      "Provide input into annual budgets and work plans",
      "Prepare financial reports and bank reconciliations",
    ],
  },
  {
    id: "audit",
    icon: ShieldCheck,
    name: "Internal Audit and Risk Management Unit",
    tagline: "Ensuring correct use of funds and compliance to financial procedures.",
    body: "The Internal Audit Unit reviews and ensures correct use of funds, conducts compliance audits, and develops internal financial controls and risk management practices.",
    points: [
      "Review and ensure correct use and application of funds",
      "Conduct audits for compliance to financial procedures",
      "Develop and ensure adherence to internal financial controls",
      "Identify and mitigate financial risks",
      "Provide audit reports and recommendations",
    ],
  },
];

export default function Departments() {
  const [active, setActive] = useState(departments[0].id);
  const current = departments.find((d) => d.id === active)!;

  return (
    <PageLayout>
      <PageHero
        eyebrow="Organizational Structure"
        title="Our Departments"
        description="Discover the specialized units that drive BRRA's mission to enhance Zambia's regulatory environment and support business growth."
        backgroundImage={heroDepartments}
      />

      {/* Intro */}
      <section className="py-20 container-wide">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <div className="eyebrow mb-3">How We're Organized</div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">
              Specialized teams. One shared mandate.
            </h2>
          </div>
          <div className="lg:col-span-7">
            <p className="text-muted-foreground leading-relaxed text-lg">
              BRRA is organized into specialized departments and units, each playing a crucial role in
              enhancing Zambia's regulatory environment and supporting business growth.
            </p>
          </div>
        </div>
      </section>

      {/* Tabbed explorer */}
      <section className="border-t border-border bg-noir-elevated/40">
        <div className="container-wide py-16 grid lg:grid-cols-12 gap-10">
          {/* Tabs */}
          <aside className="lg:col-span-4">
            <div className="eyebrow mb-4">Explore</div>
            <div className="space-y-1">
              {departments.map((d) => {
                const isActive = d.id === active;
                return (
                  <button
                    key={d.id}
                    onClick={() => setActive(d.id)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-sm border transition-all ${
                      isActive
                        ? "bg-background border-primary text-foreground shadow-gold"
                        : "bg-transparent border-transparent text-muted-foreground hover:bg-background hover:border-border hover:text-foreground"
                    }`}
                  >
                    <d.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                    <span className="font-display text-sm font-semibold leading-tight">{d.name}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-8">
            <article key={current.id} className="bg-background border border-border rounded-sm p-10 animate-fade-up">
              <div className="flex items-start gap-5 mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-gradient-gold text-primary-foreground shrink-0">
                  <current.icon className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-display text-2xl lg:text-3xl font-bold leading-tight mb-2">{current.name}</h3>
                  <p className="text-primary text-sm font-medium">{current.tagline}</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-8">{current.body}</p>

              <div className="hairline pt-6">
                <div className="eyebrow mb-5">Key Responsibilities</div>
                <ul className="space-y-3">
                  {current.points.map((p) => (
                    <li key={p} className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground/90 leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border container-wide">
        <div className="bg-gradient-noir border border-border rounded-sm p-12 lg:p-16 text-center">
          <div className="eyebrow mb-3 justify-center">Want to Learn More?</div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold mb-5 max-w-2xl mx-auto">
            Get in touch with the team behind BRRA.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Reach out to a department directly or explore our services to find the right contact for your needs.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/about" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-primary-foreground font-display font-semibold text-sm rounded-sm hover:opacity-90 transition-opacity">
              Contact BRRA <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/services" className="inline-flex items-center gap-2 px-6 py-3 border border-border bg-background text-foreground font-display font-semibold text-sm rounded-sm hover:bg-noir-elevated transition-colors">
              View Our Services
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
