import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, X, FileText, Eye, EyeOff, Upload,
  Download, Calendar, FolderOpen, Search, FileUp,
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function uploadDocument(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("documents").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return `${SUPABASE_URL}/storage/v1/object/public/documents/${fileName}`;
}

type DocCategory = "strategic_plan" | "annual_report" | "policy_document" | "guideline" | "research_paper" | "newsletter" | "presentation" | "other";

type Document = {
  id: string;
  title: string;
  description: string | null;
  category: DocCategory;
  file_url: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  is_published: boolean;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const categories: DocCategory[] = [
  "strategic_plan", "annual_report", "policy_document", "guideline",
  "research_paper", "newsletter", "presentation", "other",
];

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

const categoryColors: Record<DocCategory, string> = {
  strategic_plan: "bg-blue-100 text-blue-700",
  annual_report: "bg-emerald-100 text-emerald-700",
  policy_document: "bg-amber-100 text-amber-700",
  guideline: "bg-purple-100 text-purple-700",
  research_paper: "bg-rose-100 text-rose-700",
  newsletter: "bg-green-100 text-green-700",
  presentation: "bg-indigo-100 text-indigo-700",
  other: "bg-gray-100 text-gray-700",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const emptyForm = {
  title: "",
  description: "",
  category: "other" as DocCategory,
  is_published: true,
};

export default function AdminDocumentsPage() {
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
    <AdminLayout activeTab="documents">
      <DocumentsManager user={user} />
    </AdminLayout>
  );
}

function DocumentsManager({ user }: { user: { id: string; name: string } }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterCategory, setFilterCategory] = useState<"all" | DocCategory>("all");
  const [search, setSearch] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["admin_documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Document[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { form: typeof emptyForm; fileUrl: string; fileName: string; fileSize: number; fileType: string }) => {
      const { error } = await supabase.from("documents").insert({
        title: payload.form.title,
        description: payload.form.description || null,
        category: payload.form.category,
        file_url: payload.fileUrl,
        file_name: payload.fileName,
        file_size: payload.fileSize,
        file_type: payload.fileType,
        is_published: payload.form.is_published,
        uploaded_by: user.id,
        uploaded_by_name: user.name,
        published_at: payload.form.is_published ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_documents"] });
      toast.success("Document uploaded");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { form: typeof emptyForm; fileUrl?: string; fileName?: string; fileSize?: number; fileType?: string } }) => {
      const updateData: any = {
        title: payload.form.title,
        description: payload.form.description || null,
        category: payload.form.category,
        is_published: payload.form.is_published,
        published_at: payload.form.is_published ? new Date().toISOString() : null,
      };
      if (payload.fileUrl) {
        updateData.file_url = payload.fileUrl;
        updateData.file_name = payload.fileName;
        updateData.file_size = payload.fileSize;
        updateData.file_type = payload.fileType;
      }
      const { error } = await supabase.from("documents").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_documents"] });
      toast.success("Document updated");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_documents"] });
      toast.success("Document deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setDocFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function startEdit(doc: Document) {
    setForm({
      title: doc.title,
      description: doc.description || "",
      category: doc.category,
      is_published: doc.is_published,
    });
    setEditingId(doc.id);
    setShowForm(true);
    setDocFile(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");

    if (!editingId && !docFile) return toast.error("Please select a file to upload");

    setUploading(true);
    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let fileType: string | undefined;

      if (docFile) {
        fileUrl = await uploadDocument(docFile);
        fileName = docFile.name;
        fileSize = docFile.size;
        fileType = docFile.type;
      }

      if (editingId) {
        updateMutation.mutate({ id: editingId, payload: { form, fileUrl, fileName, fileSize, fileType } });
      } else {
        createMutation.mutate({ form, fileUrl: fileUrl!, fileName: fileName!, fileSize: fileSize!, fileType: fileType! });
      }
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  }

  const filtered = documents.filter(d => {
    const matchCategory = filterCategory === "all" || d.category === filterCategory;
    const matchSearch = !search || (d.title + (d.description || "") + d.file_name).toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const stats = {
    total: documents.length,
    published: documents.filter(d => d.is_published).length,
    drafts: documents.filter(d => !d.is_published).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Information Centre</h2>
          <p className="text-gray-600 mt-1">Upload and manage documents, reports, and publications</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Upload Document
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Documents", value: stats.total, icon: FolderOpen },
          { label: "Published", value: stats.published, icon: Eye },
          { label: "Drafts", value: stats.drafts, icon: EyeOff },
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

      {/* Upload Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit Document" : "Upload Document"}
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
                  placeholder="e.g., BRRA Strategic Plan 2024-2028"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description of the document"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value as DocCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{categoryLabels[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document File {editingId ? "(optional — leave blank to keep current)" : "*"}
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
                >
                  {docFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileUp className="h-8 w-8 text-amber-600" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{docFile.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(docFile.size)} · {docFile.type || "Unknown type"}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to select a file</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, etc.</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp"
                  className="hidden"
                  onChange={e => { if (e.target.files?.[0]) setDocFile(e.target.files[0]); }}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={e => setForm({ ...form, is_published: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">Publish immediately (visible to the public)</span>
              </label>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  {uploading ? "Uploading…" : editingId ? "Update" : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
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
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterCategory === c ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {categoryLabels[c]}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-3">{filtered.length} document{filtered.length !== 1 ? "s" : ""}</p>

        {isLoading ? (
          <p className="text-center text-gray-500 py-8">Loading documents...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No documents found</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(doc => (
              <div key={doc.id} className="flex items-center gap-4 py-4 hover:bg-gray-50 px-2 rounded-lg transition-colors">
                {/* File Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{doc.title}</h4>
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${categoryColors[doc.category]}`}>
                      {categoryLabels[doc.category]}
                    </span>
                    {doc.is_published ? (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-green-100 text-green-700">Published</span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-500">Draft</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="truncate">{doc.file_name}</span>
                    {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                    {doc.uploaded_by_name && <span>by {doc.uploaded_by_name}</span>}
                  </div>
                  {doc.description && (
                    <p className="text-xs text-gray-400 mt-1 truncate">{doc.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => startEdit(doc)}
                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm("Delete this document?")) deleteMutation.mutate(doc.id); }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
