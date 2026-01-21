import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import { renderLetterHTML } from "@/lib/pdf-template";
import { getPuppeteerLaunchOptions } from "@/lib/puppeteer-config";

export async function POST(req: NextRequest) {
  const data = await req.json();

  let browser;
  try {
    const launchOptions = getPuppeteerLaunchOptions();
    
    // If no executable path found, throw helpful error
    if (!launchOptions.executablePath && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      const errorMsg = 
        "Chrome/Chromium executable not found.\n\n" +
        "Please install Google Chrome or set CHROME_EXECUTABLE_PATH environment variable.\n" +
        "For local development, install Chrome from https://www.google.com/chrome/\n\n" +
        "If Chrome is installed in a custom location, create a .env.local file with:\n" +
        "CHROME_EXECUTABLE_PATH=C:\\Path\\To\\Chrome\\chrome.exe";
      throw new Error(errorMsg);
    }

    console.log(`[PDF API] Launching Chrome with executable: ${launchOptions.executablePath || "system"}`);
    browser = await puppeteer.launch(launchOptions);
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
    
    return new NextResponse(pdf, {
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
