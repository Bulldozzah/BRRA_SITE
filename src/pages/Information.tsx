import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";
import PageHero from "@/components/sections/PageHero";
import heroInformation from "@/assets/hero-information.jpg";
import { Download, FileText, Search, FolderOpen, Eye } from "lucide-react";

type DocCategory = "strategic_plan" | "annual_report" | "policy_document" | "guideline" | "research_paper" | "newsletter" | "presentation" | "other";

const categoryLabels: Record<DocCategory, string> = {
  strategic_plan: "Strategic Plan",
  annual_report: "Annual Report",
  policy_document: "Policy Document",
  guideline: "Guideline",
  research_paper: "Research Paper",
  newsletter: "Newsletter",
  presentation: "Presentation",
  other: "Other",
};

const categoryFilters: { value: "all" | DocCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "strategic_plan", label: "Strategic Plans" },
  { value: "annual_report", label: "Annual Reports" },
  { value: "policy_document", label: "Policies" },
  { value: "guideline", label: "Guidelines" },
  { value: "research_paper", label: "Research" },
  { value: "newsletter", label: "Newsletters" },
  { value: "presentation", label: "Presentations" },
  { value: "other", label: "Other" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function Information() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | DocCategory>("all");

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["public_documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = documents.filter(d => {
    const matchCategory = filter === "all" || d.category === filter;
    const matchSearch = !search || (d.title + (d.description || "") + d.file_name).toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <PageLayout>
      <PageHero eyebrow="Publications & Resources" title="Information centre."
        description="Annual reports, strategic documents, guidelines and research from BRRA." backgroundImage={heroInformation} />

      <section className="py-12 container-wide">
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search publications..." className="w-full pl-12 pr-4 py-3 bg-noir-elevated border border-border rounded-sm focus:outline-none focus:border-primary text-sm" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categoryFilters.map(c => (
              <button
                key={c.value}
                onClick={() => setFilter(c.value)}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border rounded-sm transition-colors ${filter === c.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-primary hover:border-primary/60'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-12">Loading documents...</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderOpen className="h-16 w-16 opacity-30 mb-4" />
            <p>No publications available at the moment</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">{filtered.length} document{filtered.length !== 1 ? "s" : ""}</p>
            <div className="border border-border rounded-sm overflow-hidden">
              {filtered.map((doc, i) => (
                <div
                  key={doc.id}
                  className={`group flex items-center gap-6 p-6 hover:bg-noir-elevated transition-colors ${i !== 0 ? 'border-t border-border' : ''}`}
                >
                  <FileText className="h-8 w-8 text-primary shrink-0" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 text-xs flex-wrap">
                      <span className="text-primary font-mono uppercase tracking-wider">{categoryLabels[doc.category as DocCategory]}</span>
                      <span className="text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</span>
                      {doc.file_size && <span className="text-muted-foreground">{formatFileSize(doc.file_size)}</span>}
                    </div>
                    <h3 className="font-display font-semibold group-hover:text-primary transition-colors">{doc.title}</h3>
                    {doc.description && (
                      <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-sm text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors"
                      title="Preview in browser"
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </a>
                    <a
                      href={doc.file_url}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-sm text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors"
                      title="Download file"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </PageLayout>
  );
}
