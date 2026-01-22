"use client";

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from "react";
import { LetterCanvas } from "./components/LetterCanvas";
import { LetterControls } from "./components/LetterControls";
import type { LetterPurpose, Language, UiLanguage } from "@/lib/types/letter";
import type { TemplateId } from "./components/templates/TemplateTypes";
import { ChatInput } from "./components/ChatInput";
import { ThemeToggle } from "./components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { CanvasToolbar } from "./components/CanvasToolbar";
import { useLetterHistory } from "./hooks/useLetterHistory";
import { formatArabicDate, formatEnglishDate } from "@/lib/date-utils";
import { PdfPreviewDialog } from "./components/PdfPreviewDialog";
import { SaveLoadDialog } from "./components/SaveLoadDialog";

function HomeContent() {
  const searchParams = useSearchParams();
  const [hasPaid, setHasPaid] = useState(false);
  const [letterContent, setLetterContent] = useState("");
  const [letterDate, setLetterDate] = useState("");
  const [letterRecipientTitle, setLetterRecipientTitle] = useState("");
  const [letterRecipientName, setLetterRecipientName] = useState("");
  const [letterRecipientOrganization, setLetterRecipientOrganization] = useState("");
  const [letterSubject, setLetterSubject] = useState("");
  const [letterSignature, setLetterSignature] = useState("");
  const [letterClosing, setLetterClosing] = useState("");
  const [purpose, setPurpose] = useState<LetterPurpose>("Request");
  const [language, setLanguage] = useState<Language>("Police");
  const [template, setTemplate] = useState<TemplateId>("official");
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>("ar"); // Arabic as default
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isSaveLoadDialogOpen, setIsSaveLoadDialogOpen] = useState(false);
  const [saveLoadMode, setSaveLoadMode] = useState<"save" | "load">("save");
  
  // Memoize letter language calculation
  const letterLanguage = useMemo(
    () => (uiLanguage === "ar" ? "Arabic" : "English"),
    [uiLanguage]
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPrintPreview, setIsPrintPreview] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use custom hook for history management
  const {
    canUndo,
    canRedo,
    addState,
    undo,
    redo,
    reset: resetHistory,
  } = useLetterHistory({ maxHistorySize: 5 });

  // Check for payment session ID in URL params or sessionStorage
  useEffect(() => {
    const sessionId = searchParams.get("session_id") || sessionStorage.getItem("payment_session_id");
    if (sessionId) {
      // Mock payment verification - in real implementation, verify with Stripe
      setHasPaid(true);
      sessionStorage.setItem("payment_session_id", sessionId);
      // Reset canvas after payment
      setLetterContent("");
      setLetterDate("");
      setLetterRecipientTitle("");
      setLetterRecipientName("");
      setLetterRecipientOrganization("");
      setLetterSubject("");
      setLetterSignature("");
      setLetterClosing("");
      resetHistory();
    } else {
      // Check sessionStorage for existing payment
      const storedSession = sessionStorage.getItem("payment_session_id");
      if (storedSession) {
        setHasPaid(true);
      }
    }
  }, [searchParams, resetHistory]);

  // Initialize date with both Hijri and Gregorian
  useEffect(() => {
    if (!letterDate) {
      // Default to Arabic date format with both Hijri and Gregorian
      setLetterDate(formatArabicDate(new Date()));
    }
  }, [letterDate]);

  const generateLetter = useCallback(
    async (userMessage: string, fileIds?: string[], mode: "generate" | "regenerate" = "generate") => {
      setIsLoading(true);
      setError(null);

      // Capture current state values at call time to avoid stale closures
      const currentContent = letterContent;
      const currentDate = letterDate;
      const currentRecipientTitle = letterRecipientTitle;
      const currentRecipientName = letterRecipientName;
      const currentRecipientOrganization = letterRecipientOrganization;
      const currentSubject = letterSubject;

      try {
        const response = await fetch("/api/letter/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            purpose,
            language,
            letterLanguage,
            currentContent,
            date: currentDate,
            recipientTitle: currentRecipientTitle,
            recipientName: currentRecipientName,
            recipientOrganization: currentRecipientOrganization,
            subject: currentSubject,
            closing: letterClosing,
            fileIds: fileIds || [],
            mode,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate letter");
        }

        const data = await response.json();
        const newContent = data.content || "";
        // Use formatted date if not provided
        const newDate = data.date || (letterLanguage === "Arabic" ? formatArabicDate(new Date()) : formatEnglishDate(new Date()));
        const newRecipientTitle = data.recipientTitle || currentRecipientTitle;
        const newRecipientName = data.recipientName || currentRecipientName;
        const newRecipientOrganization = data.recipientOrganization || currentRecipientOrganization;
        const newSubject = data.subject || currentSubject;
        const newClosing = data.closing || letterClosing;
        
        // Update letter state
        setLetterContent(newContent);
        setLetterDate(newDate);
        setLetterRecipientTitle(newRecipientTitle);
        setLetterRecipientName(newRecipientName);
        setLetterRecipientOrganization(newRecipientOrganization);
        setLetterSubject(newSubject);
        setLetterClosing(newClosing);
        
        // Add to history (only for AI-generated updates)
        addState({ 
          content: newContent, 
          date: newDate, 
          recipientTitle: newRecipientTitle,
          recipientName: newRecipientName,
          recipientOrganization: newRecipientOrganization,
          subject: newSubject,
          signature: letterSignature,
          closing: letterClosing,
          language: letterLanguage,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Letter generation error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [purpose, language, letterLanguage, letterContent, letterDate, letterRecipientTitle, letterRecipientName, letterRecipientOrganization, letterSubject, letterSignature, letterClosing, addState]
  );

  const handleSendMessage = useCallback(
    (message: string, fileIds?: string[]) => {
      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer
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

  const handleUndo = useCallback(() => {
    const prevState = undo();
    if (prevState) {
      setLetterContent(prevState.content);
      setLetterDate(prevState.date);
      setLetterRecipientTitle(prevState.recipientTitle);
      setLetterRecipientName(prevState.recipientName);
      setLetterRecipientOrganization(prevState.recipientOrganization);
      setLetterSubject(prevState.subject);
      if (prevState.signature !== undefined) {
        setLetterSignature(prevState.signature);
      }
      if (prevState.closing !== undefined) {
        setLetterClosing(prevState.closing);
      }
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      setLetterContent(nextState.content);
      setLetterDate(nextState.date);
      setLetterRecipientTitle(nextState.recipientTitle);
      setLetterRecipientName(nextState.recipientName);
      setLetterRecipientOrganization(nextState.recipientOrganization);
      setLetterSubject(nextState.subject);
      if (nextState.signature !== undefined) {
        setLetterSignature(nextState.signature);
      }
      if (nextState.closing !== undefined) {
        setLetterClosing(nextState.closing);
      }
    }
  }, [redo]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs or textareas
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Ctrl/Cmd + Z and Ctrl/Cmd + Y for undo/redo in inputs
        if (
          (e.ctrlKey || e.metaKey) &&
          (e.key === "z" || e.key === "y" || e.key === "Z" || e.key === "Y")
        ) {
          // Let browser handle undo/redo in inputs
          return;
        }
        // Don't trigger other shortcuts when in input fields
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey) {
        switch (e.key.toLowerCase()) {
          case "r":
            e.preventDefault();
            if (hasPaid) handleRegenerate();
            break;
          case "z":
            e.preventDefault();
            if (hasPaid && !e.shiftKey) {
              handleUndo();
            } else if (hasPaid && e.shiftKey && isMac) {
              handleRedo();
            }
            break;
          case "y":
            e.preventDefault();
            if (hasPaid && !isMac) {
              handleRedo();
            }
            break;
          case "p":
            e.preventDefault();
            if (hasPaid) setIsPrintPreview(!isPrintPreview);
            break;
        }
      }
    };

    if (hasPaid) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [hasPaid, handleRegenerate, handleUndo, handleRedo, isPrintPreview]);

  const handleGenerateLetter = async () => {
    try {
      // Call checkout API to create session
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const data = await response.json();
      
      // Redirect to checkout URL (or mock success for development)
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setError("Failed to initiate payment. Please try again.");
    }
  };

  // PDF handlers
  const handlePdfPreview = () => {
    setIsPdfPreviewOpen(true);
  };

  const handlePdfDownload = async () => {
    try {
      const { formatRecipient } = await import("@/lib/utils/letter");
      const recipient = formatRecipient({
        recipientTitle: letterRecipientTitle,
        recipientName: letterRecipientName,
        recipientOrganization: letterRecipientOrganization,
      }).full;

      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          date: letterDate,
          recipient,
          organization: letterRecipientOrganization,
          subject: letterSubject,
          content: letterContent,
          language: letterLanguage,
          signature: letterSignature,
          closing: letterClosing,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const { extractFilenameFromHeader, downloadFile } = await import("@/lib/utils/file");
      
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = extractFilenameFromHeader(contentDisposition);
      
      // Ensure .pdf extension
      if (!filename.toLowerCase().endsWith(".pdf")) {
        filename = filename + ".pdf";
      }
      
      downloadFile(blob, filename);
    } catch (error) {
      console.error("PDF download error:", error);
      setError(uiLanguage === "ar" ? "فشل تحميل PDF" : "Failed to download PDF");
    }
  };

  // Save/Load handlers
  const handleSave = () => {
    setSaveLoadMode("save");
    setIsSaveLoadDialogOpen(true);
  };

  const handleLoad = () => {
    setSaveLoadMode("load");
    setIsSaveLoadDialogOpen(true);
  };

  const handleSaveLetter = (name: string) => {
    // Save is handled by SaveLoadDialog component
    // This callback is just for notification if needed
  };

  const handleLoadLetter = (letter: { 
    data: {
      content?: string;
      date?: string;
      recipientTitle?: string;
      recipientName?: string;
      recipientOrganization?: string;
      subject?: string;
      signature?: string;
      closing?: string;
      language?: "Arabic" | "English";
    }
  }) => {
    setLetterContent(letter.data.content || "");
    setLetterDate(letter.data.date || "");
    setLetterRecipientTitle(letter.data.recipientTitle || "");
    setLetterRecipientName(letter.data.recipientName || "");
    setLetterRecipientOrganization(letter.data.recipientOrganization || "");
    setLetterSubject(letter.data.subject || "");
    setLetterSignature(letter.data.signature || "");
    setLetterClosing(letter.data.closing || "");
    // Reset history when loading
    resetHistory();
  };

  return (
    <div className="flex flex-col min-h-screen bg-linear-to-br from-blue-50 via-blue-100 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 transition-colors duration-300">
      {/* Header - Only show when not paid */}
      {!hasPaid && (
        <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
          <div className="mx-auto max-w-2xl px-4 pt-4 pointer-events-auto">
            <div className="flex items-center justify-between px-4 py-2.5 bg-background/90 backdrop-blur-md border border-border/60 shadow-xl rounded-2xl" dir={uiLanguage === "ar" ? "rtl" : "ltr"}>
              <h1 className="text-lg font-semibold">{uiLanguage === "ar" ? "رسالة" : "Risala"}</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUiLanguage(uiLanguage === "ar" ? "en" : "ar")}
                  className="px-2 py-1 text-xs font-medium rounded-lg hover:bg-accent transition-colors"
                  aria-label={uiLanguage === "ar" ? "Switch to English" : "التبديل إلى العربية"}
                >
                  {uiLanguage === "ar" ? "EN" : "عربي"}
                </button>
                <ThemeToggle />
                <Button onClick={handleGenerateLetter} size="sm">
                  {uiLanguage === "ar" ? "إنشاء رسالة" : "Create Letter"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-auto max-w-4xl w-full px-4 py-2" dir="rtl">
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="mr-4 text-destructive/70 hover:text-destructive"
              aria-label={uiLanguage === "ar" ? "إغلاق" : "Dismiss error"}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Letter Controls - Positioned at top */}
      {hasPaid && !isPrintPreview && (
        <LetterControls
          purpose={purpose}
          language={language}
          template={template}
          uiLanguage={uiLanguage}
          onPurposeChange={setPurpose}
          onLanguageChange={setLanguage}
          onTemplateChange={setTemplate}
          onUiLanguageChange={setUiLanguage}
        />
      )}

      {/* Letter Canvas */}
      <main className="flex-1 overflow-y-auto pb-40 pt-24" style={{ marginTop: hasPaid ? "24px" : "0" }}>
        <div className="flex justify-center">
          <div className="relative">
            <LetterCanvas
              content={hasPaid ? letterContent : ""}
              date={hasPaid ? letterDate : ""}
              recipientTitle={hasPaid ? letterRecipientTitle : ""}
              recipientName={hasPaid ? letterRecipientName : ""}
              recipientOrganization={hasPaid ? letterRecipientOrganization : ""}
              subject={hasPaid ? letterSubject : ""}
              language={letterLanguage}
              isPrintPreview={isPrintPreview}
              isLandingPage={!hasPaid}
              uiLanguage={uiLanguage}
              onContentChange={setLetterContent}
              onDateChange={setLetterDate}
              onRecipientTitleChange={setLetterRecipientTitle}
              onRecipientNameChange={setLetterRecipientName}
              onRecipientOrganizationChange={setLetterRecipientOrganization}
              onSubjectChange={setLetterSubject}
              signature={hasPaid ? letterSignature : ""}
              onSignatureChange={setLetterSignature}
              closing={hasPaid ? letterClosing : ""}
              onClosingChange={setLetterClosing}
              template={template}
            />
            {hasPaid && (
              <CanvasToolbar
                onRegenerate={handleRegenerate}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onPrintPreviewToggle={() => setIsPrintPreview(!isPrintPreview)}
                onPdfPreview={handlePdfPreview}
                onPdfDownload={handlePdfDownload}
                onSave={handleSave}
                onLoad={handleLoad}
                canUndo={canUndo}
                canRedo={canRedo}
                isPrintPreview={isPrintPreview}
                uiLanguage={uiLanguage}
              />
            )}
          </div>
        </div>
      </main>

      {/* Chat Input */}
      {!isPrintPreview && (
        <>
          {/* Loading Indicator - Fixed above Chat Input */}
          {isLoading && (
            <div className="fixed bottom-20 left-0 right-0 z-40 pointer-events-none" dir={uiLanguage === "ar" ? "rtl" : "ltr"}>
              <div className="mx-auto max-w-2xl px-4 flex justify-center">
                <div className="bg-background border rounded-lg px-4 py-2 shadow-lg flex items-center gap-2 pointer-events-auto">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    {uiLanguage === "ar" ? "جارٍ إنشاء الرسالة..." : "Generating letter..."}
                  </span>
                </div>
              </div>
            </div>
          )}
          <ChatInput disabled={!hasPaid} onSend={handleSendMessage} isLoading={isLoading} uiLanguage={uiLanguage} />
        </>
      )}

      {/* PDF Preview Dialog */}
      <PdfPreviewDialog
        isOpen={isPdfPreviewOpen}
        onClose={() => setIsPdfPreviewOpen(false)}
        letterData={{
          date: letterDate,
          recipientTitle: letterRecipientTitle,
          recipientName: letterRecipientName,
          recipientOrganization: letterRecipientOrganization,
          subject: letterSubject,
          content: letterContent,
          language: letterLanguage,
          signature: letterSignature,
          closing: letterClosing,
        }}
        uiLanguage={uiLanguage}
        onDownload={handlePdfDownload}
      />

      {/* Save/Load Dialog */}
      <SaveLoadDialog
        isOpen={isSaveLoadDialogOpen}
        mode={saveLoadMode}
        onClose={() => setIsSaveLoadDialogOpen(false)}
        onSave={handleSaveLetter}
        onLoad={handleLoadLetter}
        currentLetterData={
          saveLoadMode === "save"
            ? {
                content: letterContent,
                date: letterDate,
                recipientTitle: letterRecipientTitle,
                recipientName: letterRecipientName,
                recipientOrganization: letterRecipientOrganization,
                subject: letterSubject,
                language: letterLanguage,
                signature: letterSignature,
                closing: letterClosing,
              }
            : undefined
        }
        uiLanguage={uiLanguage}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-blue-50 via-blue-100 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 transition-colors duration-300">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
