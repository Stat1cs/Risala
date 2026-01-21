/**
 * File utility functions
 */

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Sanitize filename for safe download
 */
export function sanitizeFilename(filename: string, maxLength: number = 50): string {
  return filename
    .replace(/[^a-z0-9\u0600-\u06FF\s]/gi, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .substring(0, maxLength)
    .trim()
    .replace(/_+$/, "");
}

/**
 * Create a download link and trigger download
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Extract filename from Content-Disposition header
 */
export function extractFilenameFromHeader(contentDisposition: string | null): string {
  if (!contentDisposition) return "letter.pdf";
  
  // Try filename* (RFC 5987) first
  const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;\s]+)/i);
  if (filenameStarMatch?.[1]) {
    try {
      return decodeURIComponent(filenameStarMatch[1].trim());
    } catch {
      // Fallback to regular filename
    }
  }
  
  // Try quoted filename
  const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1].trim();
  }
  
  // Try unquoted filename
  const unquotedMatch = contentDisposition.match(/filename=([^;\s]+)/i);
  if (unquotedMatch?.[1]) {
    return unquotedMatch[1].trim();
  }
  
  return "letter.pdf";
}
