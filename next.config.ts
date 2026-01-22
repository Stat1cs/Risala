import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Externalize puppeteer and chromium packages to avoid bundling issues
  serverExternalPackages: [
    "puppeteer-core",
    "@sparticuz/chromium",
  ],
};

export default nextConfig;
