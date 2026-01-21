/**
 * Signature and closing fields component
 */

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { LetterLanguage } from "@/lib/types/letter";

interface SignatureFieldProps {
  signature: string;
  closing: string;
  onSignatureChange?: (signature: string) => void;
  onClosingChange?: (closing: string) => void;
  language: LetterLanguage;
  isPrintPreview?: boolean;
}

export function SignatureField({
  signature,
  closing,
  onSignatureChange,
  onClosingChange,
  language,
  isPrintPreview = false,
}: SignatureFieldProps) {
  const isRTL = language === "Arabic";

  return (
    <>
      {/* Closing */}
      {onClosingChange && (
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

      {/* Signature */}
      {onSignatureChange && (
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
            onChange={(e) => onSignatureChange(e.target.value)}
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
  );
}
