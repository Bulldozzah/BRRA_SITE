import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, X, Newspaper, Eye, EyeOff, Star,
  FileText, Image as ImageIcon, Calendar, Upload,
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function uploadFile(bucket: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`;
}

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
  author_id: string | null;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const categories: NewsCategory[] = ["general", "newsletter", "announcement", "event"];

const categoryColors: Record<NewsCategory, string> = {
  general: "bg-blue-100 text-blue-700",
  newsletter: "bg-green-100 text-green-700",
  announcement: "bg-amber-100 text-amber-700",
  event: "bg-purple-100 text-purple-700",
};

const emptyForm = {
  title: "",
  summary: "",
  content: "",
  category: "general" as NewsCategory,
  is_published: true,
  is_featured: false,
  image_url: "",
  pdf_url: "",
  pdf_file_size: "",
};

export default function AdminNewsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/portal/login");
    else if (user.role !== "admin") navigate("/portal/dashboard");
  }, [user, loading, navigate]);

  if (loading) return null;
  if (!user || user.role !== "admin") return null;

  return (
    <AdminLayout activeTab="news">
      <NewsManager user={user} />
    </AdminLayout>
  );
}

function NewsManager({ user }: { user: { id: string; name: string } }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterCategory, setFilterCategory] = useState<"all" | NewsCategory>("all");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin_news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as NewsArticle[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const { error } = await supabase.from("news").insert({
        title: payload.title,
        summary: payload.summary || null,
        content: payload.content,
        category: payload.category,
        is_published: payload.is_published,
        is_featured: payload.is_featured,
        image_url: payload.image_url || null,
        pdf_url: payload.pdf_url || null,
        pdf_file_size: payload.pdf_file_size ? parseInt(payload.pdf_file_size) : null,
        author_id: user.id,
        author_name: user.name,
        published_at: payload.is_published ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_news"] });
      toast.success("Article created");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: typeof form }) => {
      const { error } = await supabase.from("news").update({
        title: payload.title,
        summary: payload.summary || null,
        content: payload.content,
        category: payload.category,
        is_published: payload.is_published,
        is_featured: payload.is_featured,
        image_url: payload.image_url || null,
        pdf_url: payload.pdf_url || null,
        pdf_file_size: payload.pdf_file_size ? parseInt(payload.pdf_file_size) : null,
        published_at: payload.is_published ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_news"] });
      toast.success("Article updated");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_news"] });
      toast.success("Article deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setImageFile(null);
    setPdfFile(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  }

  function startEdit(article: NewsArticle) {
    setForm({
      title: article.title,
      summary: article.summary || "",
      content: article.content,
      category: article.category,
      is_published: article.is_published,
      is_featured: article.is_featured,
      image_url: article.image_url || "",
      pdf_url: article.pdf_url || "",
      pdf_file_size: article.pdf_file_size?.toString() || "",
    });
    setEditingId(article.id);
    setShowForm(true);
    setImageFile(null);
    setPdfFile(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");

    setUploading(true);
    try {
      let imageUrl = form.image_url;
      let pdfUrl = form.pdf_url;
      let pdfSize = form.pdf_file_size;

      // Upload image if selected
      if (imageFile) {
        imageUrl = await uploadFile("news-images", imageFile);
      }

      // Upload PDF if selected
      if (pdfFile) {
        pdfUrl = await uploadFile("news-pdfs", pdfFile);
        pdfSize = pdfFile.size.toString();
      }

      const payload = { ...form, image_url: imageUrl, pdf_url: pdfUrl, pdf_file_size: pdfSize };

      if (editingId) {
        updateMutation.mutate({ id: editingId, payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  }

  const filtered = filterCategory === "all"
    ? articles
    : articles.filter(a => a.category === filterCategory);

  const stats = {
    total: articles.length,
    published: articles.filter(a => a.is_published).length,
    drafts: articles.filter(a => !a.is_published).length,
    featured: articles.filter(a => a.is_featured).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">News Management</h2>
          <p className="text-gray-600 mt-1">Create and manage news articles</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Create News
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Articles", value: stats.total, icon: Newspaper },
          { label: "Published", value: stats.published, icon: Eye },
          { label: "Drafts", value: stats.drafts, icon: EyeOff },
          { label: "Featured", value: stats.featured, icon: Star },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{s.label}</p>
              <s.icon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit News Article" : "Create News Article"}
              </h3>
              <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                <input
                  value={form.summary}
                  onChange={e => setForm({ ...form, summary: e.target.value })}
                  placeholder="Brief summary for preview"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
                  >
                    <Upload className="h-4 w-4" /> Pick Image
                  </button>
                  <span className="text-xs text-gray-500 truncate flex-1">
                    {imageFile ? imageFile.name : form.image_url ? "Current: " + form.image_url.split("/").pop() : "No file selected"}
                  </span>
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { if (e.target.files?.[0]) setImageFile(e.target.files[0]); }}
                />
                {(imageFile || form.image_url) && (
                  <div className="mt-2 h-20 w-32 rounded border border-gray-200 overflow-hidden bg-gray-50">
                    <img
                      src={imageFile ? URL.createObjectURL(imageFile) : form.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value as NewsCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PDF Attachment</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
                  >
                    <Upload className="h-4 w-4" /> Pick PDF
                  </button>
                  <span className="text-xs text-gray-500 truncate flex-1">
                    {pdfFile
                      ? `${pdfFile.name} (${(pdfFile.size / 1024).toFixed(1)} KB)`
                      : form.pdf_url
                        ? "Current: " + form.pdf_url.split("/").pop()
                        : "No file selected"}
                  </span>
                </div>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={e => { if (e.target.files?.[0]) setPdfFile(e.target.files[0]); }}
                />
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={e => setForm({ ...form, is_published: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">Publish immediately</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={e => setForm({ ...form, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">Feature on home page</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  {uploading ? "Uploading files…" : editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold text-gray-700">All News Articles</h3>
          <span className="text-xs text-gray-500">({filtered.length} articles)</span>
        </div>
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterCategory === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            All
          </button>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${filterCategory === c ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Articles List */}
        {isLoading ? (
          <p className="text-sm text-gray-500 py-8 text-center">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No articles found</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(article => (
              <div key={article.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {article.image_url && <ImageIcon className="h-3.5 w-3.5 text-gray-400" />}
                      {article.pdf_url && <FileText className="h-3.5 w-3.5 text-gray-400" />}
                      <h4 className="text-sm font-semibold text-gray-900 truncate">{article.title}</h4>
                    </div>
                    {article.summary && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-1">{article.summary}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{article.author_name || "Unknown"}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(article.created_at).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${categoryColors[article.category]}`}>
                        {article.category}
                      </span>
                      {article.is_published ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">Published</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">Draft</span>
                      )}
                      {article.is_featured && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700">Featured</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(article)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Edit">
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => { if (confirm("Delete this article?")) deleteMutation.mutate(article.id); }}
                      className="p-1.5 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
