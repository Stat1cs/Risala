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
    const purpose = (formData.get("purpose") as string) || "user_data";

    if (!file) {
      return handleValidationError("No file provided");
    }

    // Validate purpose
    if (
      purpose !== "assistants" &&
      purpose !== "batch" &&
      purpose !== "fine-tune" &&
      purpose !== "user_data" &&
      purpose !== "vision"
    ) {
      return handleValidationError("Invalid purpose value");
    }

    const purposeTyped = purpose as "assistants" | "user_data";

    // Validate file type
    if (!validateFileType(file, purposeTyped)) {
      return handleValidationError(
        "Invalid file type. Please upload a supported file format."
      );
    }

    // Validate file size based on purpose
    if (!validateFileSize(file, purposeTyped)) {
      const maxSize =
        purposeTyped === "assistants"
          ? FILE_SIZE_LIMITS.audio
          : FILE_SIZE_LIMITS.document;
      return handleValidationError(
        `File too large. Maximum size is ${maxSize / (1024 * 1024)} MB`
      );
    }

    // Convert File to OpenAI FileInput format
    const fileBuffer = await file.arrayBuffer();
    const fileBlob = new Blob([fileBuffer], { type: file.type });

    // Create a File object for OpenAI
    const openAIFile = new File([fileBlob], file.name, { type: file.type });

    // Upload file to OpenAI
    const uploadedFile = await openai.files.create({
      file: openAIFile,
      purpose: purpose as "assistants" | "batch" | "fine-tune" | "user_data" | "vision",
    });

    return NextResponse.json({
      fileId: uploadedFile.id,
      filename: uploadedFile.filename,
      bytes: uploadedFile.bytes,
      purpose: uploadedFile.purpose,
    });
  } catch (error) {
    return handleOpenAIError(error, "upload file");
  }
}
