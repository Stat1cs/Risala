import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import { renderLetterHTML } from "@/lib/pdf-template";
import { getPuppeteerLaunchOptions } from "@/lib/puppeteer-config";

export async function POST(req: NextRequest) {
  const data = await req.json();

  let browser;
  try {
    const launchOptions = await getPuppeteerLaunchOptions();
    
    // Check if executable path is available
    const isServerless = process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    if (!launchOptions.executablePath && !isServerless) {
      const errorMsg = 
        "Chrome/Chromium executable not found.\n\n" +
        "Please install Google Chrome or set CHROME_EXECUTABLE_PATH environment variable.\n" +
        "For local development, install Chrome from https://www.google.com/chrome/\n\n" +
        "If Chrome is installed in a custom location, create a .env.local file with:\n" +
        "CHROME_EXECUTABLE_PATH=C:\\Path\\To\\Chrome\\chrome.exe\n\n" +
        "For Vercel/Netlify deployment, install @sparticuz/chromium:\n" +
        "npm install @sparticuz/chromium";
      throw new Error(errorMsg);
    }

    if (!launchOptions.executablePath && isServerless) {
      // On Vercel, try to provide more helpful error message
      if (process.env.VERCEL) {
        throw new Error(
          "Chrome executable not found on Vercel.\n\n" +
          "Vercel should provide Chrome at /usr/bin/google-chrome-stable.\n" +
          "If this error persists, Chrome may not be available in your Vercel runtime.\n" +
          "The code will attempt to use @sparticuz/chromium as a fallback if installed.\n" +
          "If the issue continues, contact Vercel support."
        );
      }
      throw new Error(
        "Chrome executable not found in serverless environment.\n\n" +
        "Please install @sparticuz/chromium: npm install @sparticuz/chromium"
      );
    }

    console.log(`[PDF API] Launching Chrome with executable: ${launchOptions.executablePath || "system"}`);
    
    // Try to launch browser, catch specific errors about executable not found
    try {
      browser = await puppeteer.launch(launchOptions);
    } catch (launchError) {
      // If launch fails with executable not found error on Vercel, try @sparticuz/chromium as fallback
      if (process.env.VERCEL && launchError instanceof Error && 
          (launchError.message.includes("executable") || launchError.message.includes("not found") || 
           launchError.message.includes("No such file"))) {
        console.warn(`[PDF API] System Chrome not found, attempting to use @sparticuz/chromium as fallback`);
        
        // Try to use @sparticuz/chromium as fallback
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const chromium = require("@sparticuz/chromium");
          if (typeof chromium.setGraphicsMode !== "undefined") {
            chromium.setGraphicsMode = false;
          }
          
          const chromiumOptions = {
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
          };
          
          console.log(`[PDF API] Using @sparticuz/chromium fallback`);
          browser = await puppeteer.launch(chromiumOptions);
        } catch (chromiumError) {
          // If @sparticuz/chromium also fails, throw the original error with context
          throw new Error(
            `Chrome executable not found on Vercel.\n\n` +
            `Tried system Chrome at: ${launchOptions.executablePath}\n` +
            `Tried @sparticuz/chromium fallback (also failed)\n\n` +
            `This may indicate that Vercel's Chrome installation has changed.\n` +
            `Please check Vercel documentation or contact Vercel support.\n\n` +
            `Original error: ${launchError.message}\n` +
            `Chromium fallback error: ${chromiumError instanceof Error ? chromiumError.message : String(chromiumError)}`
          );
        }
      } else {
        throw launchError;
      }
    }
    const page = await browser.newPage();

    const html = renderLetterHTML(data);
    await page.setContent(html, { waitUntil: "networkidle0" });
    
    // Wait for fonts to load (important for proper rendering)
    try {
      await page.evaluateHandle(() => document.fonts.ready);
      // Additional wait to ensure fonts are fully loaded and rendered
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      // If font loading fails, continue anyway (fonts may already be loaded)
      console.warn("[PDF API] Font loading check failed, continuing:", error);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Generate filename from subject or use default
    const subject = (data.subject || "").trim();
    let sanitizedSubject = subject
      .replace(/[^a-z0-9\u0600-\u06FF\s]/gi, "_") // Replace special chars with underscore
      .replace(/\s+/g, "_") // Replace spaces with underscore
      .replace(/_+/g, "_") // Replace multiple underscores with single
      .replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
      .substring(0, 50)
      .trim();
    
    // If sanitized subject is empty or too short, use "letter"
    if (!sanitizedSubject || sanitizedSubject.length < 2) {
      sanitizedSubject = "letter";
    }
    
    // Ensure no trailing underscores
    sanitizedSubject = sanitizedSubject.replace(/_+$/, "");
    
    const dateStr = new Date().toISOString().split("T")[0];
    // Use ASCII-only filename for Content-Disposition header to avoid encoding issues
    const asciiFilename = sanitizedSubject
      .replace(/[^\x00-\x7F]/g, "") // Remove non-ASCII characters
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/, "") || "letter";
    const filename = `${asciiFilename}_${dateStr}.pdf`;

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: "10mm",
        right: "15mm",
        bottom: "20mm",
        left: "20mm",
      },
    });

    await browser.close();

    // Properly encode filename for Content-Disposition header
    // Use ASCII-only filename to avoid ByteString conversion errors
    const encodedFilename = encodeURIComponent(filename);
    
    // page.pdf() returns a Buffer, convert to ArrayBuffer for Blob
    // Create a new ArrayBuffer and copy data to ensure proper type compatibility
    const arrayBuffer = new ArrayBuffer(pdf.length);
    const view = new Uint8Array(arrayBuffer);
    view.set(new Uint8Array(pdf));
    const pdfBlob = new Blob([arrayBuffer], { type: "application/pdf" });
    
    return new NextResponse(pdfBlob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    // Ensure browser is closed even on error
    if (browser) {
      await browser.close().catch(() => {});
    }
    
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate PDF",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
