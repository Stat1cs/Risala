/**
 * Subject field component
 */

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { LetterLanguage } from "@/lib/types/letter";

interface SubjectFieldProps {
  value: string;
  onChange: (subject: string) => void;
  language: LetterLanguage;
  isPrintPreview?: boolean;
}

export function SubjectField({
  value,
  onChange,
  language,
  isPrintPreview = false,
}: SubjectFieldProps) {
  const isRTL = language === "Arabic";

  return (
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
        gap: "0.5rem",
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
          const target = e.target as HTMLTextAreaElement;
          target.style.height = "auto";
          target.style.height = `${target.scrollHeight}px`;
        }}
      />
    </div>
  );
}
