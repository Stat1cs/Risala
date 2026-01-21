import { TemplateLayout, TemplateId } from "./TemplateTypes";

/**
 * Template Registry
 * Defines the layout structure for each template type
 */
export const TEMPLATE_LAYOUTS: Record<TemplateId, TemplateLayout> = {
  official: {
    id: "official",
    fields: [
      { id: "bismillah", type: "bismillah", order: 0 },
      { id: "date", type: "date", required: true, order: 1 },
      { id: "recipient", type: "recipient", required: true, order: 2 },
      { id: "greeting", type: "greeting", order: 3 },
      { id: "subject", type: "subject", required: true, order: 4 },
      { id: "content", type: "content", required: true, order: 5 },
      { id: "signature", type: "signature", order: 6 },
    ],
  },
  business: {
    id: "business",
    fields: [
      { id: "date", type: "date", required: true, order: 1 },
      { id: "recipient", type: "recipient", required: true, order: 2 },
      { id: "subject", type: "subject", required: true, order: 3 },
      { id: "content", type: "content", required: true, order: 4 },
      { id: "signature", type: "signature", order: 5 },
    ],
  },
  complaint: {
    id: "complaint",
    fields: [
      { id: "bismillah", type: "bismillah", order: 0 },
      { id: "date", type: "date", required: true, order: 1 },
      { id: "recipient", type: "recipient", required: true, order: 2 },
      { id: "greeting", type: "greeting", order: 3 },
      { id: "subject", type: "subject", required: true, order: 4 },
      { id: "content", type: "content", required: true, order: 5 },
      { id: "signature", type: "signature", order: 6 },
    ],
  },
  request: {
    id: "request",
    fields: [
      { id: "bismillah", type: "bismillah", order: 0 },
      { id: "date", type: "date", required: true, order: 1 },
      { id: "recipient", type: "recipient", required: true, order: 2 },
      { id: "greeting", type: "greeting", order: 3 },
      { id: "subject", type: "subject", required: true, order: 4 },
      { id: "content", type: "content", required: true, order: 5 },
      { id: "signature", type: "signature", order: 6 },
    ],
  },
  inquiry: {
    id: "inquiry",
    fields: [
      { id: "bismillah", type: "bismillah", order: 0 },
      { id: "date", type: "date", required: true, order: 1 },
      { id: "recipient", type: "recipient", required: true, order: 2 },
      { id: "greeting", type: "greeting", order: 3 },
      { id: "subject", type: "subject", required: true, order: 4 },
      { id: "content", type: "content", required: true, order: 5 },
      { id: "signature", type: "signature", order: 6 },
    ],
  },
  freeform: {
    id: "freeform",
    fields: [
      { id: "date", type: "date", order: 1 },
      { id: "recipient", type: "recipient", order: 2 },
      { id: "subject", type: "subject", order: 3 },
      { id: "content", type: "content", order: 4 },
      { id: "signature", type: "signature", order: 5 },
    ],
  },
};

export function getTemplateLayout(templateId: TemplateId): TemplateLayout {
  return TEMPLATE_LAYOUTS[templateId] || TEMPLATE_LAYOUTS.official;
}
