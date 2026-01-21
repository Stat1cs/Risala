import { z } from "zod";

/**
 * Schema for letter generation API request
 */
export const letterGenerateSchema = z.object({
  message: z.string().optional(),
  purpose: z.enum(["Request", "Notification", "Warning", "Complaint", "Confirmation"]),
  language: z.enum(["Government", "Private", "Diwan", "Police", "Ministry", "Municipality"]),
  letterLanguage: z.enum(["Arabic", "English"]),
  currentContent: z.string().optional(),
  date: z.string().optional(),
  recipientTitle: z.string().optional(),
  recipientName: z.string().optional(),
  recipientOrganization: z.string().optional(),
  subject: z.string().optional(),
  closing: z.string().optional(),
  fileIds: z.array(z.string()).default([]),
  mode: z.enum(["generate", "regenerate"]).default("generate"),
});

export type LetterGenerateRequest = z.infer<typeof letterGenerateSchema>;

/**
 * Schema for letter generation API response
 */
export const letterGenerateResponseSchema = z.object({
  content: z.string(),
  date: z.string(),
  recipientTitle: z.string().optional(),
  recipientName: z.string().optional(),
  recipientOrganization: z.string().optional(),
  subject: z.string(),
  closing: z.string().optional(),
});

export type LetterGenerateResponse = z.infer<typeof letterGenerateResponseSchema>;
