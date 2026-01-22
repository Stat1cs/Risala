# Puppeteer Setup Guide

This project uses `puppeteer-core` for serverless-friendly PDF generation. This guide explains how to set it up for different environments.

## Local Development

### Windows

1. **Install Google Chrome** (if not already installed)
   - Download from: https://www.google.com/chrome/
   - The setup will automatically detect Chrome in common installation paths

2. **Manual Chrome Path** (if Chrome is in a custom location)
   - Create a `.env.local` file in the project root
   - Add: `CHROME_EXECUTABLE_PATH=C:\Path\To\Chrome\chrome.exe`

### macOS

1. **Install Google Chrome** (if not already installed)
   - Download from: https://www.google.com/chrome/
   - Chrome is typically at: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

2. **Manual Chrome Path** (if needed)
   - Create a `.env.local` file
   - Add: `CHROME_EXECUTABLE_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

### Linux

1. **Install Chrome or Chromium**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install -y google-chrome-stable
   
   # Or Chromium
   sudo apt-get install -y chromium-browser
   ```

2. **Manual Chrome Path** (if needed)
   - Create a `.env.local` file
   - Add: `CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome-stable`

## Serverless Deployment

### Vercel

Vercel should provide Chrome automatically in their runtime. The code will:

1. **First try system Chrome** at `/usr/bin/google-chrome-stable`
2. **Fallback to @sparticuz/chromium** if system Chrome is not found

**Note:** Make sure your deployment package stays under size limits:
- Hobby: 50 MB (puppeteer-core is ~8 MB ✅)
- Pro: 250 MB ✅

**If you encounter "Chrome executable not found" errors:**
- The code will automatically try `@sparticuz/chromium` as a fallback (already installed)
- If both fail, check Vercel's documentation for the current Chrome path
- You may need to contact Vercel support if Chrome is no longer provided

### AWS Lambda

For AWS Lambda, you'll need to use `@sparticuz/chromium`:

1. **Install the package:**
   ```bash
   npm install @sparticuz/chromium
   ```

2. **Update `lib/puppeteer-config.ts`** to use it:
   ```typescript
   import chromium from '@sparticuz/chromium';
   
   // In getPuppeteerLaunchOptions():
   if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
     return {
       args: chromium.args,
       defaultViewport: chromium.defaultViewport,
       executablePath: await chromium.executablePath(),
       headless: chromium.headless,
     };
   }
   ```

3. **Update `app/api/pdf/route.ts`** to handle async executable path:
   ```typescript
   const launchOptions = await getPuppeteerLaunchOptions();
   ```

### Netlify Functions

Netlify provides Chrome automatically. The code will detect Netlify and use the correct path.

### Docker / Self-Hosted

1. **Install Chrome in your Dockerfile:**
   ```dockerfile
   RUN apt-get update && \
       apt-get install -y \
       wget \
       gnupg && \
       wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
       echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list && \
       apt-get update && \
       apt-get install -y google-chrome-stable && \
       rm -rf /var/lib/apt/lists/*
   ```

2. **Or use a Chrome base image:**
   ```dockerfile
   FROM ghcr.io/puppeteer/puppeteer:latest
   ```

## Testing Locally

1. Make sure Chrome is installed
2. Run the dev server: `npm run dev`
3. Test PDF generation through your app
4. If you get an error about Chrome not found, check the error message for the expected path

## Troubleshooting

### "Chrome executable not found"

- **Windows:** Check if Chrome is installed and try setting `CHROME_EXECUTABLE_PATH` in `.env.local`
- **macOS/Linux:** Install Chrome or Chromium using package manager
- **Serverless:** Should work automatically on Vercel/Netlify

### PDF generation fails

- Check browser console logs
- Ensure Chrome has necessary permissions
- For serverless, check function logs in your platform's dashboard

### Size limits on serverless

- `puppeteer-core` is only ~8 MB (vs ~300 MB for Playwright)
- Should fit within all major platform limits
- If you still hit limits, consider using a PDF service API instead

## Alternative: PDF Service API

If you want to avoid browser binaries entirely, consider using a PDF service:

- **PDFShift** - $0.01 per PDF
- **Browserless.io** - Managed Chrome service
- **Puppeteer-as-a-Service** - Self-hosted option

This eliminates all browser binary concerns but adds an external dependency.
