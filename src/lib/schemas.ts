import * as z from "zod";
import { JobType, UserRole } from "./types";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
    role: z.nativeEnum(UserRole),
    name: z.string().min(1, "Name is required").optional(),
    companyName: z.string().min(1, "Company name is required").optional(),
    industry: z.string().min(1, "Industry is required").optional(),
    size: z.string().min(1, "Company size is required").optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.role === UserRole.EMPLOYER) {
        return data.companyName && data.industry && data.size;
      }
      return data.name;
    },
    {
      message: "Please fill in all required fields",
      path: ["role"],
    }
  );

export const jobPostSchema = z
  .object({
    title: z.string().min(1, "Job title is required"),
    location: z.string().min(1, "Location is required"),
    type: z.nativeEnum(JobType),
    category: z.string().min(1, "Category is required"),
    description: z.string().min(1, "Description is required"),
    requirements: z.string().min(1, "Requirements are required"),
    minSalary: z.string().optional(),
    maxSalary: z.string().optional(),
    currency: z.string(),
    isNegotiable: z.boolean(),
    skills: z.string(),
    minExperience: z.string().optional(),
    maxExperience: z.string().optional(),
    education: z.string().optional(),
    applicationDeadline: z.date().optional(),
    isRemote: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.minSalary && data.maxSalary) {
        return parseInt(data.maxSalary) >= parseInt(data.minSalary);
      }
      return true;
    },
    {
      message: "Maximum salary must be greater than or equal to minimum salary",
      path: ["maxSalary"],
    }
  )
  .refine(
    (data) => {
      if (data.minExperience && data.maxExperience) {
        return parseInt(data.maxExperience) >= parseInt(data.minExperience);
      }
      return true;
    },
    {
      message:
        "Maximum experience must be greater than or equal to minimum experience",
      path: ["maxExperience"],
    }
  );
