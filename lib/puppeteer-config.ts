/**
 * Puppeteer configuration for different environments
 * Handles local development and serverless platforms
 */

import { existsSync } from "fs";
import type { LaunchOptions } from "puppeteer-core";

export type PuppeteerLaunchOptions = LaunchOptions;

// Try to import @sparticuz/chromium for serverless environments
let chromium: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  chromium = require("@sparticuz/chromium");
} catch {
  // @sparticuz/chromium not installed, will use system Chrome
}

/**
 * Get Chrome/Chromium executable path based on environment
 */
export function getChromeExecutablePath(): string | undefined {
  // Check for environment variable first (for custom setups)
  if (process.env.CHROME_EXECUTABLE_PATH) {
    return process.env.CHROME_EXECUTABLE_PATH;
  }

  // Vercel/Netlify - ALWAYS try to find system Chrome first
  // Vercel provides Chrome with all required libraries, so we MUST use it
  // Do NOT use @sparticuz/chromium on Vercel as it causes libnss3.so errors
  if (process.env.VERCEL || process.env.NETLIFY) {
    // Try common paths - Vercel typically has Chrome at these locations
    const possiblePaths = [
      "/usr/bin/google-chrome-stable",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/opt/google/chrome/chrome", // Alternative Vercel path
    ];
    
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        console.log(`[Puppeteer] Found Chrome at: ${path}`);
        return path;
      }
    }
    
    // On Vercel, if Chrome is not found, log error (should not happen)
    console.error("[Puppeteer] Chrome not found on Vercel/Netlify. This should not happen.");
    // Still return undefined to allow fallback, but this is unexpected
    return undefined;
  }

  // For AWS Lambda, use @sparticuz/chromium if available
  if (process.env.AWS_LAMBDA_FUNCTION_NAME && chromium) {
    // @sparticuz/chromium will provide the executable path
    // Return undefined here, the executable path will be set in getPuppeteerLaunchOptions
    return undefined;
  }

  // Local development - try common paths
  if (process.platform === "win32") {
    // Windows paths - check LOCALAPPDATA first (most common for user installs)
    const localAppData = process.env.LOCALAPPDATA;
    const possiblePaths: (string | null)[] = [
      localAppData ? `${localAppData}\\Google\\Chrome\\Application\\chrome.exe` : null,
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    ];
    
    for (const path of possiblePaths) {
      if (path && existsSync(path)) {
        console.log(`[Puppeteer] Found Chrome at: ${path}`);
        return path;
      }
    }
    const validPaths = possiblePaths.filter(p => p !== null).join(", ");
    console.warn(`[Puppeteer] Chrome not found in common paths: ${validPaths}`);
  } else if (process.platform === "darwin") {
    // macOS paths
    const macPath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    if (existsSync(macPath)) {
      return macPath;
    }
  } else {
    // Linux paths
    const possiblePaths = [
      "/usr/bin/google-chrome-stable",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
    ];
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return path;
      }
    }
  }

  return undefined;
}

/**
 * Get Puppeteer launch options for current environment
 */
export async function getPuppeteerLaunchOptions(): Promise<PuppeteerLaunchOptions> {
  const isVercel = process.env.VERCEL;
  const isNetlify = process.env.NETLIFY;
  const isLambda = process.env.AWS_LAMBDA_FUNCTION_NAME;
  const isServerless = isVercel || isNetlify || isLambda;
  
  // Get system Chrome path first
  const executablePath = getChromeExecutablePath();
  
  // NEVER use @sparticuz/chromium on Vercel/Netlify - it causes libnss3.so errors
  // Only use @sparticuz/chromium on AWS Lambda
  const shouldUseChromium = isLambda && chromium && !executablePath;
  
  if (shouldUseChromium) {
    // Disable graphics for serverless (setGraphicsMode is a property, not a function)
    if (typeof chromium.setGraphicsMode !== "undefined") {
      chromium.setGraphicsMode = false;
    }
    return {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    };
  }

  // On Vercel/Netlify, we MUST have an executablePath (system Chrome)
  if ((isVercel || isNetlify) && !executablePath) {
    throw new Error(
      "Chrome executable not found on Vercel/Netlify. " +
      "Vercel should provide Chrome at /usr/bin/google-chrome-stable. " +
      "If this error persists, contact Vercel support."
    );
  }

  // Use system Chrome (preferred for Vercel/Netlify)
  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--disable-gpu",
  ];

  // Platform-specific args
  if (process.platform === "win32") {
    // Windows-specific args
    args.push("--disable-web-security", "--disable-features=IsolateOrigins,site-per-process");
  } else {
    // Linux/macOS args
    args.push("--no-zygote");
  }

  // Additional args for serverless environments
  if (isServerless) {
    args.push("--single-process", "--disable-software-rasterizer");
  }

  return {
    executablePath,
    args,
    headless: true, // Use boolean for compatibility with Puppeteer types
  };
}
