import PageLayout from "@/components/layout/PageLayout";
import PageHero from "@/components/sections/PageHero";
import heroAbout from "@/assets/hero-about.jpg";
import {
  Target, ShieldCheck, Users, Scale, Eye, Lightbulb, Sparkles,
  MapPin, Clock, Phone, Mail, Handshake, CheckCircle2, Award
} from "lucide-react";

const coreValues = [
  { icon: ShieldCheck, title: "Integrity", body: "We discharge our duties with honesty and uphold the highest ethical standards at all times." },
  { icon: Users, title: "Teamwork", body: "We work together as staff to attain shared goals and partner well with stakeholders in executing our mandate." },
  { icon: Scale, title: "Fairness", body: "We are impartial in our actions and treat every client without favoritism or discrimination." },
  { icon: CheckCircle2, title: "Accountability", body: "We take responsibility for our decisions and actions." },
  { icon: Eye, title: "Transparency", body: "We embrace evidence-based decision making and open communication." },
  { icon: Lightbulb, title: "Innovation", body: "We embrace creativity, evolving products, services and systems to meet the changing needs of the private sector." },
];

const partners = [
  { abbr: "ZTA", name: "Zambia Tourism Agency" },
  { abbr: "ZMA", name: "Zambia Medicines Authority" },
  { abbr: "ZBS", name: "Zambia Bureau of Standards" },
  { abbr: "NAPSA", name: "National Pension Scheme Authority" },
  { abbr: "ZPPA", name: "Zambia Public Procurement Authority" },
  { abbr: "MCTI", name: "Ministry of Commerce, Trade and Industry" },
  { abbr: "CEEC", name: "Citizens Economic Empowerment Commission" },
  { abbr: "PACRA", name: "Patents and Companies Registration Agency" },
];

const stands = [
  { icon: Eye, title: "Transparency", body: "Open and accountable processes." },
  { icon: Award, title: "Excellence", body: "Commitment to quality and best practices." },
  { icon: ShieldCheck, title: "Integrity", body: "Ethical conduct in all our activities." },
  { icon: Sparkles, title: "Innovation", body: "Embracing new ideas and technologies." },
];

const contacts = [
  { icon: MapPin, label: "Address", value: "Plot No. 2251, Fairley Road, Ridgeway, Lusaka, Zambia" },
  { icon: Clock, label: "Hours", value: "Mon – Fri, 9:00 AM – 5:00 PM" },
  { icon: Phone, label: "Phone", value: "+260 211 259165" },
  { icon: Mail, label: "Email", value: "info@brra.org.zm" },
];

export default function About() {
  return (
    <PageLayout>
      <PageHero
        eyebrow="About BRRA"
        title="Promoting a conducive business regulatory environment."
        description="The Business Regulatory Review Agency works to ensure that Zambia's regulatory frameworks are evidence-based, proportionate, and conducive to sustainable economic growth."
        backgroundImage={heroAbout}
      />

      {/* Mission & Mandate */}
      <section className="py-20 container-wide">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <div className="eyebrow mb-3">Our Purpose</div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight mb-6">Mission & Mandate</h2>
            <p className="text-muted-foreground leading-relaxed">
              To ensure that Zambia's regulatory frameworks are evidence-based, proportionate, and conducive to
              sustainable economic growth while protecting public interests and promoting good governance.
            </p>
          </div>
          <div className="lg:col-span-7 space-y-4">
            {[
              "Promote evidence-based regulatory decision making",
              "Ensure stakeholder participation in regulatory processes",
              "Enhance regulatory quality and effectiveness",
            ].map((m) => (
              <div key={m} className="flex gap-4 p-6 border border-border bg-noir-elevated rounded-sm">
                <Target className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-foreground/90">{m}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 border-t border-border container-wide">
        <div className="max-w-2xl mb-14">
          <div className="eyebrow mb-3">Our Principles</div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold">BRRA Core Values</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {coreValues.map((v) => (
            <div key={v.title} className="bg-background p-8 hover:bg-noir-elevated transition-colors">
              <v.icon className="h-7 w-7 text-primary mb-5" />
              <h3 className="font-display text-xl font-bold mb-3">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Partners */}
      <section className="py-20 border-t border-border container-wide">
        <div className="max-w-2xl mb-14">
          <div className="eyebrow mb-3">Collaboration</div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">Our Partners</h2>
          <p className="text-muted-foreground">We work alongside government agencies and regulators to strengthen Zambia's business environment.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
          {partners.map((p) => (
            <div key={p.abbr} className="bg-background p-6 hover:bg-noir-elevated transition-colors flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-gradient-gold text-primary-foreground font-display font-black text-sm">
                {p.abbr}
              </div>
              <div>
                <div className="font-display font-semibold text-sm leading-tight">{p.name}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What We Stand For */}
      <section className="py-20 border-t border-border container-wide">
        <div className="max-w-2xl mb-14">
          <div className="eyebrow mb-3">What We Stand For</div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold">Our Values</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stands.map((s) => (
            <div key={s.title} className="p-8 bg-gradient-noir border border-border rounded-sm">
              <s.icon className="h-7 w-7 text-primary mb-5" />
              <h3 className="font-display text-lg font-bold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 border-t border-border container-wide">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <div className="eyebrow mb-3">Get in Touch</div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold mb-5">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed flex gap-3">
              <Handshake className="h-5 w-5 text-primary shrink-0 mt-1" />
              We would love to hear from you. Feel free to reach out using the details provided.
            </p>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-px bg-border border border-border">
            {contacts.map((c) => (
              <div key={c.label} className="bg-background p-6">
                <c.icon className="h-6 w-6 text-primary mb-4" />
                <div className="eyebrow mb-2">{c.label}</div>
                <p className="text-sm text-foreground/90 leading-relaxed">{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
