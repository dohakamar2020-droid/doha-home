"use client";

import { useState } from "react";
import {
  CalendarClock,
  Check,
  Clock,
  Pencil,
  Repeat,
  StickyNote,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import type { IsoDate, Task } from "@/types/domain";
import { CATEGORY_LABELS, PRIORITY_LABELS } from "@/types/domain";
import { describeRecurrence } from "@/lib/recurrence";
import { formatDuration, formatTime } from "@/lib/date";

interface TaskCardProps {
  task: Task;
  date: IsoDate;
  completed: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReschedule?: (date: IsoDate) => void;
  compact?: boolean;
}

const priorityStyles: Record<Task["priority"], { dot: string; text: string; label: string }> = {
  high: { dot: "bg-[#C96A76]", text: "text-[#9C4451]", label: PRIORITY_LABELS.high },
  medium: { dot: "bg-sage-400", text: "text-sage-700", label: PRIORITY_LABELS.medium },
  low: { dot: "bg-sage-200", text: "text-ink-soft", label: PRIORITY_LABELS.low },
};

export function TaskCard({
  task,
  date,
  completed,
  onToggle,
  onEdit,
  onDelete,
  onReschedule,
  compact = false,
}: TaskCardProps) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [targetDate, setTargetDate] = useState<IsoDate>(date);
  const priority = priorityStyles[task.priority];
  const hasActions = Boolean(onEdit || onDelete || onReschedule);
  const titleId = `task-title-${task.id}`;

  return (
    <article
      className={`group rounded-2xl border bg-white p-3 transition-shadow hover:shadow-soft sm:p-4 ${
        completed ? "border-sage-100 bg-sage-50/40" : "border-sage-100"
      }`}
      aria-labelledby={titleId}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={completed}
          aria-labelledby={titleId}
          onClick={onToggle}
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
            completed
              ? "border-sage-500 bg-sage-500 text-white"
              : "border-sage-300 bg-white text-transparent hover:border-sage-500"
          }`}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{completed ? "إلغاء الإكمال" : "تعليم كمكتملة"}</span>
        </button>

        <div className="min-w-0 flex-1">
          <h3
            id={titleId}
            className={`text-sm font-bold leading-6 ${completed ? "text-ink-soft line-through" : "text-ink"}`}
          >
            {task.title}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-ink-soft">
            {task.startTime ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-sage-500" aria-hidden="true" />
                {formatTime(task.startTime)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-ink-soft/80">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                من غير وقت محدد
              </span>
            )}
            {task.durationMinutes ? (
              <span className="inline-flex items-center gap-1">
                <Timer className="h-3.5 w-3.5 text-sage-500" aria-hidden="true" />
                {formatDuration(task.durationMinutes)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Repeat className="h-3.5 w-3.5 text-sage-500" aria-hidden="true" />
              {describeRecurrence(task.recurrence)}
            </span>
            <span className={`inline-flex items-center gap-1 ${priority.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} aria-hidden="true" />
              أولوية {priority.label}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="chip">{CATEGORY_LABELS[task.category]}</span>
          </div>

          {!compact && task.notes ? (
            <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-cream/80 px-2.5 py-2 text-xs leading-5 text-ink-soft">
              <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-500" aria-hidden="true" />
              <span className="break-words">{task.notes}</span>
            </p>
          ) : null}
        </div>

        {hasActions ? (
          <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="icon-btn h-9 w-9"
                aria-label={`تعديل ${task.title}`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
            {onReschedule ? (
              <button
                type="button"
                onClick={() => setRescheduleOpen((open) => !open)}
                className="icon-btn h-9 w-9"
                aria-label={`نقل ${task.title} لتاريخ تاني`}
                aria-expanded={rescheduleOpen}
              >
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="icon-btn h-9 w-9 text-[#9C4451] hover:bg-[#FDF3F4]"
                aria-label={`حذف ${task.title}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {rescheduleOpen && onReschedule ? (
        <form
          className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-sage-100 bg-cream/60 p-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            onReschedule(targetDate);
            setRescheduleOpen(false);
          }}
        >
          <div className="min-w-0 flex-1">
            <label
              htmlFor={`reschedule-${task.id}`}
              className="mb-1 block text-[11px] font-semibold text-ink-soft"
            >
              التاريخ الجديد
            </label>
            <input
              id={`reschedule-${task.id}`}
              type="date"
              className="field-input min-h-[38px] py-1.5"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              required
            />
          </div>
          <div className="flex gap-1">
            <button type="submit" className="btn-primary btn-sm min-h-[38px]">
              نقل
            </button>
            <button
              type="button"
              className="btn-ghost btn-sm min-h-[38px]"
              onClick={() => setRescheduleOpen(false)}
              aria-label="إلغاء النقل"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {task.recurrence.type !== "once" ? (
            <p className="w-full text-[11px] leading-5 text-ink-soft">
              دي مهمة متكررة، فالنقل بيغيّر بداية التكرار ومش بيمسح سجل الأيام اللي فاتت.
            </p>
          ) : null}
        </form>
      ) : null}
    </article>
  );
}
