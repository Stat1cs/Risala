import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient, hasOpenAIKey } from "@/lib/openai-client";
import {
  handleOpenAIError,
  handleMissingAPIKey,
  handleValidationError,
} from "@/lib/api-error-handler";
import { letterGenerateSchema } from "@/lib/validations/letter-schema";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import {
  generateCacheKey,
  getCachedResponse,
  setCachedResponse,
  withDeduplication,
  CACHE_CONFIG,
} from "@/lib/request-cache";
import { formatArabicDate, formatEnglishDate } from "@/lib/date-utils";
import {
  getRelevantExamples,
  formatExamplesForPrompt,
} from "@/lib/letter-helper";

export async function POST(request: NextRequest) {
  if (!hasOpenAIKey()) {
    return handleMissingAPIKey(
      "OpenAI API key not configured. Please add OPENAI_API_KEY."
    );
  }

  const rateLimit = withRateLimit(RATE_LIMITS.letterGeneration)(request);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: rateLimit.error },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = letterGenerateSchema.safeParse(body);

    if (!parsed.success) {
      return handleValidationError(
        parsed.error.issues.map(e => e.message).join(", ")
      );
    }

    const {
      purpose,
      language, // الجهة
      letterLanguage,
      message,
      currentContent,
      subject,
      closing,
      recipientTitle,
      recipientName,
      recipientOrganization,
      date,
      fileIds,
      mode,
    } = parsed.data;

    const cacheKey =
      mode === "generate" && fileIds.length === 0
        ? generateCacheKey(parsed.data)
        : null;

    if (cacheKey && CACHE_CONFIG.letterGeneration.enabled) {
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
      }
    }

    const openai = getOpenAIClient();

    const execute = async () => {
      // Get relevant examples for this organization type
      const examples = await getRelevantExamples(language, 3);
      const examplesSection = formatExamplesForPrompt(examples, letterLanguage);

      const systemPrompt = `
You are a professional assistant specializing in drafting official institutional correspondence in the Middle East.

LANGUAGE:
- Write in ${letterLanguage} ONLY
- Never bilingual
- Formal, institutional tone

MODEL:
- Input is: الغرض (purpose) + الجهة (recipient authority)
- Structure is handled by the interface

STRICT OUTPUT FORMAT:
You MUST return valid JSON ONLY (no other text) with this exact structure:

{
  "body": "string",
  "suggestedSubject": "string or null",
  "suggestedClosing": "string or null",
  "suggestedRecipientTitle": "string or null",
  "suggestedRecipientName": "string or null",
  "suggestedRecipientOrganization": "string or null"
}

RULES:
- Return ONLY valid JSON, no explanations or markdown
- Do NOT include greeting, date, subject, closing phrases, or signature in body
- The body content MUST end before any closing phrases (do NOT include phrases like "وتفضلوا بقبول فائق الاحترام والتقدير" or "Yours sincerely" in the body)
- Do NOT repeat placeholders
- The "suggestedClosing" field is the ONLY place where closing phrases should appear (e.g., "وتفضلوا بقبول فائق الاحترام والتقدير،" for Arabic, "Yours sincerely," for English)
- If the body currently contains closing phrases, remove them and place them only in "suggestedClosing"
- If new context/details are provided by the user, you MUST incorporate them fully into the body content
- If a subject is provided, ensure the body content aligns with and reflects that subject
- If regenerating with existing content AND new context, merge the new information seamlessly into the existing content
- Preserve all user edits if regenerating, but incorporate new information when provided
- The "body" field is required, others are optional${examplesSection}

IMPORTANT: Before generating, review the reference examples above. Your output MUST:
- Start with formal opening phrases from the examples (e.g., "بالإشارة إلى")
- Follow the same sentence structure and flow
- End the body content BEFORE any closing phrases
- Put closing phrases ONLY in the "suggestedClosing" field, NOT in the body
- Match the formal tone and style precisely
`;

      const userPrompt = `
الغرض:
${purpose}

الجهة:
${language}

${subject ? `الموضوع الحالي:\n${subject}\n` : ""}

${message ? `تفاصيل إضافية/سياق جديد:\n${message}\n` : ""}

${examples.length > 0 ? `
⚠️ تذكير مهم: راجع الأمثلة المرجعية في التعليمات أعلاه واتبع نفس الأسلوب والصياغة بدقة.
` : ""}

${currentContent ? `
المحتوى الحالي (تم تعديله من المستخدم):
${currentContent}

${message ? `
المطلوب: 
1. دمج التفاصيل الجديدة/السياق الجديد المذكور أعلاه في المحتوى
2. تحديث المحتوى ليعكس المعلومات الجديدة بشكل كامل
3. تحسين الصياغة مع الحفاظ على المعلومات الموجودة وإضافة الجديدة
4. استخدام نفس الصيغ الافتتاحية من الأمثلة المرجعية
5. إزالة أي عبارات ختامية من المحتوى (مثل "وتفضلوا بقبول فائق الاحترام والتقدير") ووضعها فقط في حقل "suggestedClosing"${subject ? `
6. التأكد من أن المحتوى يتناسب تماماً مع الموضوع: ${subject}` : ""}
` : `
المطلوب: تحسين الصياغة فقط دون تغيير المعنى أو حذف أي معلومات. استخدم نفس الصيغ والأسلوب من الأمثلة المرجعية. إزالة أي عبارات ختامية من المحتوى ووضعها فقط في حقل "suggestedClosing".${subject ? ` تأكد من أن المحتوى يتناسب مع الموضوع المحدد: ${subject}` : ""}
`}
` : `
المطلوب: صياغة محتوى رسمي متكامل${subject ? ` يتناسب مع الموضوع: ${subject}` : ""}${message ? ` ويشمل جميع التفاصيل المذكورة أعلاه` : ""}. استخدم نفس الأسلوب والصياغة من الأمثلة المرجعية في التعليمات. لا تضع عبارات ختامية في المحتوى، بل ضعها فقط في حقل "suggestedClosing".
`}
`;

      const model = fileIds.length > 0 ? "gpt-4o-mini" : "gpt-4.1-nano";

      const response = await openai.responses.create({
        model,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.6,
      });

      // Parse the JSON response manually
      let ai: {
        body: string;
        suggestedSubject?: string | null;
        suggestedClosing?: string | null;
        suggestedRecipientTitle?: string | null;
        suggestedRecipientName?: string | null;
        suggestedRecipientOrganization?: string | null;
      };
      
      try {
        const outputText = response.output_text || "";
        // Remove any markdown code blocks if present
        const cleanedText = outputText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        ai = JSON.parse(cleanedText);
      } catch {
        // Fallback if JSON parsing fails - use entire output as body
        ai = {
          body: response.output_text || "",
          suggestedSubject: null,
          suggestedClosing: null,
          suggestedRecipientTitle: null,
          suggestedRecipientName: null,
          suggestedRecipientOrganization: null,
        };
      }

      // If user provided new context (message) or changed subject, allow AI to update subject
      // Otherwise, prefer existing subject if it exists
      const shouldUpdateSubject = !!message || (mode === "regenerate" && !subject);
      const finalSubject = shouldUpdateSubject 
        ? (ai.suggestedSubject || subject || "")
        : (subject || ai.suggestedSubject || "");

      // If user provided new context (message) or changed closing, allow AI to update closing
      // Otherwise, prefer existing closing if it exists
      const shouldUpdateClosing = !!message || (mode === "regenerate" && !closing);
      const finalClosing = shouldUpdateClosing 
        ? (ai.suggestedClosing || closing || "")
        : (closing || ai.suggestedClosing || "");

      // Post-process body to remove any closing phrases that might have been included
      // Common Arabic closing phrases
      const arabicClosingPatterns = [
        /وتفضلوا بقبول فائق الاحترام والتقدير[،.]?/gi,
        /وتفضلوا بقبول فائق الاحترام[،.]?/gi,
        /وتفضلوا بقبول التحية[،.]?/gi,
        /وتفضلوا بقبول الاحترام[،.]?/gi,
        /وتفضلوا بقبول التقدير[،.]?/gi,
        /وتفضلوا بقبول فائق التقدير[،.]?/gi,
        /وتفضلوا بقبول وافر الاحترام[،.]?/gi,
      ];
      
      // Common English closing phrases
      const englishClosingPatterns = [
        /Yours sincerely[.,]?/gi,
        /Yours faithfully[.,]?/gi,
        /Yours truly[.,]?/gi,
        /Best regards[.,]?/gi,
        /Sincerely[.,]?/gi,
        /Respectfully[.,]?/gi,
      ];
      
      let cleanedBody = ai.body;
      const closingPatterns = letterLanguage === "Arabic" ? arabicClosingPatterns : englishClosingPatterns;
      
      // Remove closing phrases from body
      for (const pattern of closingPatterns) {
        cleanedBody = cleanedBody.replace(pattern, "").trim();
      }
      
      // Also remove any trailing punctuation and whitespace that might remain
      cleanedBody = cleanedBody.replace(/[،,.\s]+$/, "").trim();

      const result = {
        content: cleanedBody,
        subject: finalSubject,
        closing: finalClosing,
        recipientTitle:
          recipientTitle || ai.suggestedRecipientTitle || "",
        recipientName:
          recipientName || ai.suggestedRecipientName || "",
        recipientOrganization:
          recipientOrganization ||
          ai.suggestedRecipientOrganization ||
          "",
        date:
          date ||
          (letterLanguage === "Arabic"
            ? formatArabicDate(new Date())
            : formatEnglishDate(new Date())),
      };

      if (cacheKey && CACHE_CONFIG.letterGeneration.enabled) {
        setCachedResponse(
          cacheKey,
          result,
          CACHE_CONFIG.letterGeneration.ttlMs
        );
      }

      return result;
    };

    const response = cacheKey
      ? await withDeduplication(cacheKey, execute)
      : await execute();

    return NextResponse.json(response, {
      headers: {
        "X-RateLimit-Remaining": rateLimit.remaining?.toString() || "0",
      },
    });
  } catch (error) {
    return handleOpenAIError(error, "letter generation");
  }
}
