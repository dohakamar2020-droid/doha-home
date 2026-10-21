import {
  CalendarCheck,
  CalendarRange,
  HeartPulse,
  LayoutDashboard,
  SprayCan,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SectionId } from "@/types/domain";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  section: SectionId | "settings";
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "الرئيسية", icon: LayoutDashboard, section: "dashboard" },
  { href: "/today", label: "يومي", icon: CalendarCheck, section: "today" },
  { href: "/week", label: "الأسبوع", icon: CalendarRange, section: "week" },
  { href: "/cleaning", label: "التنظيف", icon: SprayCan, section: "cleaning" },
  { href: "/habits", label: "عاداتي", icon: HeartPulse, section: "habits" },
  { href: "/settings", label: "الإعدادات", icon: Settings, section: "settings" },
] as const;

export function isNavItemVisible(
  item: NavItem,
  visibleSections: readonly SectionId[],
): boolean {
  if (item.section === "settings" || item.section === "dashboard") return true;
  return visibleSections.includes(item.section);
}
