import type { Metadata } from "next";
import { HabitsView } from "@/components/views/HabitsView";

export const metadata: Metadata = {
  title: "عاداتي",
  description: "تابعي عاداتك اليومية وسلسلة الالتزام أسبوع بأسبوع.",
};

export default function HabitsPage() {
  return <HabitsView />;
}
