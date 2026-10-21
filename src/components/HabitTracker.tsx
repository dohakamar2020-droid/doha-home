"use client";

import { WEEKDAY_SHORT } from "@/types/domain";
import type { Habit, HabitCompletion, IsoDate } from "@/types/domain";
import { formatFullDate, weekdayOf } from "@/lib/date";
import { isHabitCompleted } from "@/lib/habits";

interface HabitTrackerProps {
  habits: readonly Habit[];
  completions: readonly HabitCompletion[];
  weekDates: readonly IsoDate[];
  selectedDate: IsoDate;
  onToggle: (habitId: string, date: IsoDate) => void;
  onSelectDate: (date: IsoDate) => void;
}

/**
 * مصفوفة أسبوعية: العادات في الصفوف والأيام في الأعمدة.
 * الجدول داخل منطقة تمرير أفقية محتواة، عشان الصفحة نفسها ما تفيضش على الموبايل.
 */
export function HabitTracker({
  habits,
  completions,
  weekDates,
  selectedDate,
  onToggle,
  onSelectDate,
}: HabitTrackerProps) {
  if (habits.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-sage-200 p-3 text-center text-xs text-ink-soft">
        ضيفي عادة الأول وهنرسملك متابعة الأسبوع هنا.
      </p>
    );
  }

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <table className="w-full min-w-[380px] border-separate border-spacing-y-1.5">
        <caption className="sr-only">متابعة العادات خلال الأسبوع</caption>
        <thead>
          <tr>
            <th scope="col" className="w-[38%] px-1 pb-1 text-right text-[10px] font-semibold text-ink-soft">
              العادة
            </th>
            {weekDates.map((date) => (
              <th
                key={date}
                scope="col"
                className={`px-0.5 pb-1 text-center text-[10px] font-semibold ${
                  date === selectedDate ? "text-sage-700" : "text-ink-soft"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectDate(date)}
                  aria-label={`اختيار ${formatFullDate(date)}`}
                  aria-pressed={date === selectedDate}
                  className={`mx-auto flex min-h-[36px] w-full flex-col items-center justify-center rounded-lg px-0.5 ${
                    date === selectedDate ? "bg-sage-50" : "hover:bg-sage-50"
                  }`}
                >
                  <span>{WEEKDAY_SHORT[weekdayOf(date)]}</span>
                  <span className="text-xs font-bold text-ink">{Number(date.slice(8, 10))}</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {habits.map((habit) => (
            <tr key={habit.id}>
              <th scope="row" className="rounded-r-xl bg-cream/60 px-2 py-2 text-right">
                <span className="block truncate text-[11px] font-bold text-ink">{habit.name}</span>
                <span className="block text-[9px] text-ink-soft">
                  {habit.weekdays.length === 7
                    ? "كل يوم"
                    : habit.weekdays.map((day) => WEEKDAY_SHORT[day]).join("، ")}
                </span>
              </th>
              {weekDates.map((date) => {
                const scheduled = habit.weekdays.includes(weekdayOf(date));
                const done = isHabitCompleted(completions, habit.id, date);
                return (
                  <td key={date} className="px-0.5 text-center">
                    <button
                      type="button"
                      disabled={!scheduled}
                      onClick={() => onToggle(habit.id, date)}
                      aria-pressed={done}
                      aria-label={`${habit.name} — ${formatFullDate(date)}${done ? " — اتعملت" : scheduled ? " — لسه" : " — مش مجدول"}`}
                      className={`mx-auto flex h-9 w-full max-w-[40px] items-center justify-center rounded-lg border text-[11px] font-bold transition-colors ${
                        !scheduled
                          ? "cursor-not-allowed border-transparent bg-cream/40 text-ink-soft/30"
                          : done
                            ? "border-sage-500 bg-sage-500 text-white"
                            : "border-sage-200 bg-white text-sage-700 hover:bg-sage-50"
                      }`}
                    >
                      {scheduled ? (done ? "✓" : "•") : "–"}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
