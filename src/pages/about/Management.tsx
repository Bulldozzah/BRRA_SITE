import PageLayout from "@/components/layout/PageLayout";
import PageHero from "@/components/sections/PageHero";
import heroManagement from "@/assets/hero-management.jpg";
import managementSharonCkSichilongo from "@/assets/management/management-sharon-ck-sichilongo.jpg";
import managementDavidSBanda from "@/assets/management/management-david-s-banda.jpg";
import managementDavidFBanda from "@/assets/management/management-david-f-banda.jpg";
import managementDennisKamfwa from "@/assets/management/management-dennis-kamfwa.jpg";
import managementNyantangaChibwe from "@/assets/management/management-nyantanga-chibwe.jpg";
import managementRichardEChanda from "@/assets/management/management-richard-e-chanda.jpg";
import managementJoelMumba from "@/assets/management/management-joel-mumba.jpg";
import { Mail, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const executive = {
  name: "Sharon C.K Sichilongo",
  role: "Executive Director",
  email: "sc.sichilongo@brra.org.zm",
  image: managementSharonCkSichilongo,
};

const directors = [
  { name: "David S. Banda", role: "Director - Business Facilitation", email: "ds.banda@brra.org.zm", image: managementDavidSBanda },
  { name: "David F. Banda", role: "Director - Regulatory Affairs", email: "df.banda@brra.org.zm", image: managementDavidFBanda },
  { name: "Dennis Kamfwa", role: "Director - Legal and Board Secretary", email: "D.Kamfwa@brra.org.zm", image: managementDennisKamfwa },
];

const managers = [
  { name: "Nyantanga Chibwe", role: "Manager - Finance", email: "nh.chibwe@brra.org.zm", image: managementNyantangaChibwe },
  { name: "Richard E. Chanda", role: "Manager – Internal Audit", email: "r.chanda@brra.org.zm", image: managementRichardEChanda },
  { name: "Joel Mumba", role: "Manager – Regulatory Services & Licensing Systems", email: "J.Mumba@brra.org.zm", image: managementJoelMumba },
];

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");

function MemberCard({ m, featured = false }: { m: { name: string; role: string; email: string; image?: string }; featured?: boolean }) {
  return (
    <article className="bg-background p-8 hover:bg-background/80 transition-colors group relative">
      {featured && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-gold" />}
      <div className="aspect-[4/5] bg-gradient-to-br from-noir-elevated to-secondary border border-border mb-6 flex items-center justify-center relative overflow-hidden">
        {m.image ? (
          <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-display text-7xl font-bold text-primary/30">{initials(m.name)}</span>
        )}
        {!featured && <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-gold opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
      <div className={`eyebrow mb-2 ${featured ? "text-primary" : ""}`}>{m.role}</div>
      <h3 className="font-display text-lg font-bold mb-1">{m.name}</h3>
      <p className="text-sm text-muted-foreground mb-4">Business Regulatory Review Agency</p>
      <a href={`mailto:${m.email}`} className="inline-flex items-center gap-2 text-xs text-primary hover:underline break-all">
        <Mail className="h-3.5 w-3.5 shrink-0" />
        {m.email}
      </a>
    </article>
  );
}

export default function Management() {
  return (
    <PageLayout>
      <PageHero
        eyebrow="Leadership"
        title="Management Team"
        description="The leaders driving BRRA's mission and accountable for delivering on the Agency's mandate."
        backgroundImage={heroManagement}
      />

      {/* Executive Director */}
      <section className="py-20 container-wide">
        <div className="max-w-2xl mb-10">
          <div className="eyebrow mb-3">Leadership</div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">Executive Director</h2>
        </div>
        <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-px bg-border border-border max-w-4xl mx-auto">
          <div className="hidden lg:block bg-background" />
          <MemberCard m={executive} featured />
          <div className="hidden lg:block bg-background" />
        </div>
      </section>

      {/* Directors */}
      <section className="border-t border-border bg-noir-elevated/40 py-20">
        <div className="container-wide">
          <div className="max-w-2xl mb-10">
            <div className="eyebrow mb-3">Management</div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">Directors</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
            {directors.map((m) => <MemberCard key={m.name} m={m} />)}
          </div>
        </div>
      </section>

      {/* Managers */}
      <section className="py-20 container-wide">
        <div className="max-w-2xl mb-10">
          <div className="eyebrow mb-3">Department Heads</div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">Managers</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {managers.map((m) => <MemberCard key={m.name} m={m} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 container-wide border-t border-border">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-noir border border-border rounded-sm p-10">
            <div className="eyebrow mb-3">Organizational Structure</div>
            <h3 className="font-display text-2xl font-bold mb-3">View Our Organizational Structure</h3>
            <p className="text-muted-foreground mb-6">Learn more about how BRRA is organized and the roles of each department.</p>
            <Link to="/departments" className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-gold text-primary-foreground font-display font-semibold text-sm rounded-sm hover:opacity-90 transition-opacity">
              View Departments <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="bg-background border border-border rounded-sm p-10">
            <div className="eyebrow mb-3">Governance</div>
            <h3 className="font-display text-2xl font-bold mb-3">Meet the Board</h3>
            <p className="text-muted-foreground mb-6">Our Board provides strategic oversight and governance for the Agency.</p>
            <Link to="/board" className="inline-flex items-center gap-2 px-5 py-3 border border-border bg-background text-foreground font-display font-semibold text-sm rounded-sm hover:bg-noir-elevated transition-colors">
              View Board <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
