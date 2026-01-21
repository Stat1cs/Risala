"use client";

import { useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatArabicDate } from "@/lib/date-utils";
import { TemplateId, getTemplateLayout } from "./templates/TemplateRegistry";
import { DateField } from "./letter/fields/DateField";
import { BismillahField } from "./letter/fields/BismillahField";
import { GreetingField } from "./letter/fields/GreetingField";
import { SubjectField } from "./letter/fields/SubjectField";
import { RecipientField } from "./letter/fields/RecipientField";
import { ContentField } from "./letter/fields/ContentField";
import { SignatureField } from "./letter/fields/SignatureField";
import { LandingPageContent } from "./letter/LandingPageContent";
import type { LetterLanguage, UiLanguage } from "@/lib/types/letter";

interface LetterCanvasProps {
  content: string;
  date: string;
  recipientTitle: string;
  recipientName: string;
  recipientOrganization: string;
  subject: string;
  signature?: string;
  closing?: string;
  language: LetterLanguage;
  template?: TemplateId;
  isPrintPreview?: boolean;
  isLandingPage?: boolean;
  uiLanguage?: UiLanguage;
  onContentChange: (content: string) => void;
  onDateChange: (date: string) => void;
  onRecipientTitleChange: (recipientTitle: string) => void;
  onRecipientNameChange: (recipientName: string) => void;
  onRecipientOrganizationChange: (recipientOrganization: string) => void;
  onSubjectChange: (subject: string) => void;
  onSignatureChange?: (signature: string) => void;
  onClosingChange?: (closing: string) => void;
}

const DEFAULT_LANGUAGE: LetterLanguage = "Arabic";

export function LetterCanvas({
  content,
  date,
  recipientTitle,
  recipientName,
  recipientOrganization,
  subject,
  signature = "",
  closing = "",
  language,
  template = "official",
  isPrintPreview = false,
  isLandingPage = false,
  uiLanguage = "ar",
  onContentChange,
  onDateChange,
  onRecipientTitleChange,
  onRecipientNameChange,
  onRecipientOrganizationChange,
  onSubjectChange,
  onSignatureChange,
  onClosingChange,
}: LetterCanvasProps) {
  // Memoize RTL calculation
  const isRTL = useMemo(() => {
    const effectiveLanguage = language || DEFAULT_LANGUAGE;
    return effectiveLanguage === "Arabic" || (isLandingPage && uiLanguage === "ar");
  }, [language, isLandingPage, uiLanguage]);

  // Get template layout
  const templateLayout = useMemo(() => {
    return getTemplateLayout(template);
  }, [template]);

  // Auto-update date when it's empty (only for Arabic letters)
  useEffect(() => {
    if (!isLandingPage && isRTL && !date) {
      onDateChange(formatArabicDate(new Date()));
    }
  }, [isLandingPage, isRTL, date, onDateChange]);

  // Show landing page if needed
  if (isLandingPage) {
    return (
      <div className="flex flex-col items-center w-full py-6 px-4 relative letter-canvas-container">
        <div
          className={cn(
            "letter-canvas",
            "bg-white dark:bg-gray-800",
            "relative"
          )}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <LandingPageContent uiLanguage={uiLanguage} />
        </div>
      </div>
    );
  }

  // Regular letter canvas
  const showBismillah = isRTL && templateLayout.fields.some((f) => f.type === "bismillah");
  const showGreeting = isRTL && templateLayout.fields.some((f) => f.type === "greeting");

  return (
    <div className="flex flex-col items-center w-full py-6 px-4 relative letter-canvas-container">
      <div
        className={cn(
          "letter-canvas",
          "bg-white dark:bg-gray-800",
          "relative"
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Bismillah */}
        {showBismillah && <BismillahField />}

        {/* Date Field */}
        <DateField
          value={date}
          onChange={onDateChange}
          language={language}
          isPrintPreview={isPrintPreview}
        />

        {/* Recipient Field */}
        <RecipientField
          recipientTitle={recipientTitle}
          recipientName={recipientName}
          recipientOrganization={recipientOrganization}
          onRecipientTitleChange={onRecipientTitleChange}
          onRecipientNameChange={onRecipientNameChange}
          onRecipientOrganizationChange={onRecipientOrganizationChange}
          language={language}
          isPrintPreview={isPrintPreview}
        />

        {/* Greeting */}
        {showGreeting && <GreetingField />}

        {/* Subject Field */}
        <SubjectField
          value={subject}
          onChange={onSubjectChange}
          language={language}
          isPrintPreview={isPrintPreview}
        />

        {/* Letter Content */}
        <ContentField
          content={content}
          onContentChange={onContentChange}
          language={language}
          isPrintPreview={isPrintPreview}
          enabled={!isLandingPage}
        />

        {/* Closing and Signature */}
        <SignatureField
          signature={signature}
          closing={closing}
          onSignatureChange={onSignatureChange}
          onClosingChange={onClosingChange}
          language={language}
          isPrintPreview={isPrintPreview}
        />
      </div>
    </div>
  );
}
