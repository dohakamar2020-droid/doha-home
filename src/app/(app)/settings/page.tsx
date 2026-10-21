import type { Metadata } from "next";
import { SettingsView } from "@/components/views/SettingsView";

export const metadata: Metadata = {
  title: "الإعدادات",
  description: "بياناتك الشخصية، النسخ الاحتياطي، واستيراد وتصدير البيانات.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
