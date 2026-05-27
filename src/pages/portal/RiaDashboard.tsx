import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import PageLayout from "@/components/layout/PageLayout";
import StaffLayout from "@/components/layout/StaffLayout";
import { toast } from "sonner";
import { sendRiaNotification } from "@/utils/sendRiaNotification";
import {
  Send, FileText, Search, Upload, CheckCircle2, Clock, Circle,
  XCircle, AlertCircle, Eye, ChevronDown, ChevronUp, ArrowLeft,
} from "lucide-react";
import {
  RiaSubmission,
  RiaStageHistory,
  RiaSubmissionRequest,
  RIA_ORGANIZATION_TYPE_LABELS,
  RIA_REGULATION_TYPE_LABELS,
  RIA_STATUS_LABELS,
  RIA_STATUS_COLORS,
  RIA_SECTORS,
  RIA_STAGES,
  RiaOrganizationType,
  RiaRegulationType,
  RiaStatus,
} from "@/types/ria";

export default function RiaDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  const isStaff = user && (user.role === "staff" || user.role === "admin");

  const content = (
    <RiaContent
      userId={user?.id || ""}
      userEmail={user?.email || ""}
      userName={user?.name || ""}
      userRole={user?.role || ""}
      isAuthenticated={!!user}
    />
  );

  if (isStaff) {
    return (
      <StaffLayout activeTab="ria-my">
        <div className="space-y-6">
          {/* Back button */}
          <button
            onClick={() => navigate("/portal/dashboard")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          {content}
        </div>
      </StaffLayout>
    );
  }

  return (
    <PageLayout>
      <section className="py-12 container-wide">
        {content}
      </section>
    </PageLayout>
  );
}

function RiaContent({ userId, userEmail, userName, userRole, isAuthenticated }: { userId: string; userEmail: string; userName: string; userRole: string; isAuthenticated: boolean }) {
  const [activeTab, setActiveTab] = useState<"submissions" | "submit" | "track">(isAuthenticated ? "submissions" : "submit");
  const queryClient = useQueryClient();

  const navItems = [
    { id: "submissions" as const, label: "My Submissions", icon: FileText },
    { id: "submit" as const, label: "Submit RIA", icon: Send },
    { id: "track" as const, label: "Track Submission", icon: Search },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left sidebar panel */}
      <div className="lg:w-72 flex-shrink-0">
        <div className="lg:sticky lg:top-24 space-y-6">
          {/* Welcome card */}
          <div className="bg-noir-elevated border border-border rounded-sm p-6">
            {isAuthenticated ? (
              <>
                <p className="text-xs font-mono uppercase tracking-[0.15em] text-primary mb-2">Welcome</p>
                <h2 className="font-display text-xl font-bold mb-1">{userName || "User"}</h2>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </>
            ) : (
              <>
                <p className="text-xs font-mono uppercase tracking-[0.15em] text-primary mb-2">RIA Portal</p>
                <h2 className="font-display text-lg font-bold mb-2">Submit a Regulatory Impact Assessment</h2>
                <p className="text-xs text-muted-foreground mb-4">Register or login to request submission of your RIA.</p>
                <div className="flex flex-col gap-2">
                  <a href="/portal/register" className="block text-center px-4 py-2.5 bg-gradient-gold text-primary-foreground text-xs font-semibold rounded-sm hover:shadow-gold transition-all">
                    Register
                  </a>
                  <a href="/portal/login" className="block text-center px-4 py-2.5 border border-border text-xs font-medium rounded-sm hover:border-primary hover:text-primary transition-colors">
                    Login
                  </a>
                </div>
              </>
            )}
          </div>

          {/* RIA Navigation */}
          <div className="bg-noir-elevated border border-border rounded-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">RIA Functions</p>
            </div>
            <nav className="p-2 space-y-0.5">
              {navItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-medium transition-colors text-left ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Right content area */}
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold mb-2">
            {activeTab === "submissions" ? "My Submissions" : activeTab === "submit" ? "Submit RIA" : "Track Submission"}
          </h1>
          <p className="text-muted-foreground">
            {activeTab === "submissions"
              ? "View and monitor your Regulatory Impact Assessment submissions."
              : activeTab === "submit"
              ? (userRole === "staff" || userRole === "admin")
                ? "Submit a new Regulatory Impact Assessment for review."
                : "Request permission to submit a Regulatory Impact Assessment."
              : "Track the status of any RIA using its tracking number."}
          </p>
        </div>

        {/* Login required prompt for unauthenticated users on protected tabs */}
        {!isAuthenticated && activeTab !== "track" ? (
          <div className="bg-noir-elevated border border-border rounded-sm p-10 text-center">
            <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">Login Required</h3>
            <p className="text-muted-foreground text-sm mb-6">
              You need to register or login to {activeTab === "submit" ? "request to submit a RIA" : "view your submissions"}.
            </p>
            <div className="flex items-center justify-center gap-3">
              <a href="/portal/register" className="px-6 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all text-sm">
                Register
              </a>
              <a href="/portal/login" className="px-6 py-3 border border-border font-medium rounded-sm hover:border-primary hover:text-primary transition-colors text-sm">
                Login
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              After registering, you can submit a request. Once approved by staff, you'll receive an email and can submit your full RIA.
            </p>
          </div>
        ) : (
          <>
            {activeTab === "submissions" && <SubmissionsTab userId={userId} userEmail={userEmail} />}
            {activeTab === "submit" && (
              (userRole === "staff" || userRole === "admin") ? (
                <SubmitTab
                  userId={userId}
                  userEmail={userEmail}
                  userName={userName}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["my_ria_submissions"] });
                    setActiveTab("submissions");
                  }}
                />
              ) : (
                <RequestToSubmitTab
                  userId={userId}
                  userEmail={userEmail}
                  userName={userName}
                  onApprovedSubmit={() => {
                    queryClient.invalidateQueries({ queryKey: ["my_ria_submissions"] });
                    setActiveTab("submissions");
                  }}
                />
              )
            )}
            {activeTab === "track" && <TrackTab />}
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// My Submissions Tab
// =============================================================================
function SubmissionsTab({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["my_ria_submissions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ria_submissions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as RiaSubmission[];
    },
  });

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-12">Loading submissions…</p>;
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-16 bg-noir-elevated border border-border rounded-sm">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl font-bold mb-2">No submissions yet</h3>
        <p className="text-muted-foreground">Submit your first Regulatory Impact Assessment to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map(sub => (
        <SubmissionCard
          key={sub.id}
          submission={sub}
          expanded={expandedId === sub.id}
          onToggle={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
        />
      ))}
    </div>
  );
}

