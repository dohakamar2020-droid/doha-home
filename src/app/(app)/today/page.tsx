import type { Metadata } from "next";
import { TodayView } from "@/components/views/TodayView";

export const metadata: Metadata = {
  title: "يومي",
  description: "جدول مهام اليوم كامل، مع إضافة وتعديل وإكمال وإعادة جدولة.",
};

export default function TodayPage() {
  return <TodayView />;
}
