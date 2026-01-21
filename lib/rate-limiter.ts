/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a more robust solution
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limiter configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  letterGeneration: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 10 requests per minute
  },
  fileUpload: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 requests per minute
  },
  audioTranscription: {
    maxRequests: 15,
    windowMs: 60 * 1000, // 15 requests per minute
  },
} as const;

/**
 * Get client identifier from request
 * In production, use IP address, user ID, or API key
 */
function getClientId(request: Request): string {
  // For now, use a simple identifier
  // In production, extract from headers (X-Forwarded-For, Authorization, etc.)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  return ip;
}

/**
 * Check if request should be rate limited
 * @returns null if allowed, or error message if rate limited
 */
export function checkRateLimit(
  clientId: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } | null {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    // 1% chance to clean up on each request
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return null;
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(clientId, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit middleware for API routes
 */
export function withRateLimit(
  config: RateLimitConfig,
  getClientIdFn: (request: Request) => string = getClientId
) {
  return (request: Request): { allowed: boolean; error?: string; remaining?: number; resetTime?: number } => {
    const clientId = getClientIdFn(request);
    const result = checkRateLimit(clientId, config);

    if (!result) {
      return {
        allowed: false,
        error: `Rate limit exceeded. Maximum ${config.maxRequests} requests per ${config.windowMs / 1000} seconds.`,
      };
    }

    return {
      allowed: true,
      remaining: result.remaining,
      resetTime: result.resetTime,
    };
  };
}
