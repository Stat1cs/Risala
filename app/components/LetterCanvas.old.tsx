"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useContentEditableSync } from "../hooks/useContentEditableSync";
import { formatArabicDate, ARABIC_RECIPIENT_TITLES } from "@/lib/date-utils";
import { TemplateId, getTemplateLayout } from "./templates/TemplateRegistry";

interface LetterCanvasProps {
  content: string;
  date: string;
  recipientTitle: string;
  recipientName: string;
  recipientOrganization: string;
  subject: string;
  signature?: string;
  closing?: string;
  language: "Arabic" | "English";
  template?: TemplateId;
  isPrintPreview?: boolean;
  isLandingPage?: boolean;
  uiLanguage?: "ar" | "en";
  onContentChange: (content: string) => void;
  onDateChange: (date: string) => void;
  onRecipientTitleChange: (recipientTitle: string) => void;
  onRecipientNameChange: (recipientName: string) => void;
  onRecipientOrganizationChange: (recipientOrganization: string) => void;
  onSubjectChange: (subject: string) => void;
  onSignatureChange?: (signature: string) => void;
  onClosingChange?: (closing: string) => void;
}

// Default to Arabic if not specified
const DEFAULT_LANGUAGE: "Arabic" | "English" = "Arabic";

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
  // Use custom hook for content synchronization
  const {
    contentEditableRef,
    handleContentChange,
    handleKeyDown,
    handlePaste,
  } = useContentEditableSync({
    content,
    onContentChange,
    enabled: !isLandingPage,
  });

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

  // Client-side date for landing page to avoid hydration mismatch
  const [landingPageDate, setLandingPageDate] = useState<string>("");
  
  // Ref to preserve cursor position in recipient input
  const recipientInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isLandingPage) {
      // Defer state update to avoid synchronous setState warning
      const rafId = requestAnimationFrame(() => {
        if (isRTL) {
          // Use Arabic format with Hijri and Gregorian dates
          const formattedDate = formatArabicDate(new Date());
          setLandingPageDate(formattedDate);
        } else {
          // Use English format
          const formattedDate = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          setLandingPageDate(formattedDate);
        }
      });
      
      return () => cancelAnimationFrame(rafId);
    }
  }, [isLandingPage, isRTL]);

  // Landing page content
  const landingPageContent = {
    ar: {
      recipient: "إلى السادة / مستخدمي منصة رسالة",
      subject: "توضيح بشأن منصة رسالة لصياغة الخطابات الرسمية",
      greeting: "تحية طيبة وبعد،",
      paragraphs: [
        "تشير هذه الرسالة إلى منصة رسالة، وهي أداة رقمية متخصصة في إعداد الخطابات الرسمية الموجهة إلى الجهات الحكومية، والمؤسسات الخاصة، والجهات العامة، وفق أسلوب مؤسسي معتمد ومتوافق مع الأعراف المتبعة في المنطقة.",
        "تم تصميم رسالة لتسهيل صياغة الخطابات التي تتطلب دقة لغوية، ونبرة رسمية مناسبة، وبنية واضحة قابلة للتقديم والطباعة دون الحاجة إلى تعديلات إضافية.",
        "تعتمد المنصة على إدخال الغرض من الخطاب والجهة الموجه إليها، مع إتاحة المجال للمستخدم لإدخال التفاصيل اللازمة، حيث تقوم رسالة بصياغة خطاب متكامل بصيغة رسمية جاهزة للاستخدام.",
        "نود الإحاطة بأن عملية الصياغة تتم بشكل فوري ضمن الجلسة الحالية، دون حفظ أو تخزين أي محتوى، وذلك حفاظًا على الخصوصية."
      ],
      closing: "وتفضلوا بقبول فائق الاحترام والتقدير،",
      signature: "منصة رسالة\nنظام مخصص لصياغة الخطابات الرسمية",
      pricing: "السعر: 2 ريال عماني لكل رسالة"
    },
    en: {
      recipient: "To:\nUsers of the Risala Platform",
      subject: "Clarification Regarding the Risala Official Letter Drafting Platform",
      greeting: "Dear Sir or Madam,",
      paragraphs: [
        "This letter serves to introduce Risala, a digital platform specialized in the drafting of official correspondence addressed to government authorities, private institutions, and public entities, in accordance with established institutional standards and regional conventions.",
        "Risala has been designed to facilitate the preparation of formal letters that require linguistic accuracy, an appropriate professional tone, and a clear, structured format suitable for submission or printing without further modification.",
        "The platform operates by receiving the purpose of the correspondence and the intended recipient authority, in addition to any relevant details provided by the user. Based on this information, Risala generates a complete, institution-ready letter in a formal format appropriate to the context.",
        "Kindly note that all drafting is performed within the current session only, and no content is stored or retained, in order to maintain confidentiality and privacy."
      ],
      closing: "Yours sincerely,",
      signature: "Risala\nA system dedicated to drafting official correspondence",
      pricing: "Price: 2 OMR per letter"
    }
  };

  const landing = landingPageContent[uiLanguage];

  return (
    <div className="flex flex-col items-center w-full py-6 px-4 relative letter-canvas-container">
      <div
        className={cn(
          "letter-canvas",
          "bg-white dark:bg-gray-800",
          "relative" // For positioning the formatting toolbar
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Landing Page Content */}
        {isLandingPage ? (
          <div className="p-8" dir={isRTL ? "rtl" : "ltr"} style={{
            fontFamily: isRTL
              ? "var(--font-arabic), 'Noto Naskh Arabic', serif"
              : "var(--font-english), 'Georgia', 'Times New Roman', serif",
          }}>
            {/* Bismillah - At the very top, centered (only for Arabic landing page) */}
            {isRTL && (
              <div 
                style={{ 
                  textAlign: "center", 
                  marginBottom: "1rem",
                  marginTop: "-0.5rem",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                <img 
                  src="/Font/bismillah.svg" 
                  alt="بسم الله الرحمن الرحيم"
                  className="bismillah-image"
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    maxHeight: "100px", // Increased size for better visibility
                    objectFit: "contain"
                  }}
                />
              </div>
            )}

            {/* Date Field - Landing Page Style */}
            <div className="letter-date text-gray-900 dark:text-white" style={{ textAlign: isRTL ? "right" : "left", fontSize: "10pt", fontWeight: 400, marginBottom: "1.5rem", whiteSpace: isRTL ? "pre-line" : "normal" }}>
              {isRTL ? "" : "Date: "}{landingPageDate || ""}
            </div>

            {/* Recipient Field - Landing Page Style */}
            <div className="text-gray-900 dark:text-white" style={{ marginBottom: "1.5rem", fontSize: "16pt", fontWeight: 400, textAlign: isRTL ? "right" : "left", whiteSpace: "pre-line" }}>
              {landing.recipient}
            </div>

            {/* Greeting - Above subject (only for Arabic) */}
            {isRTL && (
              <div 
                className="text-gray-900 dark:text-white"
                style={{ textAlign: "right", marginBottom: "1.5rem", fontSize: "14pt", fontWeight: 400 }}
              >
                السلام عليـــكم ورحمة الله وبركاته... تحية طيبة وبعد،،،
              </div>
            )}

            {/* Subject Field - Landing Page Style */}
            <div 
              className="letter-subject-container text-gray-900 dark:text-white"
              style={{ 
                marginTop: "3rem",
                marginBottom: "1.5rem",
                marginLeft: "5%",
                marginRight: "5%",
                textAlign: isRTL ? "right" : "left",
                direction: isRTL ? "rtl" : "ltr",
                width: "90%",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
                gap: "0.5rem"
              }}
            >
              <span style={{ fontSize: "18px", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
                {isRTL ? "الموضـــوع:" : "Subject:"}
              </span>
              <span style={{ fontSize: "18px", fontWeight: 700, wordWrap: "break-word", overflowWrap: "break-word", whiteSpace: "pre-wrap" }}>
                {landing.subject}
              </span>
            </div>

            {/* Letter Content - Landing Page Style */}
            <div className="letter-content text-gray-900 dark:text-white" style={{
              fontSize: "14pt",
              lineHeight: "1.8",
              fontWeight: 400,
              textAlign: isRTL ? "right" : "left",
            }}>

              {/* Paragraphs */}
              {landing.paragraphs.map((paragraph, index) => (
                <p key={index} style={{ marginBottom: "1.5rem", textAlign: isRTL ? "right" : "left" }}>
                  {paragraph}
                </p>
              ))}

              {/* Closing */}
              <p style={{ marginTop: "2rem", marginBottom: "1rem" }}>
                {landing.closing}
              </p>

              {/* Signature */}
              <div style={{ marginTop: "3rem", whiteSpace: "pre-line", fontSize: "14pt", fontWeight: 400 }}>
                {landing.signature}
              </div>

              {/* Pricing */}
              <div className="landing-pricing-divider" style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(0,0,0,0.1)" }}>
                <p style={{ fontSize: "14pt", fontWeight: 600 }}>
                  {landing.pricing}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Formatting Toolbar - Hide in print preview */}
        
        {/* Bismillah - At the very top, centered (only for Arabic letters and templates that include it) */}
        {isRTL && templateLayout.fields.some(f => f.type === "bismillah") && (
          <div 
            style={{ 
              textAlign: "center", 
              marginBottom: "1rem",
              marginTop: "-0.5rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <img 
              src="/Font/bismillah.svg" 
              alt="بسم الله الرحمن الرحيم"
              className="bismillah-image"
              style={{
                maxWidth: "100%",
                height: "auto",
                maxHeight: "100px", // Increased size for better visibility
                objectFit: "contain"
              }}
            />
          </div>
        )}
        
        {/* Date Field - Arabic format with Hijri and Gregorian */}
        {isRTL ? (
          <div className="letter-date" style={{ textAlign: "right", marginBottom: "1.5rem" }}>
            <Textarea
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              placeholder="التاريخ: ٢٩ رجـــب ١٤٤٧هـ\nالموافق: ١٨ ينايـــر ٢٠٢٦م"
              disabled={isPrintPreview}
              className={cn(
                "border-none bg-transparent p-0 resize-none",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-muted-foreground/50",
                "text-gray-900 dark:text-white",
                "letter-date-input",
                isPrintPreview && "cursor-default"
              )}
              dir="rtl"
              rows={2}
              style={{
                fontFamily: "var(--font-arabic), 'Noto Naskh Arabic', serif",
                fontSize: "10pt",
                fontWeight: 400,
                lineHeight: "1.8",
                whiteSpace: "pre-line",
              }}
            />
          </div>
        ) : (
          <div className="letter-date" style={{ textAlign: "left", marginBottom: "1.5rem" }}>
            <Input
              type="text"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              placeholder="Date"
              disabled={isPrintPreview}
              className={cn(
                "border-none bg-transparent p-0",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-muted-foreground/50",
                "text-gray-900 dark:text-white",
                "letter-date-input",
                isPrintPreview && "cursor-default"
              )}
              dir="ltr"
              style={{
                fontFamily: "var(--font-english), 'Georgia', 'Times New Roman', serif",
                fontSize: "10pt",
                fontWeight: 400,
              }}
            />
          </div>
        )}

        {/* Recipient Field - Title + Name (combined), and Organization */}
        {isRTL ? (
          <div className="letter-recipient" style={{ textAlign: "right", marginBottom: "1.5rem" }}>
            {/* Recipient Title + Name (combined in one field) */}
            <div style={{ marginBottom: "0.5rem" }}>
              <Input
                ref={recipientInputRef}
                type="text"
                value={
                  recipientTitle && recipientName
                    ? `${recipientTitle} ${recipientName}`
                    : recipientTitle || recipientName || ""
                }
                onChange={(e) => {
                  const input = e.target;
                  const cursorPosition = input.selectionStart || 0;
                  const value = e.target.value;
                  const oldValue = recipientTitle && recipientName
                    ? `${recipientTitle} ${recipientName}`
                    : recipientTitle || recipientName || "";
                  
                  // If value is empty, clear both
                  if (!value) {
                    onRecipientTitleChange("");
                    onRecipientNameChange("");
                    return;
                  }
                  
                  // Try to detect if it starts with a known title
                  const titleMatch = ARABIC_RECIPIENT_TITLES.find((title) =>
                    value.startsWith(title)
                  );
                  
                  let newTitle = "";
                  let newName = "";
                  
                  if (titleMatch) {
                    // Extract name part after the title
                    newName = value.substring(titleMatch.length).trim();
                    newTitle = titleMatch;
                  } else if (recipientTitle && value.startsWith(recipientTitle)) {
                    // If we have a stored title and value starts with it, extract name
                    newName = value.substring(recipientTitle.length).trim();
                    newTitle = recipientTitle;
                  } else {
                    // Store the full value as name, clear title
                    // This allows free editing without interference
                    newName = value;
                    newTitle = "";
                  }
                  
                  // Update state
                  onRecipientTitleChange(newTitle);
                  onRecipientNameChange(newName);
                  
                  // Restore cursor position after state update
                  requestAnimationFrame(() => {
                    if (recipientInputRef.current) {
                      const newValue = newTitle && newName 
                        ? `${newTitle} ${newName}` 
                        : newTitle || newName || "";
                      
                      // Calculate cursor position adjustment
                      // If the old value had a title and new doesn't, adjust cursor
                      let adjustedCursorPos = cursorPosition;
                      if (oldValue.includes(" ") && !newValue.includes(" ")) {
                        // Title was removed, adjust cursor if it was in the title area
                        const oldTitleLength = recipientTitle ? recipientTitle.length + 1 : 0;
                        if (cursorPosition <= oldTitleLength) {
                          adjustedCursorPos = 0;
                        } else {
                          adjustedCursorPos = cursorPosition - oldTitleLength;
                        }
                      } else if (!oldValue.includes(" ") && newValue.includes(" ")) {
                        // Title was added, adjust cursor
                        const newTitleLength = newTitle ? newTitle.length + 1 : 0;
                        adjustedCursorPos = cursorPosition + newTitleLength;
                      }
                      
                      adjustedCursorPos = Math.max(0, Math.min(adjustedCursorPos, newValue.length));
                      recipientInputRef.current.setSelectionRange(adjustedCursorPos, adjustedCursorPos);
                    }
                  });
                }}
                placeholder="[اسم المستلم]"
                disabled={isPrintPreview}
                className={cn(
                  "border-none bg-transparent p-0",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "placeholder:text-muted-foreground/50",
                  "text-gray-900 dark:text-white",
                  "letter-recipient-input",
                  isPrintPreview && "cursor-default"
                )}
                dir="rtl"
                style={{
                  fontFamily: "var(--font-arabic), 'Noto Naskh Arabic', serif",
                  fontSize: "16pt",
                  fontWeight: 400,
                  lineHeight: "1.8",
                  whiteSpace: "pre-line",
                  caretColor: "currentColor",
                }}
              />
            </div>
            
            {/* Organization/Department */}
            <div>
              <Input
                type="text"
                value={recipientOrganization}
                onChange={(e) => onRecipientOrganizationChange(e.target.value)}
                placeholder="[الجهة / القسم]"
                disabled={isPrintPreview}
                className={cn(
                  "border-none bg-transparent p-0",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "placeholder:text-muted-foreground/50",
                  "text-gray-900 dark:text-white",
                  "letter-recipient-input",
                  isPrintPreview && "cursor-default"
                )}
                dir="rtl"
                style={{
                  fontFamily: "var(--font-arabic), 'Noto Naskh Arabic', serif",
                  fontSize: "16pt",
                  fontWeight: 400,
                  lineHeight: "1.8",
                  caretColor: "currentColor",
                }}
              />
            </div>
          </div>
        ) : (
          <div className="letter-recipient" style={{ textAlign: "left", marginBottom: "1.5rem" }}>
            <Input
              type="text"
              value={recipientName}
              onChange={(e) => onRecipientNameChange(e.target.value)}
              placeholder="To:"
              disabled={isPrintPreview}
              className={cn(
                "border-none bg-transparent p-0",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-muted-foreground/50",
                "text-gray-900 dark:text-white",
                "letter-recipient-input",
                isPrintPreview && "cursor-default"
              )}
              dir="ltr"
                style={{
                  fontFamily: "var(--font-english), 'Georgia', 'Times New Roman', serif",
                  fontSize: "16pt",
                  fontWeight: 400,
                  lineHeight: "1.8",
                  whiteSpace: "pre-line",
                  caretColor: "currentColor",
                }}
            />
          </div>
        )}

        {/* Greeting - Only for Arabic letters and templates that include it */}
        {isRTL && templateLayout.fields.some(f => f.type === "greeting") && (
          <div 
            className="text-gray-900 dark:text-white"
            style={{ textAlign: "right", marginBottom: "1.5rem", fontSize: "14pt", fontWeight: 400 }}
          >
            السلام عليـــكم ورحمة الله وبركاته... تحية طيبة وبعد،،،
          </div>
        )}

        {/* Subject Field - Inline with label */}
        <div 
          className="letter-subject-container"
          style={{ 
            marginTop: "3rem",
            marginBottom: "1.5rem",
            marginLeft: "5%",
            marginRight: "5%",
            textAlign: isRTL ? "right" : "left",
            direction: isRTL ? "rtl" : "ltr",
            width: "90%",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            gap: "0.5rem"
          }}
        >
          <span 
            className="letter-subject-label" 
            style={{ 
              fontSize: "18px", 
              fontWeight: 700,
              fontFamily: isRTL
                ? "var(--font-arabic), 'Noto Naskh Arabic', serif"
                : "var(--font-english), 'Georgia', 'Times New Roman', serif",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {isRTL ? "الموضـــوع:" : "Subject:"}
          </span>
          <Textarea
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder={isRTL ? "[عنوان موجز للخطاب]" : "Subject of the letter"}
            disabled={isPrintPreview}
            className={cn(
              "border-none bg-transparent p-0 resize-none",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-muted-foreground/50",
              "text-gray-900 dark:text-white",
              "letter-subject-input",
              isPrintPreview && "cursor-default",
              "flex-1 min-w-0"
            )}
            dir={isRTL ? "rtl" : "ltr"}
            rows={1}
            style={{
              fontFamily: isRTL
                ? "var(--font-arabic), 'Noto Naskh Arabic', serif"
                : "var(--font-english), 'Georgia', 'Times New Roman', serif",
              fontSize: "18px",
              fontWeight: 700,
              lineHeight: "1.5",
              textAlign: isRTL ? "right" : "left",
              minWidth: "200px",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              whiteSpace: "pre-wrap",
              overflow: "hidden",
              caretColor: "currentColor",
            }}
            onInput={(e) => {
              // Auto-resize textarea
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
        </div>

        {/* Letter Content */}
        <div
          ref={contentEditableRef}
          contentEditable={!isPrintPreview}
          onInput={isPrintPreview ? undefined : handleContentChange}
          onKeyDown={isPrintPreview ? undefined : handleKeyDown}
          onPaste={isPrintPreview ? undefined : handlePaste}
          className={cn(
            "letter-content",
            "min-h-[400px]",
            "focus:outline-none",
            "text-gray-900 dark:text-white",
            isPrintPreview && "cursor-default"
          )}
          dir={isRTL ? "rtl" : "ltr"}
          style={{
            fontFamily: isRTL
              ? "var(--font-arabic), 'Noto Naskh Arabic', serif"
              : "var(--font-english), 'Georgia', 'Times New Roman', serif",
            fontSize: "14pt",
            lineHeight: "1.8",
            fontWeight: 400,
            textAlign: isRTL ? "right" : "left",
            cursor: isPrintPreview ? "default" : "text",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            maxWidth: "100%",
            overflow: "visible", // Allow content to overflow and create new pages
            caretColor: "currentColor", // Ensure consistent caret color
          }}
          suppressContentEditableWarning
        />

        {/* Closing Section - Center-aligned with wide margins, above signature */}
        {!isLandingPage && onClosingChange && (
          <div
            className="letter-closing"
            style={{
              marginTop: "3rem",
              marginLeft: "20%",
              marginRight: "20%",
              textAlign: "center",
              direction: isRTL ? "rtl" : "ltr",
            }}
          >
            <Textarea
              value={closing}
              onChange={(e) => onClosingChange(e.target.value)}
              placeholder={isRTL ? "وتفضلوا بقبول فائق الاحترام والتقدير،" : "Yours sincerely,"}
              disabled={isPrintPreview}
              className={cn(
                "border-none bg-transparent p-0 resize-none",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-muted-foreground/50",
                "text-gray-900 dark:text-white",
                "text-center",
                isPrintPreview && "cursor-default"
              )}
              dir={isRTL ? "rtl" : "ltr"}
              rows={2}
              style={{
                fontFamily: isRTL
                  ? "var(--font-arabic), 'Noto Naskh Arabic', serif"
                  : "var(--font-english), 'Georgia', 'Times New Roman', serif",
                fontSize: "14pt",
                fontWeight: 400,
                lineHeight: "1.8",
                whiteSpace: "pre-line",
                textAlign: "center",
                caretColor: "currentColor",
                width: "100%",
              }}
            />
          </div>
        )}

        {/* Signature Field - Always show for all templates */}
        {!isLandingPage && (
          <div
            className="letter-signature"
            style={{
              marginTop: "3rem",
              textAlign: isRTL ? "right" : "left",
              direction: isRTL ? "rtl" : "ltr",
            }}
          >
            <Textarea
              value={signature}
              onChange={(e) => onSignatureChange?.(e.target.value)}
              placeholder={isRTL ? "[التوقيع]" : "[Signature]"}
              disabled={isPrintPreview || !onSignatureChange}
              className={cn(
                "border-none bg-transparent p-0 resize-none",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-muted-foreground/50",
                "text-gray-900 dark:text-white",
                isPrintPreview && "cursor-default"
              )}
              dir={isRTL ? "rtl" : "ltr"}
              rows={3}
              style={{
                fontFamily: isRTL
                  ? "var(--font-arabic), 'Noto Naskh Arabic', serif"
                  : "var(--font-english), 'Georgia', 'Times New Roman', serif",
                fontSize: "14pt",
                fontWeight: 400,
                lineHeight: "1.8",
                whiteSpace: "pre-line",
                caretColor: "currentColor",
              }}
            />
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
