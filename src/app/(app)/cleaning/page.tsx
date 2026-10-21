import type { Metadata } from "next";
import { CleaningView } from "@/components/views/CleaningView";

export const metadata: Metadata = {
  title: "تنظيف البيت",
  description: "مهام تنظيف الغرف بمواعيد يومية وأسبوعية وشهرية.",
};

export default function CleaningPage() {
  return <CleaningView />;
}
