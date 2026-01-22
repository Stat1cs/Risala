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

  // Vercel/Netlify - ALWAYS use system Chrome
  // Vercel provides Chrome with all required libraries, so we MUST use it
  // Do NOT use @sparticuz/chromium on Vercel as it causes libnss3.so errors
  // Note: existsSync may not work reliably in serverless, so we return the default path
  if (process.env.VERCEL || process.env.NETLIFY) {
    // Vercel provides Chrome at /usr/bin/google-chrome-stable
    // We return this path directly without checking existsSync since it may not work in serverless
    const defaultPath = "/usr/bin/google-chrome-stable";
    console.log(`[Puppeteer] Using Chrome path for Vercel/Netlify: ${defaultPath}`);
    return defaultPath;
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
  let executablePath = getChromeExecutablePath();
  
  // On Vercel, try to verify Chrome exists, or try alternative paths
  if (isVercel) {
    // Try multiple possible Chrome paths on Vercel
    const possibleVercelPaths = [
      "/usr/bin/google-chrome-stable",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      // Sometimes Chrome is in a different location
      "/opt/google/chrome/chrome",
      "/usr/local/bin/google-chrome-stable",
    ];
    
    // If we have a path from getChromeExecutablePath, verify it exists
    // Otherwise, try the possible paths
    if (!executablePath) {
      // Try to find Chrome in common Vercel locations
      for (const path of possibleVercelPaths) {
        try {
          // In serverless, we can't reliably use existsSync, so we'll try launching
          // But first, let's try the most common path
          executablePath = path;
          console.log(`[Puppeteer] Attempting to use Chrome path: ${path}`);
          break; // Use the first path (most common)
        } catch {
          continue;
        }
      }
    }
    
    // If still no path, use the default
    if (!executablePath) {
      executablePath = "/usr/bin/google-chrome-stable";
      console.log(`[Puppeteer] Using default Vercel Chrome path: ${executablePath}`);
    }
  }
  
  // For AWS Lambda or Vercel (if system Chrome not available), use @sparticuz/chromium if available
  // Note: On Vercel, prefer system Chrome, but fallback to @sparticuz/chromium if needed
  const shouldUseChromium = (isLambda || (isVercel && !executablePath)) && chromium;
  
  if (shouldUseChromium) {
    // Disable graphics for serverless (setGraphicsMode is a property, not a function)
    if (typeof chromium.setGraphicsMode !== "undefined") {
      chromium.setGraphicsMode = false;
    }
    console.log(`[Puppeteer] Using @sparticuz/chromium as fallback for ${isVercel ? 'Vercel' : 'Lambda'}`);
    return {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    };
  }

  // On Netlify, ensure we have an executablePath
  if (isNetlify && !executablePath) {
    executablePath = "/usr/bin/google-chrome-stable";
  }
  
  const finalExecutablePath = executablePath;

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
    executablePath: finalExecutablePath,
    args,
    headless: true, // Use boolean for compatibility with Puppeteer types
  };
}
