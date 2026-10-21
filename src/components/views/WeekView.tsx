"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, RotateCcw } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useToday } from "@/hooks/useToday";
import { PageHeader } from "@/components/PageHeader";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import type { DaySummary } from "@/components/WeeklyCalendar";
import { TaskList } from "@/components/TaskList";
import { TaskForm } from "@/components/TaskForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { ProgressBar } from "@/components/ProgressBar";
import { addDays, formatDayMonth, formatDayLabel, startOfWeek, weekDates } from "@/lib/date";
import { calculateProgress } from "@/lib/progress";
import { occursOn } from "@/lib/recurrence";
import {
  addTask,
  deleteTask,
  rescheduleTask,
  toggleTaskCompletion,
  updateTask,
} from "@/lib/operations";
import type { IsoDate, Task, TaskInput } from "@/types/domain";

export function WeekView() {
  const { data, update, notify } = useStore();
  const today = useToday();
  const weekStartsOn = data?.settings.weekStartsOn ?? 6;
  const [anchor, setAnchor] = useState<IsoDate>(today);
  const [selectedDate, setSelectedDate] = useState<IsoDate>(today);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const dates = useMemo(() => weekDates(anchor, weekStartsOn), [anchor, weekStartsOn]);

  const weekSummary = useMemo(() => {
    if (!data) return null;
    const summaries = new Map<IsoDate, DaySummary>();
    dates.forEach((date) => {
      const dayTasks = data.tasks.filter((task) => occursOn(task, date));
      const progress = calculateProgress(dayTasks, data.taskCompletions, date);
      summaries.set(date, {
        total: progress.total,
        completed: progress.completed,
        percentage: progress.percentage,
      });
    });
    const total = Array.from(summaries.values()).reduce((sum, item) => sum + item.total, 0);
    const completed = Array.from(summaries.values()).reduce(
      (sum, item) => sum + item.completed,
      0,
    );
    return {
      summaries,
      total,
      completed,
      percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  }, [data, dates]);

  const selectedTasks = useMemo(() => {
    if (!data) return [];
    return data.tasks.filter((task) => occursOn(task, selectedDate));
  }, [data, selectedDate]);

  if (!data || !weekSummary) return null;

  const selectedProgress = calculateProgress(selectedTasks, data.taskCompletions, selectedDate);
  const first = dates[0] ?? today;
  const last = dates[6] ?? today;
  const isCurrentWeek = startOfWeek(today, weekStartsOn) === startOfWeek(anchor, weekStartsOn);

  const handleSubmit = (input: TaskInput) => {
    if (editingTask) {
      update((current) => updateTask(current, editingTask.id, input));
      notify("المهمة اتعدّلت ✅");
    } else {
      update((current) => addTask(current, input).data);
      notify(`مهمة جديدة يوم ${formatDayLabel(selectedDate)} 🌿`);
    }
    setFormOpen(false);
    setEditingTask(null);
  };

  const moveWeek = (offset: number) => {
    setAnchor((current) => addDays(current, offset * 7));
    setSelectedDate((current) => addDays(current, offset * 7));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="الأسبوع"
        subtitle={`من ${formatDayMonth(first)} لـ ${formatDayMonth(last)} — اختاري يوم وشوفي مهامه.`}
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => moveWeek(-1)}>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              الأسبوع اللي فات
            </button>
            <button type="button" className="btn-secondary" onClick={() => moveWeek(1)}>
              الأسبوع الجاي
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            {!isCurrentWeek ? (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setAnchor(today);
                  setSelectedDate(today);
                }}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                الأسبوع الحالي
              </button>
            ) : null}
          </>
        }
      />

      <WeeklyCalendar
        weekDates={dates}
        selectedDate={selectedDate}
        today={today}
        onSelect={setSelectedDate}
        getSummary={(date) =>
          weekSummary.summaries.get(date) ?? { total: 0, completed: 0, percentage: 0 }
        }
      />

      <section className="card" aria-labelledby="week-progress-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="week-progress-title" className="text-sm font-bold text-ink">
            تقدّم الأسبوع
          </h2>
          <p className="text-xs font-semibold text-ink-soft">
            {weekSummary.completed} من {weekSummary.total} مهمة
          </p>
        </div>
        <div className="mt-2">
          <ProgressBar value={weekSummary.percentage} showValue label="نسبة إنجاز الأسبوع" />
        </div>
      </section>

      <section aria-labelledby="selected-day-title">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="selected-day-title" className="flex items-center gap-2 text-base font-bold text-ink">
              <CalendarDays className="h-4 w-4 text-sage-600" aria-hidden="true" />
              {formatDayLabel(selectedDate)}
            </h2>
            <p className="mt-0.5 text-xs text-ink-soft">
              {selectedProgress.total === 0
                ? "مفيش مهام في اليوم ده"
                : `${selectedProgress.completed} خلصوا • ${selectedProgress.remaining} فاضلين`}
            </p>
          </div>
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => {
              setEditingTask(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            ضيفي مهمة لليوم ده
          </button>
        </div>

        {selectedTasks.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="اليوم ده فاضي"
            description="ضيفي مهمة مرة واحدة أو كرريها أسبوعيًا، وهتظهر في الأيام المناسبة لوحدها."
            action={
              <button type="button" className="btn-primary btn-sm" onClick={() => setFormOpen(true)}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                إضافة مهمة
              </button>
            }
            compact
          />
        ) : (
          <TaskList
            tasks={selectedTasks}
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
              notify(`«${task.title}» اتنقلت لـ ${formatDayLabel(date)}`);
            }}
            ariaLabel={`مهام ${formatDayLabel(selectedDate)}`}
          />
        )}
      </section>

      <TaskForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSubmit}
        initialTask={editingTask}
        defaultDate={selectedDate}
        weekStartsOn={weekStartsOn}
      />

      <ConfirmDialog
        open={Boolean(taskToDelete)}
        title="تحذفي المهمة؟"
        description={`«${taskToDelete?.title ?? ""}» هتتشال من كل أيام التكرار وسجلها هيمسح.`}
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
