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

  // Vercel/Netlify - Use @sparticuz/chromium (Vercel doesn't provide system Chrome)
  // Note: Vercel serverless functions don't include Chrome by default
  // We'll use @sparticuz/chromium which is configured in getPuppeteerLaunchOptions
  if (process.env.VERCEL || process.env.NETLIFY) {
    // Return undefined to trigger @sparticuz/chromium usage
    // This will be handled in getPuppeteerLaunchOptions
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
  let executablePath = getChromeExecutablePath();
  
  // For Vercel/Netlify and AWS Lambda, use @sparticuz/chromium
  // Vercel doesn't provide system Chrome in serverless functions
  const shouldUseChromium = (isVercel || isNetlify || isLambda) && chromium;
  
  if (shouldUseChromium) {
    // Configure chromium for serverless environments
    // For newer versions of @sparticuz/chromium, configure it properly
    try {
      // Disable graphics for serverless (setGraphicsMode is a property, not a function)
      if (typeof chromium.setGraphicsMode !== "undefined") {
        chromium.setGraphicsMode = false;
      }
      
      // For Vercel, configure chromium to avoid library issues
      if (isVercel) {
        // Try to set fonts to false if the property exists (newer versions)
        if (typeof chromium.setFonts !== "undefined") {
          chromium.setFonts = false;
        }
        // Some versions use setFontPath
        if (typeof chromium.setFontPath !== "undefined") {
          chromium.setFontPath = undefined;
        }
      }
      
      console.log(`[Puppeteer] Using @sparticuz/chromium for ${isVercel ? 'Vercel' : isNetlify ? 'Netlify' : 'Lambda'}`);
      
      // Get chromium executable path - this may download/unpack chromium if needed
      // For newer versions, this handles the binary extraction automatically
      const chromiumPath = await chromium.executablePath();
      console.log(`[Puppeteer] Chromium executable path: ${chromiumPath}`);
      
      // Use chromium args with additional serverless-friendly flags
      // Start with chromium's default args and add our own
      const chromiumArgs = [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--disable-gpu",
        "--single-process",
        "--disable-software-rasterizer",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-breakpad",
        "--disable-client-side-phishing-detection",
        "--disable-default-apps",
        "--disable-features=TranslateUI",
        "--disable-hang-monitor",
        "--disable-ipc-flooding-protection",
        "--disable-popup-blocking",
        "--disable-prompt-on-repost",
        "--disable-renderer-backgrounding",
        "--disable-sync",
        "--disable-translate",
        "--metrics-recording-only",
        "--safebrowsing-disable-auto-update",
        "--enable-automation",
        "--password-store=basic",
        "--use-mock-keychain",
      ];
      
      return {
        args: chromiumArgs,
        defaultViewport: chromium.defaultViewport || { width: 1920, height: 1080 },
        executablePath: chromiumPath,
        headless: chromium.headless !== false, // Default to true
      };
    } catch (chromiumError) {
      console.error(`[Puppeteer] Failed to configure @sparticuz/chromium:`, chromiumError);
      throw new Error(
        `Failed to initialize @sparticuz/chromium: ${chromiumError instanceof Error ? chromiumError.message : String(chromiumError)}\n\n` +
        `This may indicate that @sparticuz/chromium needs to be updated or Vercel's runtime doesn't support it.\n` +
        `Try updating @sparticuz/chromium: npm install @sparticuz/chromium@latest\n\n` +
        `If the issue persists, consider using a PDF service API instead of Puppeteer.`
      );
    }
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
