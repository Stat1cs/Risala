/**
 * Recipient field component
 */

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ARABIC_RECIPIENT_TITLES } from "@/lib/date-utils";
import type { LetterLanguage } from "@/lib/types/letter";
import { useRef } from "react";

interface RecipientFieldProps {
  recipientTitle: string;
  recipientName: string;
  recipientOrganization: string;
  onRecipientTitleChange: (title: string) => void;
  onRecipientNameChange: (name: string) => void;
  onRecipientOrganizationChange: (org: string) => void;
  language: LetterLanguage;
  isPrintPreview?: boolean;
}

export function RecipientField({
  recipientTitle,
  recipientName,
  recipientOrganization,
  onRecipientTitleChange,
  onRecipientNameChange,
  onRecipientOrganizationChange,
  language,
  isPrintPreview = false,
}: RecipientFieldProps) {
  const isRTL = language === "Arabic";
  const recipientInputRef = useRef<HTMLInputElement>(null);

  if (isRTL) {
    return (
      <div className="letter-recipient" style={{ textAlign: "right", marginBottom: "1.5rem" }}>
        {/* Combined Title + Name */}
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

              if (!value) {
                onRecipientTitleChange("");
                onRecipientNameChange("");
                return;
              }

              const titleMatch = ARABIC_RECIPIENT_TITLES.find((title) =>
                value.startsWith(title)
              );

              let newTitle = "";
              let newName = "";

              if (titleMatch) {
                newName = value.substring(titleMatch.length).trim();
                newTitle = titleMatch;
              } else if (recipientTitle && value.startsWith(recipientTitle)) {
                newName = value.substring(recipientTitle.length).trim();
                newTitle = recipientTitle;
              } else {
                newName = value;
                newTitle = "";
              }

              onRecipientTitleChange(newTitle);
              onRecipientNameChange(newName);

              requestAnimationFrame(() => {
                if (recipientInputRef.current) {
                  const newValue = newTitle && newName
                    ? `${newTitle} ${newName}`
                    : newTitle || newName || "";

                  let adjustedCursorPos = cursorPosition;
                  if (oldValue.includes(" ") && !newValue.includes(" ")) {
                    const oldTitleLength = recipientTitle ? recipientTitle.length + 1 : 0;
                    if (cursorPosition <= oldTitleLength) {
                      adjustedCursorPos = 0;
                    } else {
                      adjustedCursorPos = cursorPosition - oldTitleLength;
                    }
                  } else if (!oldValue.includes(" ") && newValue.includes(" ")) {
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

        {/* Organization */}
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
    );
  }

  return (
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
  );
}
