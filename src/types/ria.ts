// =============================================================================
// RIA Submission Types
// =============================================================================

export type RiaOrganizationType =
  | "ministry"
  | "agency"
  | "regulatory_body"
  | "parastatal"
  | "local_authority"
  | "private_sector"
  | "other";

export type RiaRegulationType = "new_regulation" | "amendment" | "repeal";

export type RiaStatus = "submitted" | "in_review" | "completed" | "rejected";

export interface RiaSubmission {
  id: string;
  tracking_number: string;
  user_id: string;
  submitter_name: string;
  submitter_email: string;
  submitter_phone: string | null;
  organization: string;
  organization_type: RiaOrganizationType;
  title: string;
  description: string;
  sector: string;
  regulation_type: RiaRegulationType;
  document_filename: string | null;
  document_path: string | null;
  status: RiaStatus;
  current_stage: number;
  stage_name: string;
  progress_percentage: number;
  assigned_officer_id: string | null;
  assigned_officer_name: string | null;
  assigned_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  review_notes: string | null;
  economic_impact: string | null;
  social_impact: string | null;
  environmental_impact: string | null;
  final_report_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiaStageHistory {
  id: string;
  submission_id: string;
  stage_number: number;
  stage_name: string;
  notes: string | null;
  acted_by: string | null;
  acted_by_name: string | null;
  created_at: string;
}

export interface RiaSubmissionRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  organization: string;
  organization_type: string;
  title: string;
  purpose: string;
  sector: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface RiaComment {
  id: string;
  submission_id: string;
  user_id: string | null;
  user_name: string | null;
  comment: string;
  created_at: string;
}

export const RIA_ORGANIZATION_TYPE_LABELS: Record<RiaOrganizationType, string> = {
  ministry: "Ministry",
  agency: "Government Agency",
  regulatory_body: "Regulatory Body",
  parastatal: "Parastatal",
  local_authority: "Local Authority",
  private_sector: "Private Sector",
  other: "Other",
};

export const RIA_REGULATION_TYPE_LABELS: Record<RiaRegulationType, string> = {
  new_regulation: "New Regulation",
  amendment: "Amendment",
  repeal: "Repeal",
};

export const RIA_STATUS_LABELS: Record<RiaStatus, string> = {
  submitted: "Submitted",
  in_review: "In Review",
  completed: "Completed",
  rejected: "Rejected",
};

export const RIA_STATUS_COLORS: Record<RiaStatus, string> = {
  submitted: "bg-blue-100 text-blue-800 border-blue-200",
  in_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

export const RIA_SECTORS = [
  "Trade & Commerce",
  "Agriculture",
  "Mining",
  "Manufacturing",
  "Tourism",
  "Health",
  "Education",
  "Energy",
  "Transport",
  "ICT & Telecommunications",
  "Finance & Banking",
  "Environment",
  "Water & Sanitation",
  "Other",
] as const;

export const RIA_STAGES = [
  { number: 1, name: "Submission Received", progress: 7 },
  { number: 2, name: "Officer Assigned", progress: 13 },
  { number: 3, name: "Initial Review", progress: 20 },
  { number: 4, name: "Stakeholder Identification", progress: 27 },
  { number: 5, name: "Economic Impact Analysis", progress: 33 },
  { number: 6, name: "Social Impact Analysis", progress: 40 },
  { number: 7, name: "Environmental Impact Analysis", progress: 47 },
  { number: 8, name: "Mid-point Review", progress: 53 },
  { number: 9, name: "Report Drafting", progress: 60 },
  { number: 10, name: "Internal Feedback", progress: 67 },
  { number: 11, name: "Final Report", progress: 73 },
  { number: 12, name: "Manager Review", progress: 80 },
  { number: 13, name: "Executive Approval", progress: 87 },
  { number: 14, name: "Communication", progress: 93 },
  { number: 15, name: "Completed & Archived", progress: 100 },
] as const;
