"use client";

import { orderedWeekdays } from "@/lib/date";
import { WEEKDAY_LABELS, WEEKDAY_SHORT } from "@/types/domain";
import type { Weekday } from "@/types/domain";

interface WeekdaySelectorProps {
  value: Weekday[];
  onChange: (next: Weekday[]) => void;
  weekStartsOn?: Weekday;
  describedBy?: string;
  compact?: boolean;
}

export function WeekdaySelector({
  value,
  onChange,
  weekStartsOn = 6,
  describedBy,
  compact = false,
}: WeekdaySelectorProps) {
  const days = orderedWeekdays(weekStartsOn);

  const toggle = (day: Weekday) => {
    if (value.includes(day)) {
      onChange(value.filter((item) => item !== day));
    } else {
      onChange([...value, day].sort((a, b) => a - b) as Weekday[]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="أيام التكرار" aria-describedby={describedBy}>
      {days.map((day) => {
        const selected = value.includes(day);
        return (
          <button
            key={day}
            type="button"
            aria-pressed={selected}
            aria-label={WEEKDAY_LABELS[day]}
            onClick={() => toggle(day)}
            className={`min-h-[38px] min-w-[44px] rounded-xl border px-2 text-xs font-semibold transition-colors ${
              selected
                ? "border-sage-500 bg-sage-500 text-white"
                : "border-sage-200 bg-white text-ink-soft hover:bg-sage-50"
            }`}
          >
            {compact ? WEEKDAY_SHORT[day] : WEEKDAY_LABELS[day]}
          </button>
        );
      })}
    </div>
  );
}
