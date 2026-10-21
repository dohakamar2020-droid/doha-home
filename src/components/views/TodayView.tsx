"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ListTodo,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useToday } from "@/hooks/useToday";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { TaskForm } from "@/components/TaskForm";
import { TaskList } from "@/components/TaskList";
import { TaskFilters, applyTaskFilters, DEFAULT_TASK_FILTERS } from "@/components/TaskFilters";
import type { TaskFilterState } from "@/components/TaskFilters";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  addDays,
  formatDayLabel,
  relativeDayLabel,
  timeToMinutes,
} from "@/lib/date";
import { calculateProgress, isTaskCompleted, sortTasksByTime } from "@/lib/progress";
import { occursOn } from "@/lib/recurrence";
import {
  addTask,
  deleteTask,
  rescheduleTask,
  toggleTaskCompletion,
  updateTask,
} from "@/lib/operations";
import type { IsoDate, Task, TaskInput } from "@/types/domain";

export function TodayView() {
  const { data, update, notify } = useStore();
  const today = useToday();
  const [selectedDate, setSelectedDate] = useState<IsoDate>(today);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [filters, setFilters] = useState<TaskFilterState>(DEFAULT_TASK_FILTERS);

  const view = useMemo(() => {
    if (!data) return null;
    const dayTasks = data.tasks.filter((task) => occursOn(task, selectedDate));
    const progress = calculateProgress(dayTasks, data.taskCompletions, selectedDate);
    const scheduled = sortTasksByTime(dayTasks.filter((task) => timeToMinutes(task.startTime ?? null) !== null));
    const unscheduled = sortTasksByTime(
      dayTasks.filter((task) => timeToMinutes(task.startTime ?? null) === null),
    );
    const filtered = applyTaskFilters(dayTasks, filters, (taskId) =>
      isTaskCompleted(data.taskCompletions, taskId, selectedDate),
    );
    const filteredIds = new Set(filtered.map((task) => task.id));
    return {
      dayTasks,
      progress,
      scheduled: scheduled.filter((task) => filteredIds.has(task.id)),
      unscheduled: unscheduled.filter((task) => filteredIds.has(task.id)),
      visibleCount: filtered.length,
    };
  }, [data, selectedDate, filters]);

  if (!data || !view) return null;

  const handleSubmit = (input: TaskInput) => {
    if (editingTask) {
      update((current) => updateTask(current, editingTask.id, input));
      notify("التعديلات اتحفظت ✅");
    } else {
      update((current) => addTask(current, input).data);
      notify("اتضافت مهمة جديدة 🌿");
    }
    setFormOpen(false);
    setEditingTask(null);
  };

  const isToday = selectedDate === today;

  return (
    <div className="space-y-5">
      <PageHeader
        title="يومي"
        subtitle={`${relativeDayLabel(selectedDate, today)} — ${formatDayLabel(selectedDate)}`}
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditingTask(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            مهمة جديدة
          </button>
        }
      />

      <section className="card" aria-label="التنقل بين الأيام">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="icon-btn border border-sage-200"
              onClick={() => setSelectedDate((date) => addDays(date, -1))}
              aria-label="اليوم السابق"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="icon-btn border border-sage-200"
              onClick={() => setSelectedDate((date) => addDays(date, 1))}
              aria-label="اليوم التالي"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="px-2">
              <p className="text-sm font-bold text-ink">{formatDayLabel(selectedDate)}</p>
              <p className="text-[11px] text-ink-soft">
                {relativeDayLabel(selectedDate, today)}
                {isToday ? " • النهاردة" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="jump-date" className="sr-only">
              اختاري تاريخ
            </label>
            <input
              id="jump-date"
              type="date"
              value={selectedDate}
              onChange={(event) => {
                if (event.target.value) setSelectedDate(event.target.value);
              }}
              className="field-input min-h-[40px] w-[150px] py-1.5 text-xs"
            />
            {!isToday ? (
              <button
                type="button"
                className="btn-secondary btn-sm min-h-[40px]"
                onClick={() => setSelectedDate(today)}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                النهاردة
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar
            value={view.progress.percentage}
            label={`خلصتي ${view.progress.completed} من ${view.progress.total} مهمة`}
            showValue
          />
        </div>
        {view.progress.total > 0 && view.progress.remaining === 0 ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-sage-700" role="status">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            ما شاء الله، كل مهام اليوم ده خلصت.
          </p>
        ) : null}
      </section>

      <TaskFilters
        value={filters}
        onChange={setFilters}
        visibleCount={view.visibleCount}
        totalCount={view.dayTasks.length}
      />

      {view.dayTasks.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="مفيش مهام في اليوم ده"
          description="ضيفي مهمة بسيطة، أو كرّري روتينك اليومي. كل حاجة بتتحفظ على جهازك."
          action={
            <button type="button" className="btn-primary btn-sm" onClick={() => setFormOpen(true)}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              أضيفي أول مهمة
            </button>
          }
        />
      ) : (
        <div className="space-y-5">
          <section aria-labelledby="scheduled-title">
            <h2 id="scheduled-title" className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
              <Clock className="h-4 w-4 text-sage-600" aria-hidden="true" />
              مهام بوقت محدد
              <span className="chip">{view.scheduled.length}</span>
            </h2>
            {view.scheduled.length === 0 ? (
              <p className="rounded-xl border border-dashed border-sage-200 px-3 py-3 text-xs text-ink-soft">
                مفيش مهام ليها وقت محدد — المهام من غير وقت تحت.
              </p>
            ) : (
              <TaskList
                tasks={view.scheduled}
                date={selectedDate}
                completions={data.taskCompletions}
                onToggle={(taskId) =>
                  update((current) => toggleTaskCompletion(current, taskId, selectedDate))
                }
                onEdit={(task) => {
                  setEditingTask(task);
                  setFormOpen(true);
                }}
                onDelete={(task) => setTaskToDelete(task)}
                onReschedule={(task, date) => {
                  update((current) => rescheduleTask(current, task.id, date));
                  notify(`«${task.title}» اتنقلت لـ ${date}`);
                }}
                ariaLabel="المهام اللي ليها وقت"
              />
            )}
          </section>

          <section aria-labelledby="unscheduled-title">
            <h2
              id="unscheduled-title"
              className="mb-2 flex items-center gap-2 text-sm font-bold text-ink"
            >
              <ListTodo className="h-4 w-4 text-sage-600" aria-hidden="true" />
              مهام من غير وقت
              <span className="chip">{view.unscheduled.length}</span>
            </h2>
            {view.unscheduled.length === 0 ? (
              <p className="rounded-xl border border-dashed border-sage-200 px-3 py-3 text-xs text-ink-soft">
                كل المهام ليها وقت محدد اليوم. تحبي تضيفي مهمة مرنة؟
              </p>
            ) : (
              <TaskList
                tasks={view.unscheduled}
                date={selectedDate}
                completions={data.taskCompletions}
                onToggle={(taskId) =>
                  update((current) => toggleTaskCompletion(current, taskId, selectedDate))
                }
                onEdit={(task) => {
                  setEditingTask(task);
                  setFormOpen(true);
                }}
                onDelete={(task) => setTaskToDelete(task)}
                onReschedule={(task, date) => {
                  update((current) => rescheduleTask(current, task.id, date));
                  notify(`«${task.title}» اتنقلت لـ ${date}`);
                }}
                ariaLabel="المهام من غير وقت"
              />
            )}
          </section>
        </div>
      )}

      <TaskForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSubmit}
        initialTask={editingTask}
        defaultDate={selectedDate}
        weekStartsOn={data.settings.weekStartsOn}
      />

      <ConfirmDialog
        open={Boolean(taskToDelete)}
        title="تحذفي المهمة؟"
        description={`«${taskToDelete?.title ?? ""}» هتتشال نهائي مع سجل إكمالها.`}
        confirmLabel="احذفي"
        danger
        onCancel={() => setTaskToDelete(null)}
        onConfirm={() => {
          if (taskToDelete) {
            update((current) => deleteTask(current, taskToDelete.id));
            notify("المهمة اتحذفت", "info");
          }
          setTaskToDelete(null);
        }}
      />
    </div>
  );
}
