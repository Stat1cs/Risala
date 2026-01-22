import crypto from "crypto";

/**
 * Simple in-memory request cache
 * For production, consider using Redis or a more robust caching solution
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// In-memory cache store
const cacheStore = new Map<string, CacheEntry<unknown>>();

/**
 * Generate cache key from request data
 */
export function generateCacheKey(data: unknown): string {
  const serialized = JSON.stringify(data, Object.keys(data as object).sort());
  return crypto.createHash("sha256").update(serialized).digest("hex");
}

/**
 * Get cached response if available and not expired
 */
export function getCachedResponse<T>(key: string): T | null {
  const entry = cacheStore.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt < Date.now()) {
    // Expired, remove from cache
    cacheStore.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Store response in cache
 */
export function setCachedResponse<T>(
  key: string,
  data: T,
  ttlMs: number = 5 * 60 * 1000 // Default 5 minutes
): void {
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of cacheStore.entries()) {
    if (entry.expiresAt < now) {
      cacheStore.delete(key);
    }
  }
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  cacheStore.clear();
}

/**
 * Cache configuration for different endpoints
 */
export const CACHE_CONFIG = {
  letterGeneration: {
    enabled: true,
    ttlMs: 5 * 60 * 1000, // 5 minutes
  },
  fileUpload: {
    enabled: false, // Don't cache file uploads
    ttlMs: 0,
  },
  audioTranscription: {
    enabled: true,
    ttlMs: 10 * 60 * 1000, // 10 minutes (transcriptions are expensive)
  },
} as const;

/**
 * Request deduplication
 * Prevents multiple identical requests from executing concurrently
 */
const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Execute request with deduplication
 * If an identical request is already in progress, return the same promise
 */
export async function withDeduplication<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // Check if request is already pending
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  // Create new request
  const promise = requestFn().finally(() => {
    // Remove from pending requests when done
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}
