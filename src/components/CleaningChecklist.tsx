"use client";

import { CalendarClock, Check, History, Pencil, Trash2 } from "lucide-react";
import type { CleaningItem } from "@/lib/cleaning";
import { describeCleaningSchedule } from "@/lib/recurrence";
import { formatDayMonth, formatFullDate } from "@/lib/date";
import type { IsoDate } from "@/types/domain";

interface CleaningChecklistProps {
  items: readonly CleaningItem[];
  today: IsoDate;
  onToggle: (item: CleaningItem) => void;
  onEdit?: (item: CleaningItem) => void;
  onDelete?: (item: CleaningItem) => void;
  showRoom?: boolean;
}

/** التاريخ اللي بنسجّل عليه الإكمال: الميعاد المستحق لو متأخر، وإلا النهاردة */
export function cleaningCompletionDate(item: CleaningItem, today: IsoDate): IsoDate {
  if (item.isDueToday) return today;
  if (item.isOverdue && item.dueDate) return item.dueDate;
  return today;
}

export function CleaningChecklist({
  items,
  today,
  onToggle,
  onEdit,
  onDelete,
  showRoom = false,
}: CleaningChecklistProps) {
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const completed = item.isDueToday
          ? item.completedOnDue
          : item.isOverdue
            ? false
            : item.lastCompleted === today;
        return (
          <li
            key={item.task.id}
            className="flex items-start gap-2.5 rounded-xl border border-sage-100 p-2.5"
          >
            <button
              type="button"
              onClick={() => onToggle(item)}
              role="checkbox"
              aria-checked={completed}
              aria-label={`${item.task.title}${completed ? " — خلصت" : " — علّميها كمتعملة"}`}
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                completed
                  ? "border-sage-500 bg-sage-500 text-white"
                  : "border-sage-300 bg-white text-transparent hover:border-sage-500"
              }`}
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <div className="min-w-0 flex-1">
              <p
                className={`text-xs font-bold leading-5 ${
                  completed ? "text-ink-soft line-through" : "text-ink"
                }`}
              >
                {item.task.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-ink-soft">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3 w-3 text-sage-500" aria-hidden="true" />
                  {describeCleaningSchedule(item.task)}
                </span>
                {showRoom && item.room ? <span>{item.room.name}</span> : null}
                {item.isOverdue && item.dueDate ? (
                  <span className="rounded-full bg-[#FDF3F4] px-2 py-0.5 font-bold text-[#9C4451]">
                    متأخر من {formatDayMonth(item.dueDate)}
                  </span>
                ) : null}
                {item.isDueToday ? (
                  <span className="rounded-full bg-sage-100 px-2 py-0.5 font-bold text-sage-700">
                    مستحق النهاردة
                  </span>
                ) : null}
                {item.lastCompleted ? (
                  <span className="inline-flex items-center gap-1">
                    <History className="h-3 w-3 text-sage-500" aria-hidden="true" />
                    آخر مرة: {formatFullDate(item.lastCompleted)}
                  </span>
                ) : (
                  <span className="text-ink-soft/70">لسه ما اتعملتش</span>
                )}
              </div>
              {item.task.notes ? (
                <p className="mt-1 text-[11px] leading-5 text-ink-soft">{item.task.notes}</p>
              ) : null}
            </div>

            {onEdit || onDelete ? (
              <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                {onEdit ? (
                  <button
                    type="button"
                    className="icon-btn h-8 w-8"
                    onClick={() => onEdit(item)}
                    aria-label={`تعديل ${item.task.title}`}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ) : null}
                {onDelete ? (
                  <button
                    type="button"
                    className="icon-btn h-8 w-8 text-[#9C4451] hover:bg-[#FDF3F4]"
                    onClick={() => onDelete(item)}
                    aria-label={`حذف ${item.task.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
