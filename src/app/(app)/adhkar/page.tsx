import type { Metadata } from "next";
import { AdhkarView } from "@/components/views/AdhkarView";

export const metadata: Metadata = {
  title: "أذكاري",
  description: "أذكار الصباح والمساء بعدّاد لكل ذكر، محفوظة لكل يوم.",
};

export default function AdhkarPage() {
  return <AdhkarView />;
}
