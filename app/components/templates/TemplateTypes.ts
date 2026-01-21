export type TemplateId = "official" | "business" | "complaint" | "request" | "inquiry" | "freeform";

export interface Template {
  id: TemplateId;
  name: {
    ar: string;
    en: string;
  };
  description?: {
    ar: string;
    en: string;
  };
}

export interface TemplateField {
  id: string;
  type: "date" | "recipient" | "subject" | "content" | "signature" | "bismillah" | "greeting";
  required?: boolean;
  order: number;
}

export interface TemplateLayout {
  id: TemplateId;
  fields: TemplateField[];
  styles?: {
    spacing?: Record<string, number>;
    alignment?: Record<string, "left" | "right" | "center">;
  };
}

export const TEMPLATES: Template[] = [
  {
    id: "official",
    name: { ar: "رسمي", en: "Official" },
    description: { ar: "رسالة رسمية حكومية", en: "Official government letter" },
  },
  {
    id: "business",
    name: { ar: "تجاري", en: "Business" },
    description: { ar: "رسالة تجارية", en: "Business letter" },
  },
  {
    id: "complaint",
    name: { ar: "شكوى", en: "Complaint" },
    description: { ar: "رسالة شكوى رسمية", en: "Formal complaint letter" },
  },
  {
    id: "request",
    name: { ar: "طلب", en: "Request" },
    description: { ar: "رسالة طلب", en: "Request letter" },
  },
  {
    id: "inquiry",
    name: { ar: "استفسار", en: "Inquiry" },
    description: { ar: "رسالة استفسار", en: "Inquiry letter" },
  },
  {
    id: "freeform",
    name: { ar: "حر", en: "Freeform" },
    description: { ar: "تخطيط مخصص", en: "Custom layout" },
  },
];
