"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, Heart } from "lucide-react";
import { NAV_ITEMS, isNavItemVisible } from "@/components/navigation";
import type { SectionId } from "@/types/domain";
import { APP_VERSION } from "@/lib/defaults";

export function DesktopSidebar({
  displayName,
  visibleSections,
}: {
  displayName: string;
  visibleSections: readonly SectionId[];
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => isNavItemVisible(item, visibleSections));

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-l border-sage-100 bg-white/70 px-4 py-6 lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-3 px-2" aria-label="بيتي منظم">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-500 text-lg font-bold text-white shadow-soft">
          بـ
        </span>
        <span>
          <span className="block text-base font-bold leading-tight text-ink">بيتي منظم</span>
          <span className="block text-xs text-ink-soft">
            {displayName ? `أهلًا، ${displayName}` : "تنظيم يوم البيت"}
          </span>
        </span>
      </Link>

      <nav aria-label="التنقل الرئيسي" className="flex-1">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-sage-500 text-white shadow-soft"
                      : "text-ink-soft hover:bg-sage-50 hover:text-sage-800"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-6 space-y-2 rounded-2xl bg-sage-50 p-3 text-[11px] leading-5 text-sage-800">
        <p className="flex items-center gap-1.5 font-semibold">
          <Database className="h-3.5 w-3.5" aria-hidden="true" />
          بياناتك على جهازك
        </p>
        <p>مفيش مزامنة بين الأجهزة. اعملي نسخة احتياطية من الإعدادات.</p>
        <p className="flex items-center gap-1 text-sage-700">
          <Heart className="h-3 w-3" aria-hidden="true" />
          الإصدار {APP_VERSION}
        </p>
      </div>
    </aside>
  );
}
