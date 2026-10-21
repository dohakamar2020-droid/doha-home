"use client";

import type { IsoDate } from "@/types/domain";
import { WEEKDAY_SHORT } from "@/types/domain";
import { formatFullDate, weekdayOf } from "@/lib/date";

export interface DaySummary {
  total: number;
  completed: number;
  percentage: number;
}

interface WeeklyCalendarProps {
  weekDates: readonly IsoDate[];
  selectedDate: IsoDate;
  today: IsoDate;
  onSelect: (date: IsoDate) => void;
  getSummary: (date: IsoDate) => DaySummary;
}

export function WeeklyCalendar({
  weekDates,
  selectedDate,
  today,
  onSelect,
  getSummary,
}: WeeklyCalendarProps) {
  return (
    <div
      className="grid grid-cols-7 gap-1 rounded-2xl border border-sage-100 bg-white p-2 shadow-soft sm:gap-2 sm:p-3"
      role="group"
      aria-label="تقويم الأسبوع"
    >
      {weekDates.map((date) => {
        const summary = getSummary(date);
        const isSelected = date === selectedDate;
        const isToday = date === today;
        const weekday = weekdayOf(date);
        return (
          <button
            key={date}
            type="button"
            onClick={() => onSelect(date)}
            aria-pressed={isSelected}
            aria-label={`${formatFullDate(date)} — ${summary.total} مهمة، خلصتي ${summary.completed}`}
            className={`flex min-h-[76px] min-w-0 flex-col items-center justify-between gap-1 rounded-xl border px-0.5 py-2 text-center transition-colors sm:min-h-[88px] sm:px-1.5 ${
              isSelected
                ? "border-sage-500 bg-sage-500 text-white"
                : isToday
                  ? "border-sage-300 bg-sage-50 text-sage-800"
                  : "border-transparent bg-white text-ink hover:bg-sage-50"
            }`}
          >
            <span className="text-[10px] font-semibold sm:text-xs">{WEEKDAY_SHORT[weekday]}</span>
            <span className="text-base font-bold leading-none sm:text-lg">
              {Number(date.slice(8, 10))}
            </span>
            <span
              className={`w-full truncate text-[10px] font-medium ${
                isSelected ? "text-white/90" : "text-ink-soft"
              }`}
            >
              {summary.total === 0 ? "فاضي" : `${summary.completed}/${summary.total}`}
            </span>
            <span
              className={`h-1 w-full overflow-hidden rounded-full ${
                isSelected ? "bg-white/30" : "bg-sage-100"
              }`}
              aria-hidden="true"
            >
              <span
                className={`block h-full rounded-full ${
                  isSelected ? "bg-white" : "bg-sage-500"
                }`}
                style={{ width: `${summary.percentage}%` }}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
