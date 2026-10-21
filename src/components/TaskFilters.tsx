"use client";

import { Filter } from "lucide-react";
import { PRIORITIES, PRIORITY_LABELS, TASK_CATEGORIES } from "@/types/domain";
import type { Priority, TaskCategory } from "@/types/domain";

export type TaskStatusFilter = "all" | "open" | "done";

export interface TaskFilterState {
  status: TaskStatusFilter;
  category: TaskCategory | "all";
  priority: Priority | "all";
}

export const DEFAULT_TASK_FILTERS: TaskFilterState = {
  status: "all",
  category: "all",
  priority: "all",
};

interface TaskFiltersProps {
  value: TaskFilterState;
  onChange: (next: TaskFilterState) => void;
  visibleCount: number;
  totalCount: number;
}

export function TaskFilters({ value, onChange, visibleCount, totalCount }: TaskFiltersProps) {
  return (
    <div className="rounded-2xl border border-sage-100 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
          <Filter className="h-3.5 w-3.5" aria-hidden="true" />
          فلترة المهام
        </p>
        <p className="text-[11px] text-ink-soft" aria-live="polite">
          {visibleCount} من {totalCount}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <label htmlFor="filter-status" className="mb-1 block text-[11px] font-semibold text-ink-soft">
            الحالة
          </label>
          <select
            id="filter-status"
            className="field-input min-h-[38px] py-1.5 text-xs"
            value={value.status}
            onChange={(event) =>
              onChange({ ...value, status: event.target.value as TaskStatusFilter })
            }
          >
            <option value="all">الكل</option>
            <option value="open">لسه ما خلصتش</option>
            <option value="done">خلصت</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-category" className="mb-1 block text-[11px] font-semibold text-ink-soft">
            الفئة
          </label>
          <select
            id="filter-category"
            className="field-input min-h-[38px] py-1.5 text-xs"
            value={value.category}
            onChange={(event) =>
              onChange({ ...value, category: event.target.value as TaskCategory | "all" })
            }
          >
            <option value="all">كل الفئات</option>
            {TASK_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-priority" className="mb-1 block text-[11px] font-semibold text-ink-soft">
            الأولوية
          </label>
          <select
            id="filter-priority"
            className="field-input min-h-[38px] py-1.5 text-xs"
            value={value.priority}
            onChange={(event) =>
              onChange({ ...value, priority: event.target.value as Priority | "all" })
            }
          >
            <option value="all">كل الأولويات</option>
            {PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {PRIORITY_LABELS[priority.value]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export function applyTaskFilters<T extends { category: TaskCategory; priority: Priority; id: string }>(
  tasks: readonly T[],
  filters: TaskFilterState,
  isCompleted: (taskId: string) => boolean,
): T[] {
  return tasks.filter((task) => {
    if (filters.category !== "all" && task.category !== filters.category) return false;
    if (filters.priority !== "all" && task.priority !== filters.priority) return false;
    if (filters.status === "open" && isCompleted(task.id)) return false;
    if (filters.status === "done" && !isCompleted(task.id)) return false;
    return true;
  });
}
