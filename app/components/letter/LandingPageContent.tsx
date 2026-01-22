/**
 * Landing page content component
 */

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatArabicDate } from "@/lib/date-utils";
import type { UiLanguage } from "@/lib/types/letter";

interface LandingPageContentProps {
  uiLanguage: UiLanguage;
}

const LANDING_CONTENT = {
  ar: {
    recipient: "إلى السادة / مستخدمي منصة رسالة",
    subject: "توضيح بشأن منصة رسالة لصياغة الخطابات الرسمية",
    greeting: "تحية طيبة وبعد،",
    paragraphs: [
      "تشير هذه الرسالة إلى منصة رسالة، وهي أداة رقمية متخصصة في إعداد الخطابات الرسمية الموجهة إلى الجهات الحكومية، والمؤسسات الخاصة، والجهات العامة، وفق أسلوب مؤسسي معتمد ومتوافق مع الأعراف المتبعة في المنطقة.",
      "تم تصميم رسالة لتسهيل صياغة الخطابات التي تتطلب دقة لغوية، ونبرة رسمية مناسبة، وبنية واضحة قابلة للتقديم والطباعة دون الحاجة إلى تعديلات إضافية.",
      "تعتمد المنصة على إدخال الغرض من الخطاب والجهة الموجه إليها، مع إتاحة المجال للمستخدم لإدخال التفاصيل اللازمة، حيث تقوم رسالة بصياغة خطاب متكامل بصيغة رسمية جاهزة للاستخدام.",
      "نود الإحاطة بأن عملية الصياغة تتم بشكل فوري ضمن الجلسة الحالية، دون حفظ أو تخزين أي محتوى، وذلك حفاظًا على الخصوصية.",
    ],
    closing: "وتفضلوا بقبول فائق الاحترام والتقدير،",
    signature: "منصة رسالة\nنظام مخصص لصياغة الخطابات الرسمية",
    pricing: "السعر: 2 ريال عماني لكل رسالة",
  },
  en: {
    recipient: "To:\nUsers of the Risala Platform",
    subject: "Clarification Regarding the Risala Official Letter Drafting Platform",
    greeting: "Dear Sir or Madam,",
    paragraphs: [
      "This letter serves to introduce Risala, a digital platform specialized in the drafting of official correspondence addressed to government authorities, private institutions, and public entities, in accordance with established institutional standards and regional conventions.",
      "Risala has been designed to facilitate the preparation of formal letters that require linguistic accuracy, an appropriate professional tone, and a clear, structured format suitable for submission or printing without further modification.",
      "The platform operates by receiving the purpose of the correspondence and the intended recipient authority, in addition to any relevant details provided by the user. Based on this information, Risala generates a complete, institution-ready letter in a formal format appropriate to the context.",
      "Kindly note that all drafting is performed within the current session only, and no content is stored or retained, in order to maintain confidentiality and privacy.",
    ],
    closing: "Yours sincerely,",
    signature: "Risala\nA system dedicated to drafting official correspondence",
    pricing: "Price: 2 OMR per letter",
  },
};

export function LandingPageContent({ uiLanguage }: LandingPageContentProps) {
  const isRTL = uiLanguage === "ar";
  const [date, setDate] = useState<string>("");
  const content = LANDING_CONTENT[uiLanguage];

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      if (isRTL) {
        setDate(formatArabicDate(new Date()));
      } else {
        setDate(
          new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        );
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [isRTL]);

  return (
    <div
      className="p-8"
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        fontFamily: isRTL
          ? "var(--font-arabic), 'Noto Naskh Arabic', serif"
          : "var(--font-english), 'Georgia', 'Times New Roman', serif",
      }}
    >
      {/* Bismillah */}
      {isRTL && (
        <div
          style={{
            textAlign: "center",
            marginBottom: "1rem",
            marginTop: "-0.5rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            src="/Font/bismillah.svg"
            alt="بسم الله الرحمن الرحيم"
            className="bismillah-image"
            width={200}
            height={100}
            style={{
              maxWidth: "100%",
              height: "auto",
              maxHeight: "100px",
              objectFit: "contain",
            }}
            priority
          />
        </div>
      )}

      {/* Date */}
      <div
        className="letter-date text-gray-900 dark:text-white"
        style={{
          textAlign: isRTL ? "right" : "left",
          fontSize: "10pt",
          fontWeight: 400,
          marginBottom: "1.5rem",
          whiteSpace: isRTL ? "pre-line" : "normal",
        }}
      >
        {isRTL ? "" : "Date: "}
        {date}
      </div>

      {/* Recipient */}
      <div
        className="text-gray-900 dark:text-white"
        style={{
          marginBottom: "1.5rem",
          fontSize: "16pt",
          fontWeight: 400,
          textAlign: isRTL ? "right" : "left",
          whiteSpace: "pre-line",
        }}
      >
        {content.recipient}
      </div>

      {/* Greeting */}
      {isRTL && (
        <div
          className="text-gray-900 dark:text-white"
          style={{
            textAlign: "right",
            marginBottom: "1.5rem",
            fontSize: "14pt",
            fontWeight: 400,
          }}
        >
          السلام عليـــكم ورحمة الله وبركاته... تحية طيبة وبعد،،،
        </div>
      )}

      {/* Subject */}
      <div
        className="letter-subject-container text-gray-900 dark:text-white"
        style={{
          marginTop: "3rem",
          marginBottom: "1.5rem",
          marginLeft: "5%",
          marginRight: "5%",
          textAlign: isRTL ? "right" : "left",
          direction: isRTL ? "rtl" : "ltr",
          width: "90%",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          gap: "0.5rem",
        }}
      >
        <span style={{ fontSize: "18px", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
          {isRTL ? "الموضـــوع:" : "Subject:"}
        </span>
        <span
          style={{
            fontSize: "18px",
            fontWeight: 700,
            wordWrap: "break-word",
            overflowWrap: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {content.subject}
        </span>
      </div>

      {/* Content */}
      <div
        className="letter-content text-gray-900 dark:text-white"
        style={{
          fontSize: "14pt",
          lineHeight: "1.8",
          fontWeight: 400,
          textAlign: isRTL ? "right" : "left",
        }}
      >
        {content.paragraphs.map((paragraph, index) => (
          <p key={index} style={{ marginBottom: "1.5rem", textAlign: isRTL ? "right" : "left" }}>
            {paragraph}
          </p>
        ))}

        {/* Closing */}
        <p style={{ marginTop: "2rem", marginBottom: "1rem" }}>{content.closing}</p>

        {/* Signature */}
        <div
          style={{
            marginTop: "3rem",
            whiteSpace: "pre-line",
            fontSize: "14pt",
            fontWeight: 400,
          }}
        >
          {content.signature}
        </div>

        {/* Pricing */}
        <div
          className="landing-pricing-divider"
          style={{
            marginTop: "3rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ fontSize: "14pt", fontWeight: 600 }}>{content.pricing}</p>
        </div>
      </div>
    </div>
  );
}