function SubmissionCard({ submission, expanded, onToggle }: {
  submission: RiaSubmission;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [stageHistory, setStageHistory] = useState<RiaStageHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    if (stageHistory.length > 0) return;
    setLoadingHistory(true);
    const { data } = await (supabase as any)
      .from("ria_stage_history")
      .select("*")
      .eq("submission_id", submission.id)
      .order("created_at", { ascending: true });
    setStageHistory(data || []);
    setLoadingHistory(false);
  };

  const handleToggle = () => {
    if (!expanded) loadHistory();
    onToggle();
  };

  return (
    <div className="bg-noir-elevated border border-border rounded-sm overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-xs text-primary">{submission.tracking_number}</span>
              <span className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded border ${RIA_STATUS_COLORS[submission.status]}`}>
                {RIA_STATUS_LABELS[submission.status]}
              </span>
            </div>
            <p className="font-medium text-sm truncate">{submission.title}</p>
            <p className="text-xs text-muted-foreground">{submission.organization} · {submission.sector}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground">Stage {submission.current_stage}/15</p>
            <div className="w-24 h-1.5 bg-muted rounded-full mt-1">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${submission.progress_percentage}%` }}
              />
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 ml-3" /> : <ChevronDown className="h-4 w-4 ml-3" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-border pt-4">
          <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm">
            <div><span className="text-muted-foreground">Regulation Type:</span> <span className="font-medium ml-1">{RIA_REGULATION_TYPE_LABELS[submission.regulation_type]}</span></div>
            <div><span className="text-muted-foreground">Submitted:</span> <span className="font-medium ml-1">{formatDate(submission.created_at)}</span></div>
            <div><span className="text-muted-foreground">Current Stage:</span> <span className="font-medium ml-1">{submission.stage_name}</span></div>
            {submission.assigned_officer_name && (
              <div><span className="text-muted-foreground">Assigned Officer:</span> <span className="font-medium ml-1">{submission.assigned_officer_name}</span></div>
            )}
          </div>

          {/* Timeline */}
          <h4 className="text-xs font-mono uppercase tracking-wider text-primary mb-3">Progress Timeline</h4>
          {loadingHistory ? (
            <p className="text-sm text-muted-foreground">Loading timeline…</p>
          ) : (
            <div className="space-y-0">
              {RIA_STAGES.map((stage) => {
                const isCompleted = submission.current_stage > stage.number;
                const isCurrent = submission.current_stage === stage.number;
                const historyEntry = stageHistory.find(h => h.stage_number === stage.number);

                return (
                  <div key={stage.number} className="flex items-start gap-3 py-2">
                    <div className="flex flex-col items-center">
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : isCurrent ? (
                        <Clock className="h-4 w-4 text-primary animate-pulse" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className={`flex-1 ${!isCompleted && !isCurrent ? "opacity-50" : ""}`}>
                      <p className={`text-xs font-medium ${isCurrent ? "text-primary" : ""}`}>
                        {stage.name}
                        {isCurrent && <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Current</span>}
                      </p>
                      {historyEntry?.notes && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{historyEntry.notes}</p>
                      )}
                      {historyEntry && (
                        <p className="text-[10px] text-muted-foreground/70">{formatDate(historyEntry.created_at)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Submit RIA Tab
// =============================================================================
function SubmitTab({ userId, userEmail, userName, onSuccess, prefillOrganization, prefillTitle, prefillSector, prefillOrgType }: {
  userId: string; userEmail: string; userName: string; onSuccess: () => void;
  prefillOrganization?: string; prefillTitle?: string; prefillSector?: string; prefillOrgType?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentPath, setDocumentPath] = useState("");
  const [documentFilename, setDocumentFilename] = useState("");

  const [formData, setFormData] = useState({
    submitter_name: userName,
    submitter_email: userEmail,
    submitter_phone: "",
    organization: prefillOrganization || "",
    organization_type: (prefillOrgType || "other") as RiaOrganizationType,
    title: prefillTitle || "",
    description: "",
    sector: prefillSector || RIA_SECTORS[0],
    regulation_type: "new_regulation" as RiaRegulationType,
  });

  const generateTrackingNumber = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `RIA-${year}-${randomNum}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, DOC, and DOCX files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB.");
      return;
    }

    setSelectedFile(file);
    setDocumentFilename(file.name);
    toast.success("Document selected. It will be uploaded on submission.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.submitter_name || !formData.submitter_email || !formData.organization || !formData.title || !formData.description) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const trackingNumber = generateTrackingNumber();

      // Upload document to folder named after RIA number
      let uploadedPath = "";
      let uploadedFilename = "";
      if (selectedFile) {
        setUploading(true);
        const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        uploadedPath = `${trackingNumber}/${sanitizedName}`;

        const { error: uploadError } = await supabase.storage
          .from("ria-documents")
          .upload(uploadedPath, selectedFile, { upsert: true });

        if (uploadError) throw new Error("Document upload failed: " + uploadError.message);
        uploadedFilename = selectedFile.name;
        setUploading(false);
      }

      // Insert submission
      const { data, error } = await (supabase as any)
        .from("ria_submissions")
        .insert({
          tracking_number: trackingNumber,
          user_id: userId,
          submitter_name: formData.submitter_name,
          submitter_email: formData.submitter_email,
          submitter_phone: formData.submitter_phone || null,
          organization: formData.organization,
          organization_type: formData.organization_type,
          title: formData.title,
          description: formData.description,
          sector: formData.sector,
          regulation_type: formData.regulation_type,
          document_filename: uploadedFilename || null,
          document_path: uploadedPath || null,
          status: "submitted",
          current_stage: 1,
          stage_name: "Submission Received",
          progress_percentage: 7,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert initial stage history
      await (supabase as any)
        .from("ria_stage_history")
        .insert({
          submission_id: data.id,
          stage_number: 1,
          stage_name: "Submission Received",
          notes: "RIA submission received and logged in the system.",
        });

      // Send email with tracking number
      try {
        await sendRiaNotification({
          notification_type: "ria_submitted",
          ria_title: formData.title,
          organization: formData.organization,
          tracking_number: trackingNumber,
          requester_name: formData.submitter_name,
          recipients: [{ name: formData.submitter_name, email: formData.submitter_email, role: "Requester" }],
        });
      } catch {
        console.warn("[RIA Email] Confirmation email could not be sent.");
      }

      toast.success(`Submission successful! Tracking number: ${trackingNumber}`);

      // Reset form
      setFormData({
        submitter_name: userName,
        submitter_email: userEmail,
        submitter_phone: "",
        organization: "",
        organization_type: "other",
        title: "",
        description: "",
        sector: RIA_SECTORS[0],
        regulation_type: "new_regulation",
      });
      setSelectedFile(null);
      setDocumentPath("");
      setDocumentFilename("");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Information */}
      <div className="bg-noir-elevated border border-border rounded-sm p-6">
        <h3 className="font-display text-lg font-bold mb-4">Contact Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Full Name" required value={formData.submitter_name} onChange={v => update("submitter_name", v)} />
          <FormField label="Email Address" required type="email" value={formData.submitter_email} onChange={v => update("submitter_email", v)} />
          <FormField label="Phone Number" value={formData.submitter_phone} onChange={v => update("submitter_phone", v)} />
          <FormField label="Organization" required value={formData.organization} onChange={v => update("organization", v)} />
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
              Organization Type <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.organization_type}
              onChange={e => update("organization_type", e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
              required
            >
              {Object.entries(RIA_ORGANIZATION_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Regulation Details */}
      <div className="bg-noir-elevated border border-border rounded-sm p-6">
        <h3 className="font-display text-lg font-bold mb-4">Regulation Details</h3>
        <div className="space-y-4">
          <FormField label="Title of Proposed Regulation" required value={formData.title} onChange={v => update("title", v)} />
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                Sector <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.sector}
                onChange={e => update("sector", e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
                required
              >
                {RIA_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                Regulation Type <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.regulation_type}
                onChange={e => update("regulation_type", e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
                required
              >
                {Object.entries(RIA_REGULATION_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
              Description / Rationale <span className="text-destructive">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={e => update("description", e.target.value)}
              rows={5}
              className="w-full px-4 py-3 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary resize-none"
              placeholder="Provide a summary of the proposed regulation and its intended purpose..."
              required
            />
          </div>
        </div>
      </div>

      {/* Document Upload */}
      <div className="bg-noir-elevated border border-border rounded-sm p-6">
        <h3 className="font-display text-lg font-bold mb-4">Supporting Document</h3>
        <p className="text-xs text-muted-foreground mb-4">Upload a supporting document (PDF, DOC, DOCX — max 10MB)</p>
        {selectedFile ? (
          <div className="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-sm">
            <FileText className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button type="button" onClick={() => { setSelectedFile(null); setDocumentPath(""); setDocumentFilename(""); }} className="text-xs text-destructive hover:underline">Remove</button>
          </div>
        ) : (
          <label className="block border-2 border-dashed border-border rounded-sm p-8 text-center hover:border-primary transition-colors cursor-pointer">
            <Upload className="h-8 w-8 text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Click to select or drop a file here</p>
            <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} disabled={uploading} />
          </label>
        )}
        {uploading && <p className="text-xs text-primary mt-2 animate-pulse">Uploading…</p>}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || uploading}
        className="w-full px-6 py-4 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      >
        <Send className="h-4 w-4" />
        {submitting ? "Submitting…" : "Submit RIA"}
      </button>
    </form>
  );
}

// =============================================================================
// Request to Submit Tab (Regular Users)
// =============================================================================
function RequestToSubmitTab({ userId, userEmail, userName, onApprovedSubmit }: {
  userId: string; userEmail: string; userName: string; onApprovedSubmit: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<RiaSubmissionRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState<string | null>(null); // approved request id
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    organization: "",
    organization_type: "other" as RiaOrganizationType,
    title: "",
    purpose: "",
    sector: RIA_SECTORS[0],
  });

  // Fetch user's requests
  useEffect(() => {
    (async () => {
      setLoadingRequests(true);
      const { data } = await (supabase as any)
        .from("ria_submission_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setRequests((data || []) as RiaSubmissionRequest[]);
      setLoadingRequests(false);
    })();
  }, [userId]);

  const refreshRequests = async () => {
    const { data } = await (supabase as any)
      .from("ria_submission_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setRequests((data || []) as RiaSubmissionRequest[]);
  };

  const hasPending = requests.some(r => r.status === "pending");

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organization || !formData.title || !formData.purpose) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from("ria_submission_requests")
        .insert({
          user_id: userId,
          user_name: userName,
          user_email: userEmail,
          organization: formData.organization,
          organization_type: formData.organization_type,
          title: formData.title,
          purpose: formData.purpose,
          sector: formData.sector,
          status: "pending",
        });
      if (error) throw error;

      const emailBase = {
        ria_title: formData.title,
        organization: formData.organization,
        requester_name: userName,
      };

      try {
        // Confirm to requester: your request is under review
        await sendRiaNotification({
          ...emailBase,
          notification_type: "request_submitted",
          recipients: [{ name: userName, email: userEmail, role: "Requester" }],
        });

        // Notify all active staff recipients (action required)
        const { data: notifRecipients } = await (supabase as any)
          .from("ria_notification_recipients")
          .select("name, email")
          .eq("is_active", true);

        if (notifRecipients && notifRecipients.length > 0) {
          // Use the same notification_type that works for the requester confirmation,
          // so staff get an email via the existing deployed function (no new SQL needed).
          await sendRiaNotification({
            ...emailBase,
            notification_type: "request_submitted",
            recipients: notifRecipients.map((r: { name: string; email: string }) => ({
              name: r.name,
              email: r.email,
              role: "BRRA Staff",
            })),
          });
        }
      } catch {
        console.warn("[RIA Email] Notification could not be sent.");
      }

      toast.success("Request submitted! You will receive an email confirmation. Staff will review your request.");
      setFormData({ organization: "", organization_type: "other", title: "", purpose: "", sector: RIA_SECTORS[0] });
      refreshRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  // If user clicked "Proceed to Submit" on an approved request, show the full submit form
  if (showSubmitForm) {
    const approvedReq = requests.find(r => r.id === showSubmitForm);
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowSubmitForm(null)}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          ← Back to requests
        </button>
        <SubmitTab
          userId={userId}
          userEmail={userEmail}
          userName={userName}
          prefillOrganization={approvedReq?.organization}
          prefillTitle={approvedReq?.title}
          prefillSector={approvedReq?.sector}
          prefillOrgType={approvedReq?.organization_type}
          onSuccess={() => {
            onApprovedSubmit();
          }}
        />
      </div>
    );
  }

  const [activeSubTab, setActiveSubTab] = useState<"request" | "history">("request");

  return (
    <div className="space-y-6">
      {/* Sub-tab switcher */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveSubTab("request")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeSubTab === "request" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Send className="h-3.5 w-3.5 inline mr-2" />
          New Request
        </button>
        <button
          onClick={() => setActiveSubTab("history")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeSubTab === "history" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <FileText className="h-3.5 w-3.5 inline mr-2" />
          My Requests
          {requests.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded-full font-semibold">{requests.length}</span>
          )}
        </button>
      </div>

      {/* New Request Tab */}
      {activeSubTab === "request" && (
        <>
          {hasPending ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-6 text-center">
              <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
              <p className="font-medium text-yellow-800">You have a pending request</p>
              <p className="text-xs text-yellow-700 mt-1">Please wait for staff to review your current request before submitting another.</p>
              <button
                onClick={() => setActiveSubTab("history")}
                className="mt-3 text-xs text-primary hover:underline"
              >
                View your requests →
              </button>
            </div>
          ) : (
            <form onSubmit={handleRequestSubmit} className="space-y-6">
              <div className="bg-noir-elevated border border-border rounded-sm p-6">
                <h3 className="font-display text-lg font-bold mb-1">Request to Submit RIA</h3>
                <p className="text-xs text-muted-foreground mb-4">Provide details about the regulation you wish to submit for impact assessment. Staff will review and approve your request.</p>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField label="Organization" required value={formData.organization} onChange={v => update("organization", v)} />
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                        Organization Type <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={formData.organization_type}
                        onChange={e => update("organization_type", e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
                        required
                      >
                        {Object.entries(RIA_ORGANIZATION_TYPE_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <FormField label="Title of Proposed Regulation" required value={formData.title} onChange={v => update("title", v)} />
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                      Sector <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={formData.sector}
                      onChange={e => update("sector", e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
                      required
                    >
                      {RIA_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
                      Purpose / Rationale <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      value={formData.purpose}
                      onChange={e => update("purpose", e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary resize-none"
                      placeholder="Briefly explain the purpose and rationale of the proposed regulation..."
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-4 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
            </form>
          )}
        </>
      )}

      {/* My Requests (History) Tab */}
      {activeSubTab === "history" && (
        <>
          {loadingRequests ? (
            <p className="text-center text-muted-foreground py-8">Loading your requests…</p>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No requests yet</p>
              <button onClick={() => setActiveSubTab("request")} className="mt-2 text-xs text-primary hover:underline">
                Submit your first request →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => {
                const statusStyles = {
                  pending: "bg-yellow-50 border-yellow-200 text-yellow-700",
                  approved: "bg-green-50 border-green-200 text-green-700",
                  rejected: "bg-red-50 border-red-200 text-red-700",
                };
                const statusLabels = { pending: "Pending Review", approved: "Approved", rejected: "Rejected" };
                return (
                  <div key={req.id} className="bg-noir-elevated border border-border rounded-sm p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{req.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{req.organization} · {req.sector}</p>
                        <p className="text-xs text-muted-foreground mt-1">{req.purpose}</p>
                        {req.rejection_reason && (
                          <p className="text-xs text-red-600 mt-1">Reason: {req.rejection_reason}</p>
                        )}
                        {req.reviewed_by_name && (
                          <p className="text-[10px] text-muted-foreground mt-1">Reviewed by {req.reviewed_by_name} on {new Date(req.reviewed_at!).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Submitted {new Date(req.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${statusStyles[req.status]}`}>
                          {statusLabels[req.status]}
                        </span>
                        {req.status === "approved" && (
                          <button
                            onClick={() => setShowSubmitForm(req.id)}
                            className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity"
                          >
                            Proceed to Submit →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// =============================================================================
// Track Tab
// =============================================================================
function TrackTab() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<RiaSubmission | null>(null);
  const [stageHistory, setStageHistory] = useState<RiaStageHistory[]>([]);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setSearching(true);
    setNotFound(false);
    setResult(null);

    try {
      const { data, error } = await (supabase as any)
        .from("ria_submissions")
        .select("*")
        .eq("tracking_number", trackingNumber.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;
      if (!data) { setNotFound(true); return; }

      setResult(data);

      // Fetch stage history
      const { data: history } = await (supabase as any)
        .from("ria_stage_history")
        .select("*")
        .eq("submission_id", data.id)
        .order("created_at", { ascending: true });
      setStageHistory(history || []);
    } catch {
      toast.error("Error searching. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={trackingNumber}
            onChange={e => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking number (e.g. RIA-2026-12345)"
            className="w-full pl-12 pr-4 py-3 bg-noir-elevated border border-border rounded-sm text-sm font-mono uppercase focus:outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={searching || !trackingNumber.trim()}
          className="px-6 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all disabled:opacity-60"
        >
          {searching ? "…" : "Track"}
        </button>
      </form>

      {notFound && (
        <div className="text-center py-8 bg-noir-elevated border border-border rounded-sm">
          <XCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
          <p className="text-muted-foreground">No submission found with that tracking number.</p>
        </div>
      )}

      {result && (
        <div className="bg-noir-elevated border border-border rounded-sm p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Reference</p>
              <p className="font-mono text-lg text-gradient-gold font-bold">{result.tracking_number}</p>
            </div>
            <span className={`inline-block px-3 py-1 text-xs font-mono rounded border ${RIA_STATUS_COLORS[result.status]}`}>
              {RIA_STATUS_LABELS[result.status]}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-sm mb-6">
            <div><span className="text-muted-foreground">Title:</span> <span className="font-medium ml-1">{result.title}</span></div>
            <div><span className="text-muted-foreground">Organization:</span> <span className="font-medium ml-1">{result.organization}</span></div>
            <div><span className="text-muted-foreground">Sector:</span> <span className="font-medium ml-1">{result.sector}</span></div>
            <div><span className="text-muted-foreground">Stage:</span> <span className="font-medium ml-1">{result.stage_name} ({result.current_stage}/15)</span></div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{result.progress_percentage}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${result.progress_percentage}%` }} />
            </div>
          </div>

          {/* Timeline */}
          <h4 className="text-xs font-mono uppercase tracking-wider text-primary mb-3">Timeline</h4>
          <div className="space-y-0">
            {RIA_STAGES.map(stage => {
              const isCompleted = result.current_stage > stage.number;
              const isCurrent = result.current_stage === stage.number;
              const historyEntry = stageHistory.find(h => h.stage_number === stage.number);

              return (
                <div key={stage.number} className="flex items-start gap-3 py-2">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  ) : isCurrent ? (
                    <Clock className="h-4 w-4 text-primary animate-pulse mt-0.5" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40 mt-0.5" />
                  )}
                  <div className={`flex-1 ${!isCompleted && !isCurrent ? "opacity-40" : ""}`}>
                    <p className={`text-xs font-medium ${isCurrent ? "text-primary" : ""}`}>
                      {stage.name}
                      {isCurrent && <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Current</span>}
                    </p>
                    {historyEntry?.notes && <p className="text-[11px] text-muted-foreground mt-0.5">{historyEntry.notes}</p>}
                    {historyEntry && <p className="text-[10px] text-muted-foreground/70">{formatDate(historyEntry.created_at)}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Shared Components & Utilities
// =============================================================================
function FormField({ label, value, onChange, required, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-primary mb-2">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-3 bg-background border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
      />
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
