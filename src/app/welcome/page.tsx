import type { Metadata } from "next";
import { WelcomeWizard } from "@/components/WelcomeWizard";

export const metadata: Metadata = {
  title: "أهلًا بيكي — إعداد أول مرة",
  description: "ظبّطي اسمك ومواعيد يومك واختاري قالب البداية المناسب.",
};

export default function WelcomePage() {
  return <WelcomeWizard />;
}
