/**
 * Letter generation logic
 * Handles API calls and state updates for letter generation
 */

import { useCallback, useRef, useState, useEffect } from "react";
import type { LetterPurpose, Language, LetterLanguage } from "@/lib/types/letter";
import type { LetterData } from "@/lib/types/letter";
import { formatArabicDate, formatEnglishDate } from "@/lib/date-utils";

interface UseLetterGeneratorOptions {
  purpose: LetterPurpose;
  language: Language;
  letterLanguage: LetterLanguage;
  onUpdate: (data: Partial<LetterData>) => void;
  onAddToHistory: () => void;
}

interface UseLetterGeneratorReturn {
  generateLetter: (
    userMessage: string,
    fileIds?: string[],
    mode?: "generate" | "regenerate"
  ) => Promise<void>;
  handleSendMessage: (message: string, fileIds?: string[]) => void;
  handleRegenerate: () => void;
  isLoading: boolean;
  error: string | null;
}

export function useLetterGenerator(
  options: UseLetterGeneratorOptions & { currentData: LetterData }
): UseLetterGeneratorReturn {
  const { purpose, language, letterLanguage, onUpdate, onAddToHistory, currentData } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const generateLetter = useCallback(
    async (
      userMessage: string,
      fileIds: string[] = [],
      mode: "generate" | "regenerate" = "generate"
    ) => {
      setIsLoading(true);
      setError(null);

      // Use currentData from props

      try {
        const response = await fetch("/api/letter/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            purpose,
            language,
            letterLanguage,
            currentContent: currentData.content,
            date: currentData.date,
            recipientTitle: currentData.recipientTitle,
            recipientName: currentData.recipientName,
            recipientOrganization: currentData.recipientOrganization,
            subject: currentData.subject,
            closing: currentData.closing,
            fileIds,
            mode,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate letter");
        }

        const data = await response.json();
        const newDate = data.date || 
          (letterLanguage === "Arabic" 
            ? formatArabicDate(new Date()) 
            : formatEnglishDate(new Date()));

        onUpdate({
          content: data.content || "",
          date: newDate,
          recipientTitle: data.recipientTitle || currentData.recipientTitle,
          recipientName: data.recipientName || currentData.recipientName,
          recipientOrganization: data.recipientOrganization || currentData.recipientOrganization,
          subject: data.subject || currentData.subject,
          closing: data.closing || currentData.closing,
        });

        onAddToHistory();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Letter generation error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [purpose, language, letterLanguage, onUpdate, onAddToHistory, currentData]
  );

  const handleSendMessage = useCallback(
    (message: string, fileIds?: string[]) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        generateLetter(message, fileIds, "generate");
        debounceTimerRef.current = null;
      }, 500);
    },
    [generateLetter]
  );

  const handleRegenerate = useCallback(() => {
    generateLetter("", [], "regenerate");
  }, [generateLetter]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    generateLetter,
    handleSendMessage,
    handleRegenerate,
    isLoading,
    error,
  };
}
