/**
 * Centralized UI labels for bilingual support
 */

import type { UiLanguage } from "../types/letter";

export interface Labels {
  // Common
  close: string;
  cancel: string;
  save: string;
  load: string;
  delete: string;
  download: string;
  upload: string;
  import: string;
  export: string;
  retry: string;
  
  // Letter
  regenerate: string;
  undo: string;
  redo: string;
  printPreview: string;
  exitPrintPreview: string;
  pdfPreview: string;
  pdfDownload: string;
  
  // Errors
  errorOccurred: string;
  failedToGenerate: string;
  failedToDownload: string;
  
  // Loading
  generating: string;
  loading: string;
}

const LABELS: Record<UiLanguage, Labels> = {
  ar: {
    close: "إغلاق",
    cancel: "إلغاء",
    save: "حفظ",
    load: "تحميل",
    delete: "حذف",
    download: "تحميل",
    upload: "رفع",
    import: "استيراد",
    export: "تصدير",
    retry: "إعادة المحاولة",
    regenerate: "إعادة توليد",
    undo: "تراجع",
    redo: "إعادة",
    printPreview: "معاينة الطباعة",
    exitPrintPreview: "إغلاق المعاينة",
    pdfPreview: "معاينة PDF",
    pdfDownload: "تحميل PDF",
    errorOccurred: "حدث خطأ",
    failedToGenerate: "فشل الإنشاء",
    failedToDownload: "فشل التحميل",
    generating: "جارٍ الإنشاء...",
    loading: "جارٍ التحميل...",
  },
  en: {
    close: "Close",
    cancel: "Cancel",
    save: "Save",
    load: "Load",
    delete: "Delete",
    download: "Download",
    upload: "Upload",
    import: "Import",
    export: "Export",
    retry: "Retry",
    regenerate: "Regenerate",
    undo: "Undo",
    redo: "Redo",
    printPreview: "Print Preview",
    exitPrintPreview: "Exit Preview",
    pdfPreview: "PDF Preview",
    pdfDownload: "Download PDF",
    errorOccurred: "An error occurred",
    failedToGenerate: "Failed to generate",
    failedToDownload: "Failed to download",
    generating: "Generating...",
    loading: "Loading...",
  },
};

export function getLabels(uiLanguage: UiLanguage): Labels {
  return LABELS[uiLanguage];
}
