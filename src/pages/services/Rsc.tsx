import PageLayout from "@/components/layout/PageLayout";
import PageHero from "@/components/sections/PageHero";
import heroRsc from "@/assets/hero-rsc.jpg";
import { Link } from "react-router-dom";
import { CheckCircle2, MapPin, Phone, ArrowRight, Building2 } from "lucide-react";

const objectives = [
  "Streamlining business registration processes",
  "Providing a single licensing system",
  "Reducing the procedures and time it takes to complete the registration process",
  "Increasing accessibility of business registration institutions by placing them under one roof",
];

const agencies = [
  "Ministry of Tourism (Department of Tourism)",
  "Zambia Tourism Agency (ZTA)",
  "Patents and Companies Registration Agency (PACRA)",
  "Zambia Revenue Authority (ZRA)",
  "National Pension Scheme Authority (NAPSA)",
  "Zambia Development Agency (ZDA)",
  "Workers Compensation Fund Control Board (WCFCB)",
  "Department of National Parks and Wildlife",
  "Zambia Environmental Management Agency (ZEMA)",
  "Department of Cooperatives",
  "Citizens Economic Empowerment Commission (CEEC)",
  "Local/Civic Authorities",
  "Zambia Public Procurement Authority (ZPPA)",
];

const centres = [
  { city: "Lusaka", status: "Fully Fledged", address: "Kwacha House Annex, Cairo Road", phone: "+260 211 259165" },
  { city: "Chipata", status: "Fully Fledged", address: "Second Floor, Zesco/Zanaco Building, Off Perereyantwa Road" },
  { city: "Livingstone", status: "Fully Fledged", address: "Tourism Centre, Stand No. 1962 Mosi-Oa-Tunya Rd", extra: "Post Office Box 60518" },
  { city: "Kitwe", status: "Fully Fledged", address: "Nchanga House" },
  { city: "Kabwe", status: "Fully Fledged", address: "3rd Floor, 309 Mukuni House, Independence Way", extra: "P.O Box 80407" },
  { city: "Solwezi", status: "Fully Fledged", address: "Solwezi, Zambia" },
  { city: "Chinsali", status: "Operationalised", address: "Kasama Road" },
  { city: "Kasama", status: "Operationalised", address: "Kasama, Zambia" },
];

export default function Rsc() {
  return (
    <PageLayout>
      <PageHero
        eyebrow="Regulatory Services Centres"
        title="Regulatory Services Centres (RSCs)"
        description="Improving delivery and accessibility of business regulatory services to reduce the cost of doing business in Zambia."
        backgroundImage={heroRsc}
      />

      {/* About */}
      <section className="py-20 container-wide">
        <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
          <div className="lg:col-span-5">
            <div className="eyebrow mb-3">About RSCs</div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">
              A coordinated approach to business regulation.
            </h2>
          </div>
          <div className="lg:col-span-7 space-y-5 text-muted-foreground leading-relaxed text-lg">
            <p>
              The Business Regulatory Review Agency (BRRA) is mandated to coordinate the establishment, operationalisation
              and roll out of Regulatory Services Centres (RSCs) in Zambia, in order to improve delivery and accessibility
              of business regulatory services and ultimately reduce the cost of doing business.
            </p>
            <p>
              The establishment of RSCs is a strategy aimed at improving the business environment in Zambia through the
              provision of an efficient regulatory clearance system.
            </p>
          </div>
        </div>

        <div className="bg-noir-elevated border border-border rounded-sm p-8 lg:p-10">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="font-display text-5xl font-bold text-primary mb-2">6</div>
              <div className="text-sm text-muted-foreground">Fully fledged centres</div>
            </div>
            <div>
              <div className="font-display text-5xl font-bold text-primary mb-2">2</div>
              <div className="text-sm text-muted-foreground">Operationalised centres</div>
            </div>
            <div>
              <div className="font-display text-5xl font-bold text-primary mb-2">13+</div>
              <div className="text-sm text-muted-foreground">Participating agencies</div>
            </div>
          </div>
        </div>
      </section>

      {/* Objectives */}
      <section className="border-t border-border bg-noir-elevated/40 py-20">
        <div className="container-wide">
          <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
            <div className="lg:col-span-5">
              <div className="eyebrow mb-3">Our Goals</div>
              <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">
                Objectives of Regulatory Services Centres
              </h2>
            </div>
            <p className="lg:col-span-7 text-muted-foreground leading-relaxed text-lg">
              The main aim of establishing the Regulatory Services Centres is to provide for an efficient regulatory
              clearance system by:
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-px bg-border border border-border">
            {objectives.map((o, i) => (
              <div key={o} className="bg-background p-8">
                <div className="font-display text-xs text-primary font-mono mb-4">0{i + 1}</div>
                <p className="text-foreground/90 leading-relaxed">{o}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agencies */}
      <section className="py-20 container-wide border-t border-border">
        <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
          <div className="lg:col-span-5">
            <div className="eyebrow mb-3">Partners</div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">Participating Agencies</h2>
          </div>
          <p className="lg:col-span-7 text-muted-foreground leading-relaxed text-lg">
            Key regulatory agencies working together under one roof to streamline business compliance in Zambia.
          </p>
        </div>

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {agencies.map((a) => (
            <li key={a} className="bg-background p-5 flex gap-3 items-start">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-foreground/90 leading-relaxed">{a}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Centres */}
      <section className="border-t border-border bg-noir-elevated/40 py-20">
        <div className="container-wide">
          <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
            <div className="lg:col-span-5">
              <div className="eyebrow mb-3">Find Us</div>
              <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">
                Physical Addresses for Established RSCs
              </h2>
            </div>
            <p className="lg:col-span-7 text-muted-foreground leading-relaxed text-lg">
              Find a Regulatory Services Centre near you across Zambia.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
            {centres.map((c) => {
              const fully = c.status === "Fully Fledged";
              return (
                <article key={c.city} className="bg-background p-8 hover:bg-noir-elevated transition-colors relative">
                  {fully && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-gold" />}
                  <Building2 className="h-7 w-7 text-primary mb-4" strokeWidth={1.5} />
                  <h3 className="font-display text-xl font-bold mb-2">{c.city}</h3>
                  <span
                    className={`inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm mb-4 ${
                      fully ? "bg-gradient-gold text-primary-foreground" : "bg-noir-elevated border border-border text-muted-foreground"
                    }`}
                  >
                    {c.status}
                  </span>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2 items-start text-foreground/90">
                      <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{c.address}</span>
                    </div>
                    {c.extra && <div className="text-xs text-muted-foreground pl-6">{c.extra}</div>}
                    {c.phone && (
                      <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="flex gap-2 items-center text-primary hover:underline">
                        <Phone className="h-4 w-4 shrink-0" />
                        <span>{c.phone}</span>
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 container-wide">
        <div className="bg-gradient-noir border border-border rounded-sm p-12 lg:p-16 text-center">
          <div className="eyebrow mb-3 justify-center">Need Assistance?</div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold mb-5 max-w-2xl mx-auto">
            Contact your nearest RSC for support.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Get help with business registration and regulatory services from any of our Regulatory Services Centres.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/about" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-primary-foreground font-display font-semibold text-sm rounded-sm hover:opacity-90 transition-opacity">
              Contact Us <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/services" className="inline-flex items-center gap-2 px-6 py-3 border border-border bg-background text-foreground font-display font-semibold text-sm rounded-sm hover:bg-noir-elevated transition-colors">
              View Services
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
