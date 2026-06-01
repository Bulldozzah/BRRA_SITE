import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ArrowUpRight, Scale, FileSearch, Building2, Database, MessageSquare, FileCheck, Target, Users, Shield, Sparkles, Calendar } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import heroImg from "@/assets/hero-lusaka.jpg";

const services = [
  { icon: Database, title: "e-Registry", desc: "Centralized access to business licensing information for transparency.", to: "/e-services" },
  { icon: MessageSquare, title: "Notice & Comment", desc: "Online consultation portal for draft regulations.", to: "/e-services" },
  { icon: FileCheck, title: "Single Licensing", desc: "Multiple licensing requirements integrated into one system.", to: "/e-services" },
];

const values = ["Integrity", "Innovation", "Accountability", "Transparency", "Teamwork", "Fairness"];

export default function Index() {
  const { data: newsArticles = [], isLoading: newsLoading } = useQuery({
    queryKey: ["home_news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, summary, content, category, published_at, created_at, image_url")
        .eq("is_published", true)
        .eq("category", "general")
        .order("published_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  return (
    <PageLayout>
      {/* HERO */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <img src={heroImg} alt="Lusaka business district at dusk" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />

        <div className="container-wide relative z-10 py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6 animate-fade-in">
              <span className="h-px w-10 bg-primary" />
              <span className="eyebrow">The Business Regulatory Review Agency</span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.98] tracking-tight animate-fade-up">
              Promoting a <span className="text-gradient-gold">Conducive Business</span> Regulatory Environment.
            </h1>
            <p className="mt-8 text-lg lg:text-xl text-muted-foreground max-w-xl leading-relaxed animate-fade-up" style={{ animationDelay: '0.15s' }}>
              A statutory body under the Ministry of Commerce, Trade and Industry, ensuring efficient, cost-effective, and accessible business licensing systems in Zambia.
            </p>
            <div className="mt-10 flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/e-services" className="group inline-flex items-center gap-2 px-7 py-4 bg-gradient-gold text-primary-foreground font-semibold rounded-sm shadow-gold hover:shadow-deep transition-all">
                Explore e-Services <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/about" className="group inline-flex items-center gap-2 px-7 py-4 border border-border text-foreground font-semibold rounded-sm hover:border-primary hover:text-primary transition-all">
                About BRRA <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-border/60 border border-border/60 rounded-sm overflow-hidden max-w-4xl animate-fade-up" style={{ animationDelay: '0.45s' }}>
            {[
              { v: "2014", l: "Established by Act" },
              { v: "2016", l: "Operational since" },
              { v: "3", l: "Strategic themes" },
              { v: "8", l: "Strategic objectives" },
            ].map((s) => (
              <div key={s.l} className="bg-noir-elevated p-6">
                <div className="font-display text-3xl font-bold text-primary">{s.v}</div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT SUMMARY */}
      <section className="py-24 lg:py-32 border-t border-border">
        <div className="container-wide">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
            <div className="lg:col-span-5">
              <div className="eyebrow mb-4">About BRRA</div>
              <h2 className="font-display text-4xl lg:text-5xl font-bold leading-tight">
                Regulating with <span className="text-gradient-gold">purpose</span>, building with integrity.
              </h2>
              <div className="gold-rule mt-8 mb-8" />
              <p className="text-muted-foreground leading-relaxed mb-6">
                Established under the Business Regulatory Act No. 3 of 2014 (amended by Act No. 14 of 2018), BRRA is a statutory body under the Ministry of Commerce, Trade and Industry, operational since January 2016.
              </p>
              <Link to="/about" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
                Read full mandate <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-5">
              {[
                { icon: Target, title: "Vision", body: "A dynamic Agency fostering a conducive business regulatory environment." },
                { icon: Sparkles, title: "Mission", body: "To regulate business policies and laws to create a cost-effective, conducive business environment." },
                { icon: Scale, title: "Mandate", body: "Review business policies, streamline licensing, and promote economic growth." },
                { icon: Shield, title: "Authority", body: "Statutory body under the Ministry of Commerce, Trade and Industry." },
              ].map((c) => (
                <div key={c.title} className="group p-7 bg-noir-elevated border border-border rounded-sm hover:border-primary/60 transition-all">
                  <c.icon className="h-7 w-7 text-primary mb-5" />
                  <h3 className="font-display font-semibold text-lg mb-2">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-20 pt-12 border-t border-border">
            <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 mb-8">
              <h3 className="font-display text-2xl font-semibold">Core values</h3>
              <p className="text-sm text-muted-foreground">The principles that guide every decision we make.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border">
              {values.map((v, i) => (
                <div key={v} className="bg-background p-6 group hover:bg-noir-elevated transition-colors">
                  <div className="text-xs text-primary font-mono mb-2">0{i + 1}</div>
                  <div className="font-display font-semibold text-lg">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RIA OVERVIEW */}
      <section className="py-24 lg:py-32 bg-noir-elevated border-y border-border">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="eyebrow mb-4">Regulatory Impact Assessment</div>
              <h2 className="font-display text-4xl lg:text-5xl font-bold leading-tight mb-6">
                Evidence-based regulation, by design.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                RIA is a structured process for evaluating the potential effects of proposed regulations on businesses, the economy and society — ensuring policies are evidence-based, efficient and proportionate.
              </p>
              <div className="space-y-5">
                {[
                  { t: "Evidence-based decision making", d: "Policies guided by data and rigorous analysis." },
                  { t: "Reduced regulatory burden", d: "Minimises unnecessary compliance costs for businesses." },
                  { t: "Stakeholder engagement", d: "Encourages transparency and public participation." },
                ].map((b, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="shrink-0 w-10 h-10 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-mono text-sm">
                      0{i + 1}
                    </div>
                    <div>
                      <div className="font-display font-semibold mb-1">{b.t}</div>
                      <div className="text-sm text-muted-foreground">{b.d}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link to="/ria" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all">
                  Learn the RIA process
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* E-SERVICES GRID */}
      <section className="py-24 lg:py-32">
        <div className="container-wide">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <div className="eyebrow mb-4">Digital Services</div>
              <h2 className="font-display text-4xl lg:text-5xl font-bold max-w-2xl leading-tight">
                Three platforms simplifying business regulation.
              </h2>
            </div>
            <Link to="/e-services" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all whitespace-nowrap">
              All e-services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
            {services.map((s, i) => (
              <Link key={s.title} to={s.to} className="group bg-background p-10 hover:bg-noir-elevated transition-all">
                <div className="text-xs font-mono text-primary mb-8">0{i + 1} / 03</div>
                <s.icon className="h-10 w-10 text-primary mb-6 transition-transform group-hover:scale-110" strokeWidth={1.5} />
                <h3 className="font-display text-2xl font-bold mb-3">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">{s.desc}</p>
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Access platform <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STRATEGIC PLAN */}
      <section className="py-24 lg:py-32 border-t border-border bg-gradient-noir">
        <div className="container-wide">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <div className="eyebrow mb-4">Strategic Plan 2022 – 2026</div>
              <h2 className="font-display text-4xl lg:text-5xl font-bold leading-tight mb-6">
                Three themes. One conducive environment.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Our strategic framework aligns with the Eighth National Development Plan and the National Planning and Budgeting Act No. 1 of 2020.
              </p>
            </div>
            <div className="lg:col-span-8 space-y-px">
              {[
                { n: "01", t: "Operational Excellence", d: "High-quality service delivery across every regulatory touchpoint." },
                { n: "02", t: "Strategic Partnerships", d: "Building alliances that enhance regulatory services nationwide." },
                { n: "03", t: "Business Regulatory Excellence", d: "A measurably more conducive environment for business." },
              ].map((p) => (
                <div key={p.n} className="group bg-noir-elevated border border-border p-8 lg:p-10 flex flex-col md:flex-row md:items-center gap-6 hover:border-primary/60 transition-all">
                  <div className="font-display text-5xl font-bold text-primary/30 group-hover:text-primary transition-colors">{p.n}</div>
                  <div className="flex-1">
                    <h3 className="font-display text-2xl font-semibold mb-2">{p.t}</h3>
                    <p className="text-sm text-muted-foreground">{p.d}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* E-REGISTRY CTA */}
      <section className="py-24">
        <div className="container-wide">
          <div className="relative overflow-hidden border border-primary/30 rounded-sm p-10 lg:p-16 bg-noir-elevated">
            <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] bg-gradient-gold opacity-10 blur-3xl rounded-full" />
            <div className="relative grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <Building2 className="h-10 w-10 text-primary mb-6" />
                <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                  Business Licensing Information Portal
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Access licensing requirements, identify the permits you need and improve compliance with Zambia's regulatory frameworks — all in one place.
                </p>
              </div>
              <div className="lg:text-right">
                <a href="https://www.businesslicenses.gov.zm" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-gold text-primary-foreground font-semibold rounded-sm shadow-gold hover:shadow-deep transition-all">
                  Visit e-Registry <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEWS */}
      <section className="py-16 lg:py-24 bg-noir-elevated">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12">
            <div>
              <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">Stay Updated</p>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">Latest News &amp; Updates</h2>
            </div>
            <Link to="/news" className="mt-4 sm:mt-0 inline-flex items-center text-blue-600 font-semibold hover:text-blue-700">
              View All News <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>

          {/* Content */}
          {newsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
              <p>Loading news...</p>
            </div>
          ) : newsArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Sparkles className="h-16 w-16 text-gray-300 mb-4" />
              <p>No news available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsArticles.map((article) => (
                <article key={article.id} className="bg-background rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow group">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    {article.image_url ? (
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                        <Sparkles className="h-16 w-16 text-white opacity-50" />
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className="p-6">
                    <p className="text-sm text-gray-500 mb-2 inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(article.published_at || article.created_at).toLocaleDateString()}
                    </p>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {article.summary || article.content.substring(0, 100) + "..."}
                    </p>
                    <Link to="/news" className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700">
                      Read More <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

    </PageLayout>
  );
}
