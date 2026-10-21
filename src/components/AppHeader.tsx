"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { formatDayLabel } from "@/lib/date";
import { useToday } from "@/hooks/useToday";

export function AppHeader() {
  const today = useToday();

  return (
    <header className="sticky top-0 z-30 border-b border-sage-100 bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/75 lg:hidden">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-2 px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="بيتي منظم — الصفحة الرئيسية">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sage-500 text-sm font-bold text-white">
            بـ
          </span>
          <span className="text-sm font-bold text-ink">بيتي منظم</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-medium text-ink-soft sm:inline">{formatDayLabel(today)}</span>
          <Link href="/settings" className="icon-btn" aria-label="الإعدادات">
            <Settings className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
