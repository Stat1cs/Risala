"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getLabels } from "@/lib/constants/ui-labels";
import { sanitizeFilename, downloadFile } from "@/lib/utils/file";

interface SavedLetter {
  id: string;
  name: string;
  timestamp: number;
  data: {
    content: string;
    date: string;
    recipientTitle: string;
    recipientName: string;
    recipientOrganization: string;
    subject: string;
    language: "Arabic" | "English";
    signature?: string;
    closing?: string;
  };
}

interface SaveLoadDialogProps {
  isOpen: boolean;
  mode: "save" | "load";
  onClose: () => void;
  onSave?: (name: string) => void;
  onLoad?: (letter: SavedLetter) => void;
  currentLetterData?: SavedLetter["data"];
  uiLanguage: "ar" | "en";
}

const STORAGE_KEY = "risala_saved_letters";

export function SaveLoadDialog({
  isOpen,
  mode,
  onClose,
  onSave,
  onLoad,
  currentLetterData,
  uiLanguage,
}: SaveLoadDialogProps) {
  const [savedLetters, setSavedLetters] = useState<SavedLetter[]>([]);
  const [saveName, setSaveName] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<SavedLetter | null>(null);

  const isRTL = uiLanguage === "ar";

  useEffect(() => {
    if (isOpen) {
      loadSavedLetters();
      if (mode === "save" && currentLetterData?.subject) {
        setSaveName(currentLetterData.subject.substring(0, 50));
      }
    }
  }, [isOpen, mode, currentLetterData]);

  const loadSavedLetters = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const letters = JSON.parse(stored) as SavedLetter[];
        // Sort by timestamp, newest first
        letters.sort((a, b) => b.timestamp - a.timestamp);
        setSavedLetters(letters);
      }
    } catch (error) {
      console.error("Error loading saved letters:", error);
      setSavedLetters([]);
    }
  };

  const handleSave = () => {
    if (!saveName.trim() || !currentLetterData || !onSave) return;

    const newLetter: SavedLetter = {
      id: Date.now().toString(),
      name: saveName.trim(),
      timestamp: Date.now(),
      data: currentLetterData,
    };

    const updated = [newLetter, ...savedLetters.filter((l) => l.id !== newLetter.id)];
    // Keep only last 20 saved letters
    const limited = updated.slice(0, 20);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
      onSave(saveName.trim());
      onClose();
    } catch (error) {
      console.error("Error saving letter:", error);
      alert(uiLanguage === "ar" ? "حدث خطأ أثناء الحفظ" : "An error occurred while saving");
    }
  };

  const handleLoad = (letter: SavedLetter) => {
    if (onLoad) {
      onLoad(letter);
      onClose();
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(uiLanguage === "ar" ? "هل أنت متأكد من حذف هذه الرسالة؟" : "Are you sure you want to delete this letter?")) {
      const updated = savedLetters.filter((l) => l.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setSavedLetters(updated);
        if (selectedLetter?.id === id) {
          setSelectedLetter(null);
        }
      } catch (error) {
        console.error("Error deleting letter:", error);
      }
    }
  };

  const handleExport = (letter: SavedLetter, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const dataStr = JSON.stringify(letter, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const filename = `${sanitizeFilename(letter.name)}_${new Date(letter.timestamp).toISOString().split("T")[0]}.json`;
      downloadFile(dataBlob, filename);
    } catch (error) {
      console.error("Error exporting letter:", error);
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const letter = JSON.parse(event.target?.result as string) as SavedLetter;
            if (letter.data && letter.name) {
              const updated = [letter, ...savedLetters.filter((l) => l.id !== letter.id)];
              const limited = updated.slice(0, 20);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
              loadSavedLetters();
              if (onLoad) {
                onLoad(letter);
                onClose();
              }
            }
          } catch (error) {
            alert(uiLanguage === "ar" ? "ملف غير صالح" : "Invalid file");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  if (!isOpen) return null;

  const labels = getLabels(uiLanguage);
  const dialogLabels = {
    saveTitle: uiLanguage === "ar" ? "حفظ الرسالة" : "Save Letter",
    loadTitle: uiLanguage === "ar" ? "تحميل الرسالة" : "Load Letter",
    name: uiLanguage === "ar" ? "اسم الرسالة" : "Letter Name",
    noSaved: uiLanguage === "ar" ? "لا توجد رسائل محفوظة" : "No saved letters",
    subject: uiLanguage === "ar" ? "الموضوع: " : "Subject: ",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className={cn(
          "relative bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] m-4 flex flex-col",
          isRTL && "text-right"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {mode === "save" ? dialogLabels.saveTitle : dialogLabels.loadTitle}
          </h2>
          <div className="flex items-center gap-2">
            {mode === "load" && (
              <Button variant="outline" size="sm" onClick={handleImport} className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {labels.import}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} aria-label={labels.cancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
              {mode === "save" ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{dialogLabels.name}</label>
                <Input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder={uiLanguage === "ar" ? "أدخل اسم الرسالة" : "Enter letter name"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSave();
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {savedLetters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {dialogLabels.noSaved}
                </div>
              ) : (
                savedLetters.map((letter) => (
                  <div
                    key={letter.id}
                    className={cn(
                      "p-3 border rounded-lg cursor-pointer transition-colors",
                      selectedLetter?.id === letter.id
                        ? "bg-accent border-primary"
                        : "hover:bg-accent/50"
                    )}
                    onClick={() => setSelectedLetter(letter)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{letter.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(letter.timestamp).toLocaleString(uiLanguage === "ar" ? "ar-SA" : "en-US")}
                        </p>
                        {letter.data.subject && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {dialogLabels.subject}
                            {letter.data.subject}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => handleExport(letter, e)}
                          title={labels.export}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => handleDelete(letter.id, e)}
                          title={labels.delete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {labels.cancel}
          </Button>
          {mode === "save" ? (
            <Button onClick={handleSave} disabled={!saveName.trim()}>
              {labels.save}
            </Button>
          ) : (
            <Button
              onClick={() => selectedLetter && handleLoad(selectedLetter)}
              disabled={!selectedLetter}
            >
              {labels.load}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
