/**
 * Letter utility functions
 */

import type { LetterData, LetterFormattedRecipient } from "../types/letter";

/**
 * Format recipient information into a single string
 */
export function formatRecipient(data: {
  recipientTitle?: string;
  recipientName?: string;
  recipientOrganization?: string;
}): LetterFormattedRecipient {
  const title = data.recipientTitle || "";
  const name = data.recipientName || "";
  const organization = data.recipientOrganization || "";
  
  const full = title && name
    ? `${title} ${name}`
    : title || name || "";
  
  return {
    full,
    title,
    name,
    organization,
  };
}

/**
 * Create a complete letter data object with defaults
 */
export function createLetterData(partial?: Partial<LetterData>): LetterData {
  return {
    content: partial?.content || "",
    date: partial?.date || "",
    recipientTitle: partial?.recipientTitle || "",
    recipientName: partial?.recipientName || "",
    recipientOrganization: partial?.recipientOrganization || "",
    subject: partial?.subject || "",
    signature: partial?.signature || "",
    closing: partial?.closing || "",
    language: partial?.language || "Arabic",
  };
}

/**
 * Check if letter data is empty
 */
export function isLetterDataEmpty(data: LetterData): boolean {
  return !data.content && 
         !data.subject && 
         !data.recipientName && 
         !data.recipientTitle;
}
