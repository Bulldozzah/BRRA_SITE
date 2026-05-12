import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";
import PageHero from "@/components/sections/PageHero";
import heroNews from "@/assets/hero-news.jpg";
import { Calendar, Search, FileText, ArrowUpRight, X, Download, Eye } from "lucide-react";

type NewsCategory = "general" | "newsletter" | "announcement" | "event";

type NewsArticle = {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  category: NewsCategory;
  is_published: boolean;
  is_featured: boolean;
  image_url: string | null;
  pdf_url: string | null;
  pdf_file_size: number | null;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
};

const tags = ["General", "Newsletter", "Announcement", "Event"] as const;

const categoryColors: Record<NewsCategory, string> = {
  general: "bg-blue-500/10 text-blue-400 border-blue-400/30",
  newsletter: "bg-green-500/10 text-green-400 border-green-400/30",
  announcement: "bg-primary/10 text-primary border-primary/30",
  event: "bg-purple-500/10 text-purple-400 border-purple-400/30",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function News() {
  const [filter, setFilter] = useState<typeof tags[number]>("General");
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["public_news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as NewsArticle[];
    },
  });

  const filtered = articles.filter(a => {
    const matchCategory = a.category === filter.toLowerCase();
    const matchSearch = !search || (a.title + (a.summary || "") + a.content).toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const featured = articles.filter(a => a.is_featured && a.category === "general");

  return (
    <PageLayout>
      <PageHero eyebrow="Newsroom" title="News, announcements & updates from BRRA." backgroundImage={heroNews} />

      <section className="py-12 container-wide">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search news..." className="w-full pl-12 pr-4 py-3 bg-noir-elevated border border-border rounded-sm focus:outline-none focus:border-primary text-sm" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {tags.map(t => (
              <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border rounded-sm transition-colors ${filter === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-primary hover:border-primary/60'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <p className="text-center text-muted-foreground py-12">Loading news...</p>
        )}

        {/* Featured Section */}
        {!isLoading && featured.length > 0 && filter === "General" && !search && (
          <div className="mb-12">
            {featured.slice(0, 1).map(article => (
              <article
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="group cursor-pointer p-10 lg:p-14 bg-gradient-noir border border-primary/30 rounded-sm hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-3 mb-5 text-xs">
                  <span className="px-2.5 py-1 bg-primary text-primary-foreground font-mono uppercase tracking-wider">Featured · {article.category}</span>
                  <span className="text-muted-foreground inline-flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {article.published_at ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : ""}
                  </span>
                </div>
                {article.image_url && (
                  <div className="mb-6 h-48 rounded-sm overflow-hidden bg-noir-elevated">
                    <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4 group-hover:text-primary transition-colors max-w-3xl leading-tight">{article.title}</h2>
                <p className="text-muted-foreground max-w-2xl mb-6 leading-relaxed">{article.summary || article.content.substring(0, 150) + "..."}</p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">Read full article <ArrowUpRight className="h-4 w-4" /></span>
              </article>
            ))}
          </div>
        )}

        {/* Results count */}
        {!isLoading && (
          <p className="text-xs text-muted-foreground mb-6">{filtered.length} article{filtered.length !== 1 ? "s" : ""}</p>
        )}

        {/* Articles Grid */}
        {!isLoading && filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No articles found</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
            {filtered.map(article => (
              <article
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="bg-background p-7 hover:bg-noir-elevated transition-colors cursor-pointer group"
              >
                {article.image_url && (
                  <div className="mb-4 h-32 rounded-sm overflow-hidden bg-noir-elevated">
                    <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-5 text-xs">
                  <span className={`px-2.5 py-1 border font-mono uppercase tracking-wider ${categoryColors[article.category]}`}>{article.category}</span>
                  <span className="text-muted-foreground inline-flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {article.published_at ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : ""}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold leading-snug group-hover:text-primary transition-colors mb-3">{article.title}</h3>
                <p className="text-sm text-muted-foreground mb-5">{article.summary || article.content.substring(0, 100) + "..."}</p>
                <div className="flex items-center gap-3">
                  {article.pdf_url ? (
                    <span className="text-xs font-semibold text-primary inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> View PDF</span>
                  ) : (
                    <span className="text-xs font-semibold text-primary inline-flex items-center gap-1.5">Read more <ArrowUpRight className="h-3.5 w-3.5" /></span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-12 bg-black/70 overflow-y-auto" onClick={() => setSelectedArticle(null)}>
          <div className="bg-background border border-border rounded-sm w-full max-w-3xl mx-4 my-8 shadow-deep" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3 text-xs">
                <span className={`px-2.5 py-1 border font-mono uppercase tracking-wider ${categoryColors[selectedArticle.category]}`}>{selectedArticle.category}</span>
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {selectedArticle.published_at ? new Date(selectedArticle.published_at).toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }) : ""}
                </span>
              </div>
              <button onClick={() => setSelectedArticle(null)} className="p-2 hover:bg-noir-elevated rounded-sm transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Top Section: Image + Details Side by Side */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Left: Image */}
                {selectedArticle.image_url && (
                  <div className="w-full h-64 md:h-80 rounded-sm overflow-hidden bg-noir-elevated">
                    <img src={selectedArticle.image_url} alt={selectedArticle.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Right: Article Details */}
                <div className="space-y-4">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">{selectedArticle.title}</h1>

                  {selectedArticle.summary && (
                    <p className="text-muted-foreground leading-relaxed">{selectedArticle.summary}</p>
                  )}

                  {selectedArticle.author_name && (
                    <p className="text-xs text-muted-foreground">By {selectedArticle.author_name}</p>
                  )}

                  {selectedArticle.pdf_url && (
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={selectedArticle.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-400/30 rounded-sm text-sm font-medium hover:bg-purple-500/20 transition-colors"
                      >
                        <Eye className="h-4 w-4" /> Preview PDF
                      </a>
                      <a
                        href={selectedArticle.pdf_url}
                        download
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 border border-green-400/30 rounded-sm text-sm font-medium hover:bg-green-500/20 transition-colors"
                      >
                        <Download className="h-4 w-4" /> Download PDF
                        {selectedArticle.pdf_file_size && (
                          <span className="text-xs opacity-70">({formatFileSize(selectedArticle.pdf_file_size)})</span>
                        )}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Section: Scrollable Content Container */}
              <div className="border border-border rounded-sm bg-noir-elevated p-6 max-h-96 overflow-y-auto">
                <h3 className="text-xs font-mono uppercase tracking-wider text-primary mb-4">Article Content</h3>
                <div className="prose prose-invert prose-sm max-w-none">
                  {selectedArticle.content.split("\n").map((para, i) => (
                    <p key={i} className="text-foreground/80 leading-relaxed mb-4">{para}</p>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setSelectedArticle(null)}
                className="w-full mt-6 px-6 py-3 border border-border rounded-sm text-sm font-medium hover:border-primary hover:text-primary transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
