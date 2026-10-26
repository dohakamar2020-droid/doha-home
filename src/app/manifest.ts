import type { MetadataRoute } from "next";

/**
 * Manifest تطبيق PWA:
 * التطبيق يتنزّل على الشاشة الرئيسية ويشتغل standalone (من غير شريط المتصفح)،
 * والأيقونات PNG فيها نسخة maskable لأندرويد.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "بيتي منظم — تنظيم يوم البيت",
    short_name: "بيتي منظم",
    description:
      "تطبيق عربي لتنظيم مهام البيت اليومية والأسبوعية وجدول التنظيف والعادات، وكل البيانات محفوظة على جهازك.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FAF7F2",
    theme_color: "#719B83",
    lang: "ar",
    dir: "rtl",
    categories: ["lifestyle", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "يومي",
        url: "/today",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "التنظيف",
        url: "/cleaning",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "أذكاري",
        url: "/adhkar",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
