import { z } from "zod";
import { FREELANCER_SPECIALIZATION_SET } from "@/lib/freelancer-constants";

const jobGearTagSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .transform((s) => s.toLowerCase());

export const jobCreateSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(20000).optional().default(""),
  location: z.string().max(200).optional().nullable(),
  startsAt: z.string().min(1, "Date and time required"),
  payRate: z.string().min(1, "Pay rate required").max(120),
  gearRequirements: z.array(jobGearTagSchema).max(24).optional().default([]),
  budgetMin: z.coerce.number().int().positive().optional().nullable(),
  budgetMax: z.coerce.number().int().positive().optional().nullable(),
  /** Broadcast urgent WebSocket alerts to nearby freelancers (open listings only). */
  emergencyMode: z.boolean().optional().default(false),
});

const gearTagSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .transform((s) => s.toLowerCase());

export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional().nullable(),
  image: z
    .union([
      z.literal(""),
      z
        .string()
        .max(2000)
        .refine((s) => s.startsWith("/uploads/") || /^https?:\/\//.test(s), "Invalid image URL"),
    ])
    .optional()
    .nullable(),
  headline: z.string().max(200).optional().nullable(),
  bio: z.string().max(5000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  website: z
    .union([z.string().url().max(500), z.literal("")])
    .optional()
    .nullable(),
  companyName: z.string().max(200).optional().nullable(),
  specializations: z
    .array(z.string())
    .max(12)
    .optional()
    .refine(
      (arr) => !arr || arr.every((s) => FREELANCER_SPECIALIZATION_SET.has(s)),
      "Invalid specialization",
    ),
  gearTags: z.array(gearTagSchema).max(40).optional(),
  availableNow: z.boolean().optional(),
});

export const portfolioCreateSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  gearTags: z.array(gearTagSchema).max(40).optional().default([]),
  url: z.string().min(1).max(2000),
  mediaType: z.enum(["IMAGE", "VIDEO"]),
});

const crewRoleRowSchema = z.object({
  roleName: z.string().trim().min(1).max(120),
  assignedFreelancerId: z.string().min(1).optional().nullable(),
});

export const crewTemplateWriteSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  roles: z.array(crewRoleRowSchema).min(1).max(40),
});
