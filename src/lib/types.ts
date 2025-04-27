export enum UserRole {
  JOBSEEKER = "jobseeker",
  EMPLOYER = "employer",
}

export enum JobType {
  FULL_TIME = "Full-time",
  PART_TIME = "Part-time",
  CONTRACT = "Contract",
  INTERNSHIP = "Internship",
  REMOTE = "Remote",
}

export enum ApplicationStatus {
  PENDING = "Pending",
  REVIEWED = "Reviewed",
  SHORTLISTED = "Shortlisted",
  REJECTED = "Rejected",
  INTERVIEWED = "Interviewed",
  OFFERED = "Offered",
  HIRED = "Hired",
}

export const JOB_CATEGORIES = [
  "Technology",
  "Design",
  "Marketing",
  "Sales",
  "Customer Service",
  "Finance",
  "Human Resources",
  "Engineering",
  "Education",
  "Healthcare",
  "Other",
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  requirements: string;
  type: JobType;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  is_remote: boolean;
  skills: string[] | null;
  experience_min: number | null;
  experience_max: number | null;
  education_level: string | null;
  application_deadline: string | null;
  is_active: boolean;
  is_featured: boolean;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  resume_url: string;
  cover_letter: string | null;
  status: ApplicationStatus;
  employer_notes: string | null;
  interview_date: string | null;
  created_at: string;
  updated_at: string;
}
