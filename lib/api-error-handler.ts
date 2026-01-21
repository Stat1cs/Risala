import { NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  error: string;
}

/**
 * Handle OpenAI API errors and return appropriate HTTP responses
 */
export function handleOpenAIError(
  error: unknown,
  context: string = "operation"
): NextResponse<ErrorResponse> {
  console.error(`OpenAI API error (${context}):`, error);

  // Handle OpenAI API errors
  if (error instanceof OpenAI.APIError) {
    if (error.status === 401) {
      return NextResponse.json(
        {
          error:
            "Invalid API key. Please check your OpenAI API key in .env.local. Make sure it starts with 'sk-' and is valid. Get a new key from https://platform.openai.com/api-keys",
        },
        { status: 401 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `OpenAI API error: ${error.message}` },
      { status: error.status || 500 }
    );
  }

  // Handle generic errors
  const errorMessage =
    error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json(
    {
      error: `Failed to ${context}: ${errorMessage}. Please check your OpenAI API key and try again.`,
    },
    { status: 500 }
  );
}

/**
 * Handle missing API key error
 */
export function handleMissingAPIKey(
  customMessage?: string
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error:
        customMessage ||
        "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.",
    },
    { status: 500 }
  );
}

/**
 * Handle validation errors (400 Bad Request)
 */
export function handleValidationError(
  message: string
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status: 400 });
}
