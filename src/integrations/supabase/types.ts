export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          role: "user" | "staff" | "admin"
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string
          email?: string
          role?: "user" | "staff" | "admin"
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: "user" | "staff" | "admin"
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          id: string
          name: string
          code: string | null
          description: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "departments_created_by_fkey"; columns: ["created_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ]
      }
      grades: {
        Row: {
          id: string
          name: string
          level: number | null
          description: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          level?: number | null
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          level?: number | null
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "grades_created_by_fkey"; columns: ["created_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ]
      }
      positions: {
        Row: {
          id: string
          title: string
          department_id: string | null
          description: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          department_id?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          department_id?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "positions_department_id_fkey"; columns: ["department_id"]; referencedRelation: "departments"; referencedColumns: ["id"] },
          { foreignKeyName: "positions_created_by_fkey"; columns: ["created_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ]
      }
      staff_profiles: {
        Row: {
          id: string
          user_id: string | null
          full_name: string
          other_names: string | null
          email: string
          phone: string | null
          nrc_number: string | null
          employee_number: string | null
          department_id: string | null
          position_id: string | null
          grade_id: string | null
          date_joined: string | null
          is_active: boolean
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name: string
          other_names?: string | null
          email: string
          phone?: string | null
          nrc_number?: string | null
          employee_number?: string | null
          department_id?: string | null
          position_id?: string | null
          grade_id?: string | null
          date_joined?: string | null
          is_active?: boolean
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string
          other_names?: string | null
          email?: string
          phone?: string | null
          nrc_number?: string | null
          employee_number?: string | null
          department_id?: string | null
          position_id?: string | null
          grade_id?: string | null
          date_joined?: string | null
          is_active?: boolean
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "staff_profiles_user_id_fkey"; columns: ["user_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "staff_profiles_department_id_fkey"; columns: ["department_id"]; referencedRelation: "departments"; referencedColumns: ["id"] },
          { foreignKeyName: "staff_profiles_position_id_fkey"; columns: ["position_id"]; referencedRelation: "positions"; referencedColumns: ["id"] },
          { foreignKeyName: "staff_profiles_grade_id_fkey"; columns: ["grade_id"]; referencedRelation: "grades"; referencedColumns: ["id"] },
          { foreignKeyName: "staff_profiles_created_by_fkey"; columns: ["created_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ]
      }
      news: {
        Row: {
          id: string
          title: string
          summary: string | null
          content: string
          category: "general" | "newsletter" | "announcement" | "event"
          is_published: boolean
          is_featured: boolean
          image_url: string | null
          pdf_url: string | null
          pdf_file_size: number | null
          author_id: string | null
          author_name: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          summary?: string | null
          content?: string
          category?: "general" | "newsletter" | "announcement" | "event"
          is_published?: boolean
          is_featured?: boolean
          image_url?: string | null
          pdf_url?: string | null
          pdf_file_size?: number | null
          author_id?: string | null
          author_name?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          summary?: string | null
          content?: string
          category?: "general" | "newsletter" | "announcement" | "event"
          is_published?: boolean
          is_featured?: boolean
          image_url?: string | null
          pdf_url?: string | null
          pdf_file_size?: number | null
          author_id?: string | null
          author_name?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "news_author_id_fkey"; columns: ["author_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ]
      }
      documents: {
        Row: {
          id: string
          title: string
          description: string | null
          category: "strategic_plan" | "annual_report" | "policy_document" | "guideline" | "research_paper" | "newsletter" | "presentation" | "other"
          file_url: string
          file_name: string
          file_size: number | null
          file_type: string | null
          is_published: boolean
          uploaded_by: string | null
          uploaded_by_name: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category?: "strategic_plan" | "annual_report" | "policy_document" | "guideline" | "research_paper" | "newsletter" | "presentation" | "other"
          file_url: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          is_published?: boolean
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: "strategic_plan" | "annual_report" | "policy_document" | "guideline" | "research_paper" | "newsletter" | "presentation" | "other"
          file_url?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          is_published?: boolean
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "documents_uploaded_by_fkey"; columns: ["uploaded_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ]
      }
      leave_applications: {
        Row: {
          id: string
          employee_id: string
          user_id: string
          leave_type: "annual" | "sick" | "study" | "maternity" | "paternity" | "compassionate" | "unpaid"
          start_date: string
          end_date: string
          requested_days: number
          leave_address: string | null
          last_leave_end_date: string | null
          months_since_last_leave: number | null
          leave_rate: number
          days_accrued: number | null
          leave_balance: number | null
          status: "pending" | "recommended" | "approved" | "rejected" | "cancelled"
          hod_id: string | null
          hod_recommendation: string | null
          hod_comment: string | null
          hod_date: string | null
          approved_days: number | null
          approver_id: string | null
          approver_comment: string | null
          approval_date: string | null
          rejection_reason: string | null
          attachment_url: string | null
          attachment_name: string | null
          application_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          user_id: string
          leave_type?: "annual" | "sick" | "study" | "maternity" | "paternity" | "compassionate" | "unpaid"
          start_date: string
          end_date: string
          requested_days: number
          leave_address?: string | null
          last_leave_end_date?: string | null
          months_since_last_leave?: number | null
          leave_rate?: number
          days_accrued?: number | null
          leave_balance?: number | null
          status?: "pending" | "recommended" | "approved" | "rejected" | "cancelled"
          hod_id?: string | null
          hod_recommendation?: string | null
          hod_comment?: string | null
          hod_date?: string | null
          approved_days?: number | null
          approver_id?: string | null
          approver_comment?: string | null
          approval_date?: string | null
          rejection_reason?: string | null
          attachment_url?: string | null
          attachment_name?: string | null
          application_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          user_id?: string
          leave_type?: "annual" | "sick" | "study" | "maternity" | "paternity" | "compassionate" | "unpaid"
          start_date?: string
          end_date?: string
          requested_days?: number
          leave_address?: string | null
          last_leave_end_date?: string | null
          months_since_last_leave?: number | null
          leave_rate?: number
          days_accrued?: number | null
          leave_balance?: number | null
          status?: "pending" | "recommended" | "approved" | "rejected" | "cancelled"
          hod_id?: string | null
          hod_recommendation?: string | null
          hod_comment?: string | null
          hod_date?: string | null
          approved_days?: number | null
          approver_id?: string | null
          approver_comment?: string | null
          approval_date?: string | null
          rejection_reason?: string | null
          attachment_url?: string | null
          attachment_name?: string | null
          application_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "leave_applications_employee_id_fkey"; columns: ["employee_id"]; referencedRelation: "staff_profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "leave_applications_user_id_fkey"; columns: ["user_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "leave_applications_hod_id_fkey"; columns: ["hod_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "leave_applications_approver_id_fkey"; columns: ["approver_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ]
      }
      leave_balances: {
        Row: {
          id: string
          employee_id: string
          leave_type: "annual" | "sick" | "study" | "maternity" | "paternity" | "compassionate" | "unpaid"
          total_entitlement: number
          days_taken: number
          days_remaining: number
          year: number
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          leave_type: "annual" | "sick" | "study" | "maternity" | "paternity" | "compassionate" | "unpaid"
          total_entitlement?: number
          days_taken?: number
          days_remaining?: number
          year?: number
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          leave_type?: "annual" | "sick" | "study" | "maternity" | "paternity" | "compassionate" | "unpaid"
          total_entitlement?: number
          days_taken?: number
          days_remaining?: number
          year?: number
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "leave_balances_employee_id_fkey"; columns: ["employee_id"]; referencedRelation: "staff_profiles"; referencedColumns: ["id"] }
        ]
      }
      leave_settings: {
        Row: {
          id: string
          leave_type: "annual" | "sick" | "study" | "maternity" | "paternity" | "compassionate" | "unpaid"
          days_per_year: number
          rate_per_month: number
          requires_attachment: boolean
          max_carry_over: number | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          leave_type: "annual" | "sick" | "study" | "maternity" | "paternity" | "compassionate" | "unpaid"
          days_per_year?: number
          rate_per_month?: number
          requires_attachment?: boolean
          max_carry_over?: number | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          leave_type?: "annual" | "sick" | "study" | "maternity" | "paternity" | "compassionate" | "unpaid"
          days_per_year?: number
          rate_per_month?: number
          requires_attachment?: boolean
          max_carry_over?: number | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      public_holidays: {
        Row: {
          id: string
          name: string
          holiday_date: string
          year: number
          recurring: boolean
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          holiday_date: string
          year?: number
          recurring?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          holiday_date?: string
          year?: number
          recurring?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      annual_leave_applications: {
        Row: {
          id: string
          employee_id: string
          user_id: string
          surname: string
          other_names: string
          personnel_file_no: string | null
          nrc_number: string | null
          department: string
          position: string
          grade: string | null
          annual_salary: number | null
          last_leave_return_date: string | null
          last_leave_commuted_date: string | null
          last_travel_allowance_date: string | null
          leave_days_applied: number
          leave_start_date: string
          days_commuted: number
          total_days_deducted: number
          leave_address: string
          resume_date: string | null
          employee_signature: boolean
          application_date: string
          status: "draft" | "submitted" | "hod_recommended" | "hod_rejected" | "hr_certified" | "hr_rejected" | "approved" | "rejected" | "cancelled"
          leave_balance_before: number | null
          leave_balance_after: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          user_id: string
          surname: string
          other_names: string
          personnel_file_no?: string | null
          nrc_number?: string | null
          department: string
          position: string
          grade?: string | null
          annual_salary?: number | null
          last_leave_return_date?: string | null
          last_leave_commuted_date?: string | null
          last_travel_allowance_date?: string | null
          leave_days_applied: number
          leave_start_date: string
          days_commuted?: number
          total_days_deducted: number
          leave_address: string
          resume_date?: string | null
          employee_signature?: boolean
          application_date?: string
          status?: "draft" | "submitted" | "hod_recommended" | "hod_rejected" | "hr_certified" | "hr_rejected" | "approved" | "rejected" | "cancelled"
          leave_balance_before?: number | null
          leave_balance_after?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          user_id?: string
          surname?: string
          other_names?: string
          personnel_file_no?: string | null
          nrc_number?: string | null
          department?: string
          position?: string
          grade?: string | null
          annual_salary?: number | null
          last_leave_return_date?: string | null
          last_leave_commuted_date?: string | null
          last_travel_allowance_date?: string | null
          leave_days_applied?: number
          leave_start_date?: string
          days_commuted?: number
          total_days_deducted?: number
          leave_address?: string
          resume_date?: string | null
          employee_signature?: boolean
          application_date?: string
          status?: "draft" | "submitted" | "hod_recommended" | "hod_rejected" | "hr_certified" | "hr_rejected" | "approved" | "rejected" | "cancelled"
          leave_balance_before?: number | null
          leave_balance_after?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "annual_leave_employee_fkey"; columns: ["employee_id"]; referencedRelation: "staff_profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "annual_leave_user_fkey"; columns: ["user_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ]
      }
      annual_leave_approvals: {
        Row: {
          id: string
          leave_id: string
          hod_id: string | null
          hod_recommendation: string | null
          hod_correctness_certified: boolean
          hod_employment_status: "established" | "probation" | "agreement" | null
          hod_designation: string | null
          hod_comment: string | null
          hod_signature: boolean
          hod_date: string | null
          hr_officer_id: string | null
          hr_leave_days_brought_forward: number | null
          hr_qualifying_service_from: string | null
          hr_qualifying_service_to: string | null
          hr_grade: string | null
          hr_months_in_service: number | null
          hr_leave_balance: number | null
          hr_certified: boolean
          hr_comment: string | null
          hr_signature: boolean
          hr_date: string | null
          agency_head_id: string | null
          agency_leave_granted_days: number | null
          agency_leave_type: string | null
          agency_resume_duty_date: string | null
          agency_approved: boolean | null
          agency_comment: string | null
          agency_signature: boolean
          agency_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          leave_id: string
          hod_id?: string | null
          hod_recommendation?: string | null
          hod_correctness_certified?: boolean
          hod_employment_status?: "established" | "probation" | "agreement" | null
          hod_designation?: string | null
          hod_comment?: string | null
          hod_signature?: boolean
          hod_date?: string | null
          hr_officer_id?: string | null
          hr_leave_days_brought_forward?: number | null
          hr_qualifying_service_from?: string | null
          hr_qualifying_service_to?: string | null
          hr_grade?: string | null
          hr_months_in_service?: number | null
          hr_leave_balance?: number | null
          hr_certified?: boolean
          hr_comment?: string | null
          hr_signature?: boolean
          hr_date?: string | null
          agency_head_id?: string | null
          agency_leave_granted_days?: number | null
          agency_leave_type?: string | null
          agency_resume_duty_date?: string | null
          agency_approved?: boolean | null
          agency_comment?: string | null
          agency_signature?: boolean
          agency_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          leave_id?: string
          hod_id?: string | null
          hod_recommendation?: string | null
          hod_correctness_certified?: boolean
          hod_employment_status?: "established" | "probation" | "agreement" | null
          hod_designation?: string | null
          hod_comment?: string | null
          hod_signature?: boolean
          hod_date?: string | null
          hr_officer_id?: string | null
          hr_leave_days_brought_forward?: number | null
          hr_qualifying_service_from?: string | null
          hr_qualifying_service_to?: string | null
          hr_grade?: string | null
          hr_months_in_service?: number | null
          hr_leave_balance?: number | null
          hr_certified?: boolean
          hr_comment?: string | null
          hr_signature?: boolean
          hr_date?: string | null
          agency_head_id?: string | null
          agency_leave_granted_days?: number | null
          agency_leave_type?: string | null
          agency_resume_duty_date?: string | null
          agency_approved?: boolean | null
          agency_comment?: string | null
          agency_signature?: boolean
          agency_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "annual_leave_approvals_leave_fkey"; columns: ["leave_id"]; referencedRelation: "annual_leave_applications"; referencedColumns: ["id"] }
        ]
      }
      annual_leave_ledger: {
        Row: {
          id: string
          employee_id: string
          year: number
          opening_balance: number
          days_earned: number
          days_taken: number
          days_commuted: number
          closing_balance: number
          carry_forward_from_previous: number | null
          last_updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          year?: number
          opening_balance?: number
          days_earned?: number
          days_taken?: number
          days_commuted?: number
          closing_balance?: number
          carry_forward_from_previous?: number | null
          last_updated_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          year?: number
          opening_balance?: number
          days_earned?: number
          days_taken?: number
          days_commuted?: number
          closing_balance?: number
          carry_forward_from_previous?: number | null
          last_updated_by?: string | null
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "annual_leave_ledger_employee_fkey"; columns: ["employee_id"]; referencedRelation: "staff_profiles"; referencedColumns: ["id"] }
        ]
      }
      annual_leave_distribution: {
        Row: {
          id: string
          leave_id: string
          recipient_type: string
          recipient_id: string | null
          notification_sent: boolean
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          leave_id: string
          recipient_type: string
          recipient_id?: string | null
          notification_sent?: boolean
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          leave_id?: string
          recipient_type?: string
          recipient_id?: string | null
          notification_sent?: boolean
          sent_at?: string | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "annual_leave_distribution_leave_fkey"; columns: ["leave_id"]; referencedRelation: "annual_leave_applications"; referencedColumns: ["id"] }
        ]
      }
      newsletter_subscribers: {
        Row: {
          id: string
          user_id: string | null
          email: string
          name: string | null
          is_subscribed: boolean
          subscribed_at: string
          unsubscribed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          email: string
          name?: string | null
          is_subscribed?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          email?: string
          name?: string | null
          is_subscribed?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "newsletter_subscribers_user_id_fkey"; columns: ["user_id"]; referencedRelation: "users"; referencedColumns: ["id"] }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_staff_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: "user" | "staff" | "admin"
      news_category: "general" | "newsletter" | "announcement" | "event"
      document_category: "strategic_plan" | "annual_report" | "policy_document" | "guideline" | "research_paper" | "newsletter" | "presentation" | "other"
      leave_type: "annual" | "sick" | "study" | "maternity" | "paternity" | "compassionate" | "unpaid"
      leave_status: "pending" | "recommended" | "approved" | "rejected" | "cancelled"
      annual_leave_status: "draft" | "submitted" | "hod_recommended" | "hod_rejected" | "hr_certified" | "hr_rejected" | "approved" | "rejected" | "cancelled"
      employment_status_type: "established" | "probation" | "agreement"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
