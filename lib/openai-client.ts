import OpenAI from "openai";

/**
 * Shared OpenAI client instance
 * Ensures we only create one instance and can validate API key at startup
 */
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file. Get your key from https://platform.openai.com/api-keys"
    );
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

/**
 * Check if OpenAI API key is configured
 */
export function hasOpenAIKey(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
