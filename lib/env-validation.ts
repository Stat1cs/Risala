/**
 * Environment variable validation
 * Validates required environment variables at startup
 */

interface EnvConfig {
  OPENAI_API_KEY?: string;
  NEXT_PUBLIC_APP_URL?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
}

/**
 * Validate environment variables
 * Throws an error if required variables are missing
 */
export function validateEnv(required: string[] = ["OPENAI_API_KEY"]): void {
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        `Please add them to your .env.local file.`
    );
  }
}

/**
 * Get validated environment variables
 */
export function getEnv(): EnvConfig {
  return {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  };
}

/**
 * Validate OpenAI API key format
 */
export function validateOpenAIKey(key: string): boolean {
  return key.startsWith("sk-") && key.length > 20;
}
