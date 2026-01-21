"use client";

import { useState, useEffect } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLabels } from "@/lib/constants/ui-labels";

interface PdfPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  letterData: {
    date: string;
    recipientTitle: string;
    recipientName: string;
    recipientOrganization: string;
    subject: string;
    content: string;
    language: "Arabic" | "English";
    signature?: string;
    closing?: string;
  };
  uiLanguage: "ar" | "en";
  onDownload?: () => void;
}

export function PdfPreviewDialog({
  isOpen,
  onClose,
  letterData,
  uiLanguage,
  onDownload,
}: PdfPreviewDialogProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRTL = uiLanguage === "ar";

  useEffect(() => {
    if (isOpen && letterData) {
      generatePdf();
    } else {
      // Clean up blob URL when dialog closes
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const generatePdf = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { formatRecipient } = await import("@/lib/utils/letter");
      const recipient = formatRecipient(letterData).full;

      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          date: letterData.date,
          recipient,
          organization: letterData.recipientOrganization,
          subject: letterData.subject,
          content: letterData.content,
          language: letterData.language,
          signature: letterData.signature,
          closing: letterData.closing,
        }),
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Failed to generate PDF";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("PDF generation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const labels = getLabels(uiLanguage);
  const dialogLabels = {
    title: uiLanguage === "ar" ? "معاينة PDF" : "PDF Preview",
    loading: uiLanguage === "ar" ? "جارٍ إنشاء PDF..." : "Generating PDF...",
    error: uiLanguage === "ar" ? "حدث خطأ أثناء إنشاء PDF" : "An error occurred while generating PDF",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className={cn(
          "relative bg-background rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] m-4 flex flex-col",
          isRTL && "text-right"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{dialogLabels.title}</h2>
          <div className="flex items-center gap-2">
            {pdfUrl && onDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {labels.download}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label={labels.close}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{dialogLabels.loading}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-4 max-w-md">
                <p className="text-destructive mb-2 font-semibold">{dialogLabels.error}</p>
                <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">{error}</p>
                <Button variant="outline" onClick={generatePdf}>
                  {labels.retry}
                </Button>
              </div>
            </div>
          )}

          {pdfUrl && !isLoading && !error && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title={dialogLabels.title}
            />
          )}
        </div>
      </div>
    </div>
  );
}
