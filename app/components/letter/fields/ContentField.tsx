/**
 * Content field component (contentEditable)
 */

import { cn } from "@/lib/utils";
import { useContentEditableSync } from "../../../hooks/useContentEditableSync";
import type { LetterLanguage } from "@/lib/types/letter";

interface ContentFieldProps {
  content: string;
  onContentChange: (content: string) => void;
  language: LetterLanguage;
  isPrintPreview?: boolean;
  enabled?: boolean;
}

export function ContentField({
  content,
  onContentChange,
  language,
  isPrintPreview = false,
  enabled = true,
}: ContentFieldProps) {
  const isRTL = language === "Arabic";
  const {
    contentEditableRef,
    handleContentChange,
    handleKeyDown,
    handlePaste,
  } = useContentEditableSync({
    content,
    onContentChange,
    enabled: enabled && !isPrintPreview,
  });

  return (
    <div
      ref={contentEditableRef}
      contentEditable={!isPrintPreview && enabled}
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
        overflow: "visible",
        caretColor: "currentColor",
      }}
      suppressContentEditableWarning
    />
  );
}
