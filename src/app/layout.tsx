import type { Metadata, Viewport } from "next";
import "@fontsource/cairo/400.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";
import "./globals.css";
import { AppProviders } from "@/context/AppProviders";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: {
    default: "بيتي منظم | تنظيم يوم البيت",
    template: "%s | بيتي منظم",
  },
  description:
    "بيتي منظم — تطبيق عربي لتنظيم مهام البيت اليومية والأسبوعية، جدول التنظيف، والعادات اليومية. بياناتك محفوظة على جهازك.",
  applicationName: "بيتي منظم",
  manifest: "/manifest.webmanifest",
  keywords: ["تنظيم البيت", "مهام يومية", "تنظيف", "عادات", "بلانر عربي"],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "بيتي منظم",
  },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:right-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-sage-600 focus:px-4 focus:py-2 focus:text-white"
        >
          تخطي إلى المحتوى
        </a>
        <AppProviders>{children}</AppProviders>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
