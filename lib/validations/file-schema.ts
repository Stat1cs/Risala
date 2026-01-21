import { z } from "zod";

/**
 * Allowed file types for uploads
 */
export const ALLOWED_FILE_TYPES = {
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  images: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  audio: [
    "audio/mpeg",
    "audio/mp4",
    "audio/mpeg",
    "audio/mpga",
    "audio/m4a",
    "audio/wav",
    "audio/webm",
  ],
} as const;

/**
 * Allowed file extensions (for client-side validation)
 */
export const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".mp3",
  ".mp4",
  ".mpeg",
  ".mpga",
  ".m4a",
  ".wav",
  ".webm",
] as const;

/**
 * File size limits in bytes
 */
export const FILE_SIZE_LIMITS = {
  audio: 25 * 1024 * 1024, // 25 MB
  document: 50 * 1024 * 1024, // 50 MB
  image: 10 * 1024 * 1024, // 10 MB
} as const;

/**
 * Validate file type by MIME type
 */
export function validateFileType(file: File, purpose: "assistants" | "user_data"): boolean {
  const allowedTypes: readonly string[] =
    purpose === "assistants"
      ? [...ALLOWED_FILE_TYPES.audio]
      : [
          ...ALLOWED_FILE_TYPES.documents,
          ...ALLOWED_FILE_TYPES.images,
          ...ALLOWED_FILE_TYPES.audio,
        ];

  return allowedTypes.includes(file.type);
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, purpose: "assistants" | "user_data"): boolean {
  const maxSize =
    purpose === "assistants" ? FILE_SIZE_LIMITS.audio : FILE_SIZE_LIMITS.document;
  return file.size <= maxSize;
}

/**
 * Schema for file upload request (form data)
 */
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: "File is required" }),
  purpose: z.enum(["assistants", "batch", "fine-tune", "user_data", "vision"]).default("user_data"),
});

/**
 * Schema for file upload response
 */
export const fileUploadResponseSchema = z.object({
  fileId: z.string(),
  filename: z.string(),
  bytes: z.number(),
  purpose: z.string(),
});

export type FileUploadResponse = z.infer<typeof fileUploadResponseSchema>;

/**
 * Schema for audio transcription request (form data)
 */
export const audioTranscribeSchema = z.object({
  file: z.instanceof(File, { message: "Audio file is required" }),
});

/**
 * Schema for audio transcription response
 */
export const audioTranscribeResponseSchema = z.object({
  text: z.string(),
});

export type AudioTranscribeResponse = z.infer<typeof audioTranscribeResponseSchema>;
