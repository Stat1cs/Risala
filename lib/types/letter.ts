/**
 * Shared types for letter-related functionality
 */

export type LetterPurpose = "Request" | "Notification" | "Warning" | "Complaint" | "Confirmation";
export type Language = "Government" | "Private" | "Diwan" | "Police" | "Ministry" | "Municipality";
export type LetterLanguage = "Arabic" | "English";
export type UiLanguage = "ar" | "en";

export interface LetterData {
  content: string;
  date: string;
  recipientTitle: string;
  recipientName: string;
  recipientOrganization: string;
  subject: string;
  signature?: string;
  closing?: string;
  language: LetterLanguage;
}

export type LetterState = LetterData;

export interface LetterFormattedRecipient {
  full: string;
  title: string;
  name: string;
  organization: string;
}
