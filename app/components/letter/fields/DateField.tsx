/**
 * Date field component for letter canvas
 */

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { LetterLanguage } from "@/lib/types/letter";

interface DateFieldProps {
  value: string;
  onChange: (date: string) => void;
  language: LetterLanguage;
  isPrintPreview?: boolean;
  isLandingPage?: boolean;
  landingPageDate?: string;
}

export function DateField({
  value,
  onChange,
  language,
  isPrintPreview = false,
  isLandingPage = false,
  landingPageDate,
}: DateFieldProps) {
  const isRTL = language === "Arabic";

  if (isLandingPage && landingPageDate) {
    return (
      <div
        className="letter-date text-gray-900 dark:text-white"
        style={{
          textAlign: isRTL ? "right" : "left",
          fontSize: "10pt",
          fontWeight: 400,
          marginBottom: "1.5rem",
          whiteSpace: isRTL ? "pre-line" : "normal",
        }}
      >
        {isRTL ? "" : "Date: "}
        {landingPageDate}
      </div>
    );
  }

  if (isRTL) {
    return (
      <div className="letter-date" style={{ textAlign: "right", marginBottom: "1.5rem" }}>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
    );
  }

  return (
    <div className="letter-date" style={{ textAlign: "left", marginBottom: "1.5rem" }}>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  );
}
