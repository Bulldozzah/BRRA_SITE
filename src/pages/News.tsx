import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import PageLayout from "@/components/layout/PageLayout";
import PageHero from "@/components/sections/PageHero";
import heroNews from "@/assets/hero-news.jpg";
import { Calendar, Search, FileText, ArrowUpRight, X, Download, Eye, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const [filter, setFilter] = useState<typeof tags[number]>("General");
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeName, setSubscribeName] = useState("");

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

      {/* Newsletter Signup Section */}
      <section className="py-16 bg-noir-elevated border-t border-border">
        <div className="container-wide">
          <div className="max-w-2xl mx-auto text-center">
            <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="font-display text-3xl font-bold mb-3">Stay Informed</h2>
            <p className="text-muted-foreground mb-8">
              Subscribe to our newsletter to receive the latest news, announcements, and updates from BRRA directly in your inbox.
            </p>
            {user ? (
              <NewsletterToggle userId={user.id} email={user.email} name={user.name} />
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Create an account to subscribe to our newsletter.</p>
                <Link
                  to="/portal/register"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all"
                >
                  <Mail className="h-4 w-4" /> Sign Up for Newsletter
                </Link>
                <p className="text-xs text-muted-foreground mt-2">
                  Already have an account? <Link to="/portal/login" className="text-primary hover:underline">Sign in</Link> to manage your subscription.
                </p>
              </div>
            )}
          </div>
        </div>
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

function NewsletterToggle({ userId, email, name }: { userId: string; email: string; name: string }) {
  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ["newsletter_subscription", userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("newsletter_subscribers")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (subscription) {
        // Re-subscribe
        const { error } = await (supabase as any)
          .from("newsletter_subscribers")
          .update({ is_subscribed: true, unsubscribed_at: null })
          .eq("id", subscription.id);
        if (error) throw error;
      } else {
        // First-time subscribe
        const { error } = await (supabase as any)
          .from("newsletter_subscribers")
          .insert({ user_id: userId, email, name });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("You're subscribed to the BRRA newsletter!");
      refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("newsletter_subscribers")
        .update({ is_subscribed: false, unsubscribed_at: new Date().toISOString() })
        .eq("id", subscription.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("You've unsubscribed from the newsletter.");
      refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  const isSubscribed = subscription?.is_subscribed === true;

  return (
    <div className="space-y-4">
      {isSubscribed ? (
        <>
          <div className="inline-flex items-center gap-2 text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">You're subscribed!</span>
          </div>
          <p className="text-sm text-muted-foreground">You'll receive email updates when new content is published.</p>
          <button
            onClick={() => unsubscribeMutation.mutate()}
            disabled={unsubscribeMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-border text-sm font-medium rounded-sm hover:border-destructive hover:text-destructive transition-colors"
          >
            {unsubscribeMutation.isPending ? "Unsubscribing..." : "Unsubscribe"}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Click below to subscribe and receive news updates via email.</p>
          <button
            onClick={() => subscribeMutation.mutate()}
            disabled={subscribeMutation.isPending}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all"
          >
            <Mail className="h-4 w-4" />
            {subscribeMutation.isPending ? "Subscribing..." : "Subscribe to Newsletter"}
          </button>
        </>
      )}
    </div>
  );
}
