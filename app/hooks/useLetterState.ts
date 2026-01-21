/**
 * Custom hook for managing letter state
 * Consolidates all letter-related state management
 */

import { useState, useCallback, useMemo } from "react";
import type { LetterData, LetterState } from "@/lib/types/letter";
import { createLetterData, formatRecipient } from "@/lib/utils/letter";

interface UseLetterStateOptions {
  initialData?: Partial<LetterData>;
}

interface UseLetterStateReturn {
  // State
  data: LetterData;
  
  // Setters
  setContent: (content: string) => void;
  setDate: (date: string) => void;
  setRecipientTitle: (title: string) => void;
  setRecipientName: (name: string) => void;
  setRecipientOrganization: (org: string) => void;
  setSubject: (subject: string) => void;
  setSignature: (signature: string) => void;
  setClosing: (closing: string) => void;
  setLanguage: (language: LetterData["language"]) => void;
  
  // Batch operations
  setLetterData: (data: Partial<LetterData>) => void;
  resetLetterData: () => void;
  
  // Computed values
  recipient: ReturnType<typeof formatRecipient>;
  
  // State snapshot for history
  getState: () => LetterState;
}

export function useLetterState(
  options: UseLetterStateOptions = {}
): UseLetterStateReturn {
  const [data, setData] = useState<LetterData>(() => 
    createLetterData(options.initialData)
  );

  const setContent = useCallback((content: string) => {
    setData(prev => ({ ...prev, content }));
  }, []);

  const setDate = useCallback((date: string) => {
    setData(prev => ({ ...prev, date }));
  }, []);

  const setRecipientTitle = useCallback((recipientTitle: string) => {
    setData(prev => ({ ...prev, recipientTitle }));
  }, []);

  const setRecipientName = useCallback((recipientName: string) => {
    setData(prev => ({ ...prev, recipientName }));
  }, []);

  const setRecipientOrganization = useCallback((recipientOrganization: string) => {
    setData(prev => ({ ...prev, recipientOrganization }));
  }, []);

  const setSubject = useCallback((subject: string) => {
    setData(prev => ({ ...prev, subject }));
  }, []);

  const setSignature = useCallback((signature: string) => {
    setData(prev => ({ ...prev, signature }));
  }, []);

  const setClosing = useCallback((closing: string) => {
    setData(prev => ({ ...prev, closing }));
  }, []);

  const setLanguage = useCallback((language: LetterData["language"]) => {
    setData(prev => ({ ...prev, language }));
  }, []);

  const setLetterData = useCallback((newData: Partial<LetterData>) => {
    setData(prev => ({ ...prev, ...newData }));
  }, []);

  const resetLetterData = useCallback(() => {
    setData(createLetterData());
  }, []);

  const recipient = useMemo(
    () => formatRecipient(data),
    [data.recipientTitle, data.recipientName, data.recipientOrganization]
  );

  const getState = useCallback((): LetterState => {
    return { ...data };
  }, [data]);

  return {
    data,
    setContent,
    setDate,
    setRecipientTitle,
    setRecipientName,
    setRecipientOrganization,
    setSubject,
    setSignature,
    setClosing,
    setLanguage,
    setLetterData,
    resetLetterData,
    recipient,
    getState,
  };
}
