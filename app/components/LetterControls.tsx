"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
  ComboboxInput,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "./ThemeToggle";
import { TemplateId, TEMPLATES } from "./templates/TemplateTypes";
import type { LetterPurpose, Language, UiLanguage } from "@/lib/types/letter";

interface LetterControlsProps {
  purpose: LetterPurpose;
  language: Language;
  template: TemplateId;
  uiLanguage: UiLanguage;
  onPurposeChange: (purpose: LetterPurpose) => void;
  onLanguageChange: (language: Language) => void;
  onTemplateChange: (template: TemplateId) => void;
  onUiLanguageChange: (lang: UiLanguage) => void;
}

// Purpose options with bilingual labels
const getPurposeOptions = (uiLanguage: UiLanguage) => {
  if (uiLanguage === "ar") {
    return [
      { value: "Request" as LetterPurpose, label: "طلب" },
      { value: "Notification" as LetterPurpose, label: "إشعار" },
      { value: "Warning" as LetterPurpose, label: "تنبيه" },
      { value: "Complaint" as LetterPurpose, label: "شكوى" },
      { value: "Confirmation" as LetterPurpose, label: "تأكيد" },
    ];
  } else {
    return [
      { value: "Request" as LetterPurpose, label: "Request" },
      { value: "Notification" as LetterPurpose, label: "Notification" },
      { value: "Warning" as LetterPurpose, label: "Alert" },
      { value: "Complaint" as LetterPurpose, label: "Complaint" },
      { value: "Confirmation" as LetterPurpose, label: "Confirmation" },
    ];
  }
};

// Language options (Recipient/Authority) with bilingual labels
const getLanguageOptions = (uiLanguage: UiLanguage) => {
  if (uiLanguage === "ar") {
    return [
      { value: "Police" as Language, label: "شرطة عمان السلطانية" },
      { value: "Ministry" as Language, label: "وزارة" },
      { value: "Municipality" as Language, label: "بلدية" },
      { value: "Government" as Language, label: "مؤسسة حكومية" },
      { value: "Private" as Language, label: "مؤسسة خاصة" },
      { value: "Diwan" as Language, label: "الديوان" },
    ];
  } else {
    return [
      { value: "Police" as Language, label: "Royal Oman Police" },
      { value: "Ministry" as Language, label: "Ministry" },
      { value: "Municipality" as Language, label: "Municipality" },
      { value: "Government" as Language, label: "Government Institution" },
      { value: "Private" as Language, label: "Private Institution" },
      { value: "Diwan" as Language, label: "Diwan" },
    ];
  }
};

export function LetterControls({
  purpose,
  language,
  template,
  uiLanguage,
  onPurposeChange,
  onLanguageChange,
  onTemplateChange,
  onUiLanguageChange,
}: LetterControlsProps) {
  const purposeOptions = getPurposeOptions(uiLanguage);
  const languageOptions = getLanguageOptions(uiLanguage);
  const templateOptions = TEMPLATES.map(t => ({
    value: t.id,
    label: t.name[uiLanguage],
  }));

  return (
    <div className="fixed top-4 left-0 right-0 z-40 pointer-events-none letter-controls-mobile" dir={uiLanguage === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-2xl px-4 pb-2 pointer-events-auto">
        <div className="flex flex-wrap items-center justify-center gap-4 px-6 py-3 bg-background/90 backdrop-blur-md border border-border/60 shadow-xl rounded-2xl letter-controls-container">
          <div className="flex items-center gap-2">
            <Label htmlFor="purpose" className="text-xs font-medium whitespace-nowrap text-muted-foreground letter-controls-label">
              {uiLanguage === "ar" ? "الغرض" : "Purpose"}
            </Label>
            <Combobox
              items={purposeOptions.map(opt => opt.value)}
              value={purpose}
              onValueChange={(value) => onPurposeChange(value as LetterPurpose)}
            >
              <ComboboxInput
                id="purpose"
                placeholder={uiLanguage === "ar" ? "اختر الغرض" : "Select purpose"}
                className="w-[120px] h-8 text-xs letter-controls-input"
                showTrigger
                value={purposeOptions.find(opt => opt.value === purpose)?.label || ""}
                readOnly
              />
              <ComboboxContent>
                <ComboboxList>
                  {(item) => {
                    const option = purposeOptions.find(opt => opt.value === item);
                    return (
                      <ComboboxItem key={item} value={item}>
                        {option?.label || item}
                      </ComboboxItem>
                    );
                  }}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="language" className="text-xs font-medium whitespace-nowrap text-muted-foreground letter-controls-label">
              {uiLanguage === "ar" ? "الجهة" : "Recipient"}
            </Label>
            <Combobox
              items={languageOptions.map(opt => opt.value)}
              value={language}
              onValueChange={(value) => onLanguageChange(value as Language)}
            >
              <ComboboxInput
                id="language"
                placeholder={uiLanguage === "ar" ? "اختر الجهة" : "Select recipient"}
                className="w-[180px] h-8 text-xs letter-controls-input"
                showTrigger
                value={languageOptions.find(opt => opt.value === language)?.label || ""}
                readOnly
              />
              <ComboboxContent>
                <ComboboxList>
                  {(item) => {
                    const option = languageOptions.find(opt => opt.value === item);
                    return (
                      <ComboboxItem key={item} value={item}>
                        {option?.label || item}
                      </ComboboxItem>
                    );
                  }}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="template" className="text-xs font-medium whitespace-nowrap text-muted-foreground letter-controls-label">
              {uiLanguage === "ar" ? "القالب" : "Template"}
            </Label>
            <Combobox
              items={templateOptions.map(opt => opt.value)}
              value={template}
              onValueChange={(value) => onTemplateChange(value as TemplateId)}
            >
              <ComboboxInput
                id="template"
                placeholder={uiLanguage === "ar" ? "اختر القالب" : "Select template"}
                className="w-[140px] h-8 text-xs letter-controls-input"
                showTrigger
                value={templateOptions.find(opt => opt.value === template)?.label || ""}
                readOnly
              />
              <ComboboxContent>
                <ComboboxList>
                  {(item) => {
                    const option = templateOptions.find(opt => opt.value === item);
                    return (
                      <ComboboxItem key={item} value={item}>
                        {option?.label || item}
                      </ComboboxItem>
                    );
                  }}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className={`flex items-center gap-3 ${uiLanguage === "ar" ? "mr-auto" : "ml-auto"}`}>
            <button
              onClick={() => onUiLanguageChange(uiLanguage === "ar" ? "en" : "ar")}
              className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-accent transition-colors letter-controls-button"
              aria-label={uiLanguage === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            >
              {uiLanguage === "ar" ? "EN" : "عربي"}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
