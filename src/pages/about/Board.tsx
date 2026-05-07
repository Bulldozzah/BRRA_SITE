import PageLayout from "@/components/layout/PageLayout";
import PageHero from "@/components/sections/PageHero";
import heroBoard from "@/assets/hero-board.jpg";
import boardDominicKapalu from "@/assets/board/board-dominic-kapalu.jpg";
import boardLiversageHanene from "@/assets/board/board-liversage-hanene.jpg";
import boardCharityKBanda from "@/assets/board/board-charity-k-banda.jpg";
import boardChristopherOdonel from "@/assets/board/board-christopher-odonel.jpg";
import boardSylviaKMasabo from "@/assets/board/board-sylvia-k-masabo.jpg";
import boardFrancisChilunga from "@/assets/board/board-francis-chilunga.jpg";
import { Compass, ShieldCheck, FileCheck2, Wallet, Mail, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const responsibilities = [
  { icon: Compass, title: "Strategic Direction", desc: "Setting the strategic direction and priorities for BRRA." },
  { icon: ShieldCheck, title: "Governance Oversight", desc: "Ensuring proper governance and accountability." },
  { icon: FileCheck2, title: "Policy Approval", desc: "Approving major policies and regulatory frameworks." },
  { icon: Wallet, title: "Financial Oversight", desc: "Overseeing financial management and budgets." },
];

const members = [
  { name: "Dominic Kapalu", role: "Board Chairperson", email: "d.kapalu@brra.org.zm", image: boardDominicKapalu },
  { name: "Liversage Hanene", role: "Vice Chairperson", email: "l.hanene@brra.org.zm", image: boardLiversageHanene },
  { name: "Charity K. Banda", role: "Board Member", email: "c.banda@brra.org.zm", image: boardCharityKBanda },
  { name: "Christopher O'donel", role: "Board Member", email: "C.Odonel@brra.org.zm", image: boardChristopherOdonel },
  { name: "Sylvia K. Masabo", role: "Board Member", email: "sk.masabo@brra.org.zm", image: boardSylviaKMasabo },
  { name: "Francis Chilunga", role: "Board Member", email: "f.chilunga@brra.org.zm", image: boardFrancisChilunga },
];

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");

export default function Board() {
  return (
    <PageLayout>
      <PageHero
        eyebrow="Governance"
        title="About the Board"
        description="The BRRA Board of Directors provides strategic oversight and governance for the Agency, ensuring its mandate is fulfilled effectively and transparently."
        backgroundImage={heroBoard}
      />

      {/* Intro + responsibilities */}
      <section className="py-20 container-wide">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <div className="eyebrow mb-3">Role of the Board</div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">
              Strategic oversight from a balanced leadership.
            </h2>
          </div>
          <div className="lg:col-span-7 space-y-5 text-muted-foreground leading-relaxed text-lg">
            <p>
              The BRRA Board of Directors comprises representatives from government, the private sector,
              and civil society, ensuring that the Agency fulfills its mandate effectively and transparently.
            </p>
            <p>
              The Board meets quarterly to review progress, approve policies, and provide strategic direction.
              It plays a crucial role in ensuring that BRRA's activities align with national development
              objectives and international best practices.
            </p>
          </div>
        </div>

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
          {responsibilities.map((r) => (
            <div key={r.title} className="bg-background p-8 hover:bg-noir-elevated transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-gradient-gold text-primary-foreground mb-5">
                <r.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold mb-2">{r.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Members */}
      <section className="border-t border-border bg-noir-elevated/40 py-20">
        <div className="container-wide">
          <div className="max-w-2xl mb-12">
            <div className="eyebrow mb-3">Our Board Members</div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight mb-4">
              Distinguished leaders guiding BRRA.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Drawn from government, private sector, and civil society to provide balanced strategic guidance.
            </p>
          </div>

          {/* Leadership row */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border mb-px">
            <div className="hidden lg:block bg-background" />
            {members.slice(0, 2).map((m) => (
              <article key={m.name} className="bg-background p-8 hover:bg-background/80 transition-colors group relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-gold" />
                <div className="aspect-[4/5] bg-gradient-to-br from-noir-elevated to-secondary border border-border mb-6 flex items-center justify-center relative overflow-hidden">
                  <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                </div>
                <div className="eyebrow mb-2 text-primary">{m.role}</div>
                <h3 className="font-display text-lg font-bold mb-1">{m.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">Business Regulatory Review Agency</p>
                <a href={`mailto:${m.email}`} className="inline-flex items-center gap-2 text-xs text-primary hover:underline break-all">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {m.email}
                </a>
              </article>
            ))}
            <div className="hidden lg:block bg-background" />
          </div>

          {/* Members grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
            {members.slice(2).map((m) => (
              <article key={m.name} className="bg-background p-8 hover:bg-background/80 transition-colors group">
                <div className="aspect-[4/5] bg-gradient-to-br from-noir-elevated to-secondary border border-border mb-6 flex items-center justify-center relative overflow-hidden">
                  <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="eyebrow mb-2">{m.role}</div>
                <h3 className="font-display text-lg font-bold mb-1">{m.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">Business Regulatory Review Agency</p>
                <a href={`mailto:${m.email}`} className="inline-flex items-center gap-2 text-xs text-primary hover:underline break-all">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {m.email}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA to management */}
      <section className="py-20 container-wide">
        <div className="bg-gradient-noir border border-border rounded-sm p-12 lg:p-16 text-center">
          <div className="eyebrow mb-3 justify-center">Meet Our Management Team</div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold mb-5 max-w-2xl mx-auto">
            Learn about the executive team responsible for day-to-day operations.
          </h2>
          <Link to="/management" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-primary-foreground font-display font-semibold text-sm rounded-sm hover:opacity-90 transition-opacity">
            View Management Team <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
