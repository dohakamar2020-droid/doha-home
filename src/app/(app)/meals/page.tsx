import type { Metadata } from "next";
import { MealsView } from "@/components/views/MealsView";

export const metadata: Metadata = {
  title: "غدا الأسبوع",
  description: "اقتراحات غدا لكل يوم مع بدائل جاهزة وقابلة للتعديل.",
};

export default function MealsPage() {
  return <MealsView />;
}
