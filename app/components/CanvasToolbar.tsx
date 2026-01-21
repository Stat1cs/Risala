"use client";

import { RefreshCw, Undo2, Redo2, Printer, EyeOff, FileText, Download, Save, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLabels } from "@/lib/constants/ui-labels";

interface CanvasToolbarProps {
  onRegenerate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onPrintPreviewToggle: () => void;
  onPdfPreview?: () => void;
  onPdfDownload?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isPrintPreview: boolean;
  uiLanguage: "ar" | "en";
}

export function CanvasToolbar({
  onRegenerate,
  onUndo,
  onRedo,
  onPrintPreviewToggle,
  onPdfPreview,
  onPdfDownload,
  onSave,
  onLoad,
  canUndo,
  canRedo,
  isPrintPreview,
  uiLanguage,
}: CanvasToolbarProps) {
  const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const modKey = isMac ? "⌘" : "Ctrl";
  const labels = getLabels(uiLanguage);
  
  const toolbarLabels = {
    printPreview: uiLanguage === "ar" ? "معاينة الطباعة" : "Print Preview",
    exitPrintPreview: uiLanguage === "ar" ? "إغلاق المعاينة" : "Exit Preview",
    pdfPreview: uiLanguage === "ar" ? "معاينة PDF" : "PDF Preview",
    pdfDownload: uiLanguage === "ar" ? "تحميل PDF" : "Download PDF",
  };

  const shortcuts = {
    regenerate: `${modKey} + R`,
    undo: `${modKey} + Z`,
    redo: isMac ? `${modKey} + ⇧ + Z` : `${modKey} + Y`,
    printPreview: `${modKey} + P`,
  };

  const isRTL = uiLanguage === "ar";

  return (
    <div
      className={cn(
        "canvas-toolbar absolute flex flex-col gap-0.5 p-1 bg-background/80 backdrop-blur-sm border border-border/50 rounded-md z-30 transition-all hover:opacity-100 hover:bg-background/90 hover:border-border/70 shadow-md",
        "top-[25%] -translate-y-1/2",
        "left-1",
        "mobile-toolbar"
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onRegenerate}
        className="h-7 w-7 hover:bg-accent/50"
        aria-label={`${labels.regenerate} (${shortcuts.regenerate})`}
        title={`${labels.regenerate} (${shortcuts.regenerate})`}
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onUndo}
        disabled={!canUndo}
        className="h-7 w-7 hover:bg-accent/50"
        aria-label={`${labels.undo} (${shortcuts.undo})`}
        title={`${labels.undo} (${shortcuts.undo})`}
      >
        <Undo2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRedo}
        disabled={!canRedo}
        className="h-7 w-7 hover:bg-accent/50"
        aria-label={`${labels.redo} (${shortcuts.redo})`}
        title={`${labels.redo} (${shortcuts.redo})`}
      >
        <Redo2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrintPreviewToggle}
        className="h-7 w-7 hover:bg-accent/50"
        aria-label={`${isPrintPreview ? toolbarLabels.exitPrintPreview : toolbarLabels.printPreview} (${shortcuts.printPreview})`}
        title={`${isPrintPreview ? toolbarLabels.exitPrintPreview : toolbarLabels.printPreview} (${shortcuts.printPreview})`}
      >
        {isPrintPreview ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Printer className="h-3.5 w-3.5" />
        )}
      </Button>
      {onPdfPreview && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onPdfPreview}
          className="h-7 w-7 hover:bg-accent/50"
          aria-label={toolbarLabels.pdfPreview}
          title={toolbarLabels.pdfPreview}
        >
          <FileText className="h-3.5 w-3.5" />
        </Button>
      )}
      {onPdfDownload && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onPdfDownload}
          className="h-7 w-7 hover:bg-accent/50"
          aria-label={toolbarLabels.pdfDownload}
          title={toolbarLabels.pdfDownload}
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      )}
      {onSave && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onSave}
          className="h-7 w-7 hover:bg-accent/50"
          aria-label={labels.save}
          title={labels.save}
        >
          <Save className="h-3.5 w-3.5" />
        </Button>
      )}
      {onLoad && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onLoad}
          className="h-7 w-7 hover:bg-accent/50"
          aria-label={labels.load}
          title={labels.load}
        >
          <FolderOpen className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
