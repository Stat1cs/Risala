/**
 * Date utilities for formatting dates in Arabic official letter format
 * Includes Hijri (Islamic) calendar conversion
 */

/**
 * Convert Gregorian date to Hijri (Islamic) date
 * Uses Intl.DateTimeFormat with Umm al-Qura calendar for accurate conversion
 */
export function toHijriDate(date: Date): {
  day: number;
  month: string;
  year: number;
} {
  // Use Intl.DateTimeFormat with islamic-umalqura calendar for accurate conversion
  const formatter = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const parts = formatter.formatToParts(date);
  const day = parseInt(parts.find((p) => p.type === "day")?.value || "1", 10);
  const month = parseInt(parts.find((p) => p.type === "month")?.value || "1", 10);
  const year = parseInt(parts.find((p) => p.type === "year")?.value || "1", 10);

  const hijriMonths = [
    "محرم",
    "صفر",
    "ربيع الأول",
    "ربيع الثاني",
    "جمادى الأولى",
    "جمادى الثانية",
    "رجب",
    "شعبان",
    "رمضان",
    "شوال",
    "ذو القعدة",
    "ذو الحجة",
  ];

  return {
    day,
    month: hijriMonths[month - 1] || hijriMonths[0],
    year,
  };
}

/**
 * Convert Western numerals to Arabic-Indic numerals
 */
function toArabicIndic(num: number): string {
  const arabicIndic = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num.toString().replace(/\d/g, (digit) => arabicIndic[parseInt(digit, 10)]);
}

/**
 * Format date in Arabic official letter format
 * Returns: "التاريخ: [Hijri date] الموافق: [Gregorian date]"
 */
export function formatArabicDate(date: Date = new Date()): string {
  const hijri = toHijriDate(date);
  
  // Format Hijri date with Arabic-Indic numerals
  const hijriDay = toArabicIndic(hijri.day);
  const hijriYear = toArabicIndic(hijri.year);
  const hijriDateStr = `${hijriDay} ${hijri.month} ${hijriYear}هـ`;
  
  // Format Gregorian date in Arabic with Arabic-Indic numerals
  const gregorianDay = toArabicIndic(date.getDate());
  const gregorianYear = toArabicIndic(date.getFullYear());
  // Get month name in Arabic
  const gregorianMonthNames = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];
  const gregorianMonth = gregorianMonthNames[date.getMonth()];
  
  const gregorianDateStr = `${gregorianDay} ${gregorianMonth} ${gregorianYear}م`;
  
  return `التاريخ: ${hijriDateStr}\nالموافق: ${gregorianDateStr}`;
}

/**
 * Format date in English official letter format
 */
export function formatEnglishDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Arabic recipient title options
 */
export const ARABIC_RECIPIENT_TITLES = [
  "صاحب السمو السيد - الموقر",
  "معالي السيد - الموقر",
  "معالي الوزير - الموقر",
  "معالي الدكتور - الموقر",
  "سعادة الشيخ - المحترم",
  "فضيلة الشيخ القاضي - المحترم",
  "الفاضل - المحترم",
] as const;

export type ArabicRecipientTitle = (typeof ARABIC_RECIPIENT_TITLES)[number];
