"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isNavItemVisible } from "@/components/navigation";
import type { SectionId } from "@/types/domain";

export function MobileBottomNav({
  visibleSections,
}: {
  visibleSections: readonly SectionId[];
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => isNavItemVisible(item, visibleSections));

  return (
    <nav
      aria-label="التنقل السفلي"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sage-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex w-full max-w-3xl items-stretch justify-between px-1">
        {items.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`mx-0.5 my-1 flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors ${
                  isActive
                    ? "bg-sage-50 text-sage-700"
                    : "text-ink-soft hover:bg-sage-50/60 hover:text-sage-700"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${isActive ? "text-sage-600" : "text-ink-soft"}`}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
