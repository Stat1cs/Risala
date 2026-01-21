import { readFile } from "fs/promises";
import path from "path";

interface LetterExample {
  title?: string;
  recipientTitle?: string;
  recipientOrganization?: string;
  greeting?: string;
  body?: string;
  closing?: string;
  signature?: string;
}

/**
 * Get all letter examples from the JSON file
 */
export async function getLetterExamples(): Promise<Record<string, LetterExample[]>> {
  const filePath = path.join(process.cwd(), "data", "letter-examples.json");
  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content) as Record<string, LetterExample[]>;
}

/**
 * Map language/organization enum to JSON key (case-insensitive)
 */
function mapLanguageToKey(language: string): string {
  const normalized = language.toLowerCase();
  // Map common variations
  const mapping: Record<string, string> = {
    police: "police",
    diwan: "diwan",
    ministry: "ministry",
    municipality: "municipality",
    government: "government",
    private: "private",
  };
  return mapping[normalized] || normalized;
}

/**
 * Get relevant letter examples for a specific organization type
 * @param language - The organization type (e.g., "Police", "Diwan")
 * @param limit - Maximum number of examples to return (default: 3)
 */
export async function getRelevantExamples(
  language: string,
  limit: number = 3
): Promise<LetterExample[]> {
  const examples = await getLetterExamples();
  const key = mapLanguageToKey(language);
  const relevantExamples = examples[key] || [];
  
  // Return up to the specified limit
  return relevantExamples.slice(0, limit);
}

/**
 * Format examples as a structured reference for AI prompts
 * @param examples - Array of letter examples
 * @param letterLanguage - Target language for the letter ("Arabic" or "English")
 */
export function formatExamplesForPrompt(
  examples: LetterExample[],
  letterLanguage: "Arabic" | "English"
): string {
  if (examples.length === 0) {
    return "";
  }

  // Only include examples if they match the target language
  // For now, all examples are in Arabic, so we only include them for Arabic letters
  if (letterLanguage !== "Arabic") {
    return "";
  }

  let formatted = "\n\n";
  formatted += "═══════════════════════════════════════════════════════════════\n";
  formatted += "⚠️ CRITICAL: REFERENCE EXAMPLES - YOU MUST FOLLOW THESE EXACTLY ⚠️\n";
  formatted += "═══════════════════════════════════════════════════════════════\n";
  formatted += "These are REAL examples of official letters. Study them carefully and match:\n";
  formatted += "- Opening phrases and formal expressions\n";
  formatted += "- Sentence structure and flow\n";
  formatted += "- Tone and formality level\n";
  formatted += "- Closing patterns\n";
  formatted += "- Overall style and phrasing\n\n";

  examples.forEach((example, index) => {
    formatted += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    formatted += `EXAMPLE ${index + 1}${example.title ? `: ${example.title}` : ""}\n`;
    formatted += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (example.recipientTitle) {
      formatted += `RECIPIENT TITLE: ${example.recipientTitle}\n`;
    }
    if (example.recipientOrganization) {
      formatted += `ORGANIZATION: ${example.recipientOrganization}\n`;
    }
    if (example.greeting) {
      formatted += `GREETING: ${example.greeting}\n`;
    }
    if (example.body) {
      // Show full body or at least 1200 characters to capture complete patterns
      const bodyPreview = example.body.length > 1200 
        ? example.body.substring(0, 1200) + "..."
        : example.body;
      formatted += `\nBODY TEXT (study the opening, structure, and flow):\n${bodyPreview}\n`;
    }
    if (example.closing) {
      formatted += `CLOSING: ${example.closing}\n`;
    }
    
    formatted += "\n";
  });

  formatted += "═══════════════════════════════════════════════════════════════\n";
  formatted += "MANDATORY REQUIREMENTS (based on examples above):\n";
  formatted += "═══════════════════════════════════════════════════════════════\n";
  formatted += "1. OPENING: Use formal Arabic opening phrases from examples:\n";
  formatted += "   - 'بالإشارة إلى الموضوع أعلاه' or 'بالإشـارة إلى الموضوع أعـلاه'\n";
  formatted += "   - 'نتقدم إليكم' or 'نود الاحاطة بأن'\n";
  formatted += "   - 'نرجو التكرم' or 'نتعهد لكم بأن'\n\n";
  formatted += "2. STRUCTURE: Follow the same paragraph structure and flow as examples\n\n";
  formatted += "3. CLOSING: Use EXACT closing pattern from examples:\n";
  formatted += "   - 'وتفضلوا بقبول فائق الاحترام والتقدير,,,' (with commas)\n";
  formatted += "   - OR 'وتفضلوا بقبول فائق الاحترام والتقدير،،،،' (with Arabic commas)\n\n";
  formatted += "4. TONE: Match the formal, respectful tone exactly\n\n";
  formatted += "5. LANGUAGE: Use direct, formal Arabic - NO gender-neutral '/' in body text\n\n";
  formatted += "6. EXPRESSIONS: Reuse formal expressions from examples when appropriate\n\n";
  formatted += "═══════════════════════════════════════════════════════════════\n";

  return formatted;
}
