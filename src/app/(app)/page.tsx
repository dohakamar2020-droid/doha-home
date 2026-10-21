import type { Metadata } from "next";
import { DashboardView } from "@/components/views/DashboardView";

export const metadata: Metadata = {
  title: "الرئيسية",
  description: "نظرة سريعة على مهام النهاردة وتقدّمك وعاداتك.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
