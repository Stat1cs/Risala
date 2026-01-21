import { readFileSync } from "fs";
import { join } from "path";

// Helper function to get Bismillah SVG as base64
function getBismillahImageBase64(): string {
  try {
    // Path to the SVG in public folder (relative to project root)
    const imagePath = join(process.cwd(), "public", "Font", "bismillah.svg");
    // Read as binary buffer first, then encode to base64
    const imageBuffer = readFileSync(imagePath);
    // Encode the binary buffer directly to base64
    return imageBuffer.toString("base64");
  } catch (error) {
    console.warn("Could not load Bismillah SVG, falling back to text:", error);
    return "";
  }
}

export function renderLetterHTML(data: {
    date: string;
    recipient: string;
    organization: string;
    subject: string;
    content: string;
    language: "Arabic" | "English";
    signature?: string;
    closing?: string;
  }) {
    const isRTL = data.language === "Arabic";
    
    // Simple HTML escape function (server-side safe)
    const escapeHtml = (text: string): string => {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };
    
    // Get Bismillah image base64 for PDF
    const bismillahBase64 = getBismillahImageBase64();
  
    return `
  <!DOCTYPE html>
  <html lang="${isRTL ? "ar" : "en"}" dir="${isRTL ? "rtl" : "ltr"}">
  <head>
  <meta charset="utf-8" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Libre+Baskerville:wght@400;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${isRTL
        ? "'Amiri', 'Noto Naskh Arabic', serif"
        : "'Libre Baskerville', 'Georgia', serif"};
      margin: 0;
      font-size: 14pt;
      line-height: 1.8;
      color: #000000;
      background: #ffffff;
    }
    .bismillah {
      text-align: center;
      margin-bottom: 1rem;
      margin-top: -0.5rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .bismillah img {
      max-width: 100%;
      height: auto;
      max-height: 100px;
      object-fit: contain;
    }
    .date {
      margin-bottom: 1.5rem;
      font-size: 10pt;
      white-space: pre-line;
    }
    .recipient {
      margin-bottom: 1.5rem;
      font-size: 16pt;
      white-space: pre-line;
    }
    .greeting {
      text-align: ${isRTL ? "right" : "left"};
      margin-bottom: 1.5rem;
      font-size: 14pt;
    }
    .subject {
      font-weight: 700;
      margin-top: 3rem;
      margin-bottom: 1.5rem;
      margin-left: 5%;
      margin-right: 5%;
      font-size: 18px;
      text-align: ${isRTL ? "right" : "left"};
      width: 90%;
      line-height: 1.5;
    }
    .content {
      margin-bottom: 2rem;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
      text-align: ${isRTL ? "right" : "left"};
    }
    .closing {
      margin-top: 3rem;
      margin-left: 20%;
      margin-right: 20%;
      white-space: pre-line;
      font-size: 14pt;
      text-align: center;
    }
    .signature {
      margin-top: 2rem;
      white-space: pre-line;
      font-size: 14pt;
      text-align: ${isRTL ? "right" : "left"};
    }
    .signature-image {
      max-width: 200px;
      max-height: 100px;
      margin-top: 1rem;
    }
  </style>
  </head>
  <body>
  
  ${isRTL ? (bismillahBase64 
    ? `<div class="bismillah"><img src="data:image/svg+xml;charset=utf-8;base64,${bismillahBase64}" alt="بسم الله الرحمن الرحيم" /></div>`
    : `<div class="bismillah">بسم الله الرحمن الرحيم</div>`
  ) : ""}
  
  <div class="date">${escapeHtml(data.date || "")}</div>
  
  <div class="recipient">${escapeHtml(data.recipient || "")}${data.organization ? `<br/>${escapeHtml(data.organization)}` : ""}</div>
  
  ${isRTL ? `<div class="greeting">السلام عليـــكم ورحمة الله وبركاته... تحية طيبة وبعد،،،</div>` : ""}
  
  <div class="subject">
  ${isRTL ? "الموضـــوع:" : "Subject:"} ${escapeHtml(data.subject || "")}
  </div>
  
  <div class="content">${(data.content || "").replace(/\n/g, "<br/>")}</div>
  
  ${data.closing ? `<div class="closing">${escapeHtml(data.closing).replace(/\n/g, '<br/>')}</div>` : ""}
  
  ${data.signature ? `<div class="signature">${data.signature.includes('<img') || data.signature.includes('data:image') ? data.signature : escapeHtml(data.signature).replace(/\n/g, '<br/>')}</div>` : ""}
  
  </body>
  </html>
  `;
  }
  