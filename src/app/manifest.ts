import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "بيتي منظم — تنظيم يوم البيت",
    short_name: "بيتي منظم",
    description:
      "تطبيق عربي لتنظيم مهام البيت اليومية والأسبوعية وجدول التنظيف والعادات، وكل البيانات محفوظة على جهازك.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF7F2",
    theme_color: "#719B83",
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
