import type { Metadata } from "next";
import { WeekView } from "@/components/views/WeekView";

export const metadata: Metadata = {
  title: "الأسبوع",
  description: "خطة الأسبوع كاملة بنسبة إنجاز كل يوم.",
};

export default function WeekPage() {
  return <WeekView />;
}
