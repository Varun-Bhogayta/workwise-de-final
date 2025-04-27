export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'jobseeker' | 'employer'
          full_name: string | null
          avatar_url: string | null
          title: string | null
          bio: string | null
          location: string | null
          phone: string | null
          skills: string[] | null
          experience: Json[] | null
          education: Json[] | null
          company_name: string | null
          company_size: string | null
          company_industry: string | null
          company_description: string | null
          company_logo_url: string | null
          company_website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'jobseeker' | 'employer'
          full_name?: string | null
          avatar_url?: string | null
          title?: string | null
          bio?: string | null
          location?: string | null
          phone?: string | null
          skills?: string[] | null
          experience?: Json[] | null
          education?: Json[] | null
          company_name?: string | null
          company_size?: string | null
          company_industry?: string | null
          company_description?: string | null
          company_logo_url?: string | null
          company_website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'jobseeker' | 'employer'
          full_name?: string | null
          avatar_url?: string | null
          title?: string | null
          bio?: string | null
          location?: string | null
          phone?: string | null
          skills?: string[] | null
          experience?: Json[] | null
          education?: Json[] | null
          company_name?: string | null
          company_size?: string | null
          company_industry?: string | null
          company_description?: string | null
          company_logo_url?: string | null
          company_website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          employer_id: string
          title: string
          description: string
          requirements: string
          type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Remote'
          location: string
          salary_min: number | null
          salary_max: number | null
          salary_currency: string
          is_remote: boolean
          skills: string[] | null
          experience_min: number | null
          experience_max: number | null
          education_level: string | null
          application_deadline: string | null
          is_active: boolean
          is_featured: boolean
          views: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employer_id: string
          title: string
          description: string
          requirements: string
          type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Remote'
          location: string
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string
          is_remote?: boolean
          skills?: string[] | null
          experience_min?: number | null
          experience_max?: number | null
          education_level?: string | null
          application_deadline?: string | null
          is_active?: boolean
          is_featured?: boolean
          views?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employer_id?: string
          title?: string
          description?: string
          requirements?: string
          type?: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Remote'
          location?: string
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string
          is_remote?: boolean
          skills?: string[] | null
          experience_min?: number | null
          experience_max?: number | null
          education_level?: string | null
          application_deadline?: string | null
          is_active?: boolean
          is_featured?: boolean
          views?: number
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          job_id: string
          applicant_id: string
          resume_url: string
          cover_letter: string | null
          status: 'Pending' | 'Reviewed' | 'Shortlisted' | 'Rejected' | 'Interviewed' | 'Offered' | 'Hired'
          employer_notes: string | null
          interview_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          applicant_id: string
          resume_url: string
          cover_letter?: string | null
          status?: 'Pending' | 'Reviewed' | 'Shortlisted' | 'Rejected' | 'Interviewed' | 'Offered' | 'Hired'
          employer_notes?: string | null
          interview_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          applicant_id?: string
          resume_url?: string
          cover_letter?: string | null
          status?: 'Pending' | 'Reviewed' | 'Shortlisted' | 'Rejected' | 'Interviewed' | 'Offered' | 'Hired'
          employer_notes?: string | null
          interview_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'jobseeker' | 'employer'
      job_type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Remote'
      application_status: 'Pending' | 'Reviewed' | 'Shortlisted' | 'Rejected' | 'Interviewed' | 'Offered' | 'Hired'
    }
  }
}