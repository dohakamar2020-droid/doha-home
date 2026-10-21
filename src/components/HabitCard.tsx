"use client";

import { Check, Flame, Pencil, Plus, Trash2 } from "lucide-react";
import { WEEKDAY_SHORT } from "@/types/domain";
import type { Habit, HabitCompletion, IsoDate } from "@/types/domain";
import { formatFullDate, weekdayOf } from "@/lib/date";
import { calculateHabitStreak, isHabitCompleted } from "@/lib/habits";
import { ProgressBar } from "@/components/ProgressBar";

interface HabitCardProps {
  habit: Habit;
  completions: readonly HabitCompletion[];
  today: IsoDate;
  date: IsoDate;
  weekDates: readonly IsoDate[];
  weekProgress: { scheduled: number; completed: number; percentage: number };
  onToggle: (date: IsoDate) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function HabitCard({
  habit,
  completions,
  today,
  date,
  weekDates,
  weekProgress,
  onToggle,
  onEdit,
  onDelete,
}: HabitCardProps) {
  const completed = isHabitCompleted(completions, habit.id, date);
  const streak = calculateHabitStreak(habit, completions, today);
  const scheduledToday = habit.weekdays.includes(weekdayOf(date));

  return (
    <article className="rounded-2xl border border-sage-100 bg-white p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-ink">{habit.name}</h3>
          {habit.description ? (
            <p className="mt-0.5 text-[11px] leading-5 text-ink-soft">{habit.description}</p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-ink-soft">
            <span className="inline-flex items-center gap-1 text-[#9C5A2E]">
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              {streak > 0 ? `${streak} ${streak === 1 ? "يوم" : "أيام"} متتالية` : "ابدئي السلسلة"}
            </span>
            <span>{formatFullDate(date)}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="icon-btn h-9 w-9"
            aria-label={`تعديل ${habit.name}`}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="icon-btn h-9 w-9 text-[#9C4451] hover:bg-[#FDF3F4]"
            aria-label={`حذف ${habit.name}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onToggle(date)}
          aria-pressed={completed}
          className={`btn min-h-[44px] flex-1 ${
            completed
              ? "bg-sage-500 text-white hover:bg-sage-600"
              : "border border-sage-200 bg-white text-sage-700 hover:bg-sage-50"
          }`}
        >
          {completed ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              اتعملت النهاردة
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {scheduledToday ? "علّميها كاملة" : "تسجيل إنجاز إضافي"}
            </>
          )}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-1" role="group" aria-label={`أيام أسبوع ${habit.name}`}>
        {weekDates.map((day) => {
          const scheduled = habit.weekdays.includes(weekdayOf(day));
          const done = isHabitCompleted(completions, habit.id, day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => onToggle(day)}
              disabled={!scheduled}
              aria-pressed={done}
              aria-label={`${WEEKDAY_SHORT[weekdayOf(day)]} ${formatFullDate(day)}${scheduled ? (done ? " — اتعملت" : " — لسه") : " — مش مجدول"}`}
              className={`flex min-h-[40px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border text-[10px] font-semibold transition-colors ${
                !scheduled
                  ? "cursor-not-allowed border-transparent bg-cream/60 text-ink-soft/40"
                  : done
                    ? "border-sage-500 bg-sage-500 text-white"
                    : "border-sage-200 bg-white text-ink-soft hover:bg-sage-50"
              } ${day === date ? "ring-2 ring-sage-400 ring-offset-1" : ""}`}
            >
              <span>{WEEKDAY_SHORT[weekdayOf(day)]}</span>
              <span aria-hidden="true">{scheduled ? (done ? "✓" : "•") : "–"}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <ProgressBar
          value={weekProgress.percentage}
          label={`تقدّم الأسبوع: ${weekProgress.completed} من ${weekProgress.scheduled}`}
          showValue
          tone="pink"
        />
      </div>
    </article>
  );
}
