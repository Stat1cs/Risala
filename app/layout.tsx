import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans, Amiri, Libre_Baskerville, Cairo } from "next/font/google";
import "./globals.css";

const alMarai = Cairo({
  weight: ["300", "400", "700", "800"],
  subsets: ["arabic", "latin"],
  variable: "--font-al-marai",
});

const dmSans = DM_Sans({subsets:['latin'],variable:'--font-sans'});

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-arabic',
});

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-english',
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Risala - Official Letter Generator",
  description: "AI-powered platform for generating official Middle Eastern-style letters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${alMarai.variable} ${dmSans.variable} ${amiri.variable} ${libreBaskerville.variable}`}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
