# Vercel Environment Setup for PDF Generation

## Required Environment Variables

To use Puppeteer with `@sparticuz/chromium` on Vercel, you need to set the following environment variable:

### AWS_LAMBDA_JS_RUNTIME

Set this in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add a new variable:
   - **Name:** `AWS_LAMBDA_JS_RUNTIME`
   - **Value:** `nodejs22.x`
   - **Environment:** Production, Preview, Development (all)

This helps `@sparticuz/chromium` work correctly with Vercel's Node.js 22.x runtime.

## Function Configuration

Ensure your PDF generation function has sufficient resources:

- **Memory:** At least 512 MB (recommended: 1024 MB)
- **Max Duration:** At least 30 seconds (recommended: 60 seconds for complex PDFs)

You can configure this in `vercel.json` or in the Vercel dashboard under Function Settings.

## Troubleshooting

If you still encounter `libnss3.so` errors:

1. **Update packages:**
   ```bash
   npm install @sparticuz/chromium@latest puppeteer-core@latest
   ```

2. **Check Next.js config:**
   Ensure `serverExternalPackages` includes `@sparticuz/chromium` and `puppeteer-core`

3. **Check function logs:**
   Look for detailed error messages in Vercel's function logs

4. **Consider alternatives:**
   If Puppeteer continues to fail, consider using a PDF service API like:
   - PDFShift
   - Browserless.io
   - Playwright-as-a-Service
