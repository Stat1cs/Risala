import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient, hasOpenAIKey } from "@/lib/openai-client";
import {
  handleOpenAIError,
  handleMissingAPIKey,
  handleValidationError,
} from "@/lib/api-error-handler";
import {
  validateFileSize,
  validateFileType,
  FILE_SIZE_LIMITS,
} from "@/lib/validations/file-schema";

export async function POST(request: NextRequest) {
  // Check for API key first
  if (!hasOpenAIKey()) {
    return handleMissingAPIKey();
  }

  const openai = getOpenAIClient();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return handleValidationError("No audio file provided");
    }

    // Validate file type (must be audio)
    if (!validateFileType(file, "assistants")) {
      return handleValidationError(
        "Invalid file type. Only audio files are allowed for transcription."
      );
    }

    // Validate file size (25 MB max for audio)
    if (!validateFileSize(file, "assistants")) {
      return handleValidationError(
        `File too large. Maximum size is ${FILE_SIZE_LIMITS.audio / (1024 * 1024)} MB`
      );
    }

    // Convert File to OpenAI FileInput format
    const fileBuffer = await file.arrayBuffer();
    const fileBlob = new Blob([fileBuffer], { type: file.type });

    // Create a File object for OpenAI
    const openAIFile = new File([fileBlob], file.name, { type: file.type });

    // Use OpenAI Whisper API for transcription
    // Try gpt-4o-mini-transcribe first (better quality), fallback to whisper-1
    let transcription: string;
    try {
      const response = await openai.audio.transcriptions.create({
        file: openAIFile,
        model: "gpt-4o-mini-transcribe",
        language: "ar", // Default to Arabic, but model can auto-detect
        response_format: "text",
      });
      // When response_format is "text", OpenAI returns a string directly
      transcription = typeof response === "string" ? response : String(response);
    } catch (modelError: unknown) {
      // Fallback to whisper-1 if gpt-4o-mini-transcribe is not available
      const error = modelError as { code?: string; message?: string };
      if (error?.code === "model_not_found" || error?.message?.includes("model")) {
        console.log("gpt-4o-mini-transcribe not available, falling back to whisper-1");
        const response = await openai.audio.transcriptions.create({
          file: openAIFile,
          model: "whisper-1",
          language: "ar",
          response_format: "text",
        });
        // When response_format is "text", OpenAI returns a string directly
        transcription = typeof response === "string" ? response : String(response);
      } else {
        throw modelError;
      }
    }

    const text = transcription || "";

    return NextResponse.json({
      text: text.trim(),
    });
  } catch (error) {
    return handleOpenAIError(error, "transcribe audio");
  }
}
