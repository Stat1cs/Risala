/**
 * Shared API route handler utilities
 */

import { NextRequest, NextResponse } from "next/server";
import { hasOpenAIKey } from "../openai-client";
import { handleMissingAPIKey, handleOpenAIError } from "../api-error-handler";

/**
 * Wrapper for API routes that require OpenAI
 */
export function withOpenAI<T>(
  handler: (request: NextRequest, openai: ReturnType<typeof import("../openai-client").getOpenAIClient>) => Promise<T>
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    if (!hasOpenAIKey()) {
      return handleMissingAPIKey() as NextResponse<T>;
    }

    try {
      const { getOpenAIClient } = await import("../openai-client");
      const openai = getOpenAIClient();
      const result = await handler(request, openai);
      return NextResponse.json(result);
    } catch (error) {
      return handleOpenAIError(error, "API request") as NextResponse<T>;
    }
  };
}

/**
 * Extract file from FormData with validation
 */
export async function extractFileFromFormData(
  formData: FormData,
  fieldName: string = "file"
): Promise<File | null> {
  const file = formData.get(fieldName);
  if (!file || !(file instanceof File)) {
    return null;
  }
  return file;
}
