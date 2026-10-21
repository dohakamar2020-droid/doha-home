"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarRange,
  CheckCircle2,
  Clock,
  HeartPulse,
  Moon,
  Plus,
  SprayCan,
  Sun,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useToday } from "@/hooks/useToday";
import { TaskForm } from "@/components/TaskForm";
import { TaskList } from "@/components/TaskList";
import { ProgressCard } from "@/components/ProgressCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatFullDate, formatTime, minutesToTime } from "@/lib/date";
import { calculateProgress, getUpcomingTask } from "@/lib/progress";
import { isHabitScheduledOn, occursOn } from "@/lib/recurrence";
import { getGreeting, getEncouragement } from "@/lib/greeting";
import { buildCleaningItems } from "@/lib/cleaning";
import {
  addTask,
  deleteTask,
  toggleCleaningCompletion,
  toggleHabitCompletion,
  toggleTaskCompletion,
  updateTask,
} from "@/lib/operations";
import { isHabitCompleted } from "@/lib/habits";
import { SECTION_LABELS } from "@/types/domain";
import type { IsoDate, Task, TaskInput } from "@/types/domain";

const SECTION_CARDS = [
  { href: "/today", label: SECTION_LABELS.today, icon: CalendarCheck, hint: "جدول اليوم كامل" },
  { href: "/week", label: SECTION_LABELS.week, icon: CalendarRange, hint: "نظرة على الأسبوع" },
  { href: "/cleaning", label: SECTION_LABELS.cleaning, icon: SprayCan, hint: "تنظيف الغرف" },
  { href: "/habits", label: SECTION_LABELS.habits, icon: HeartPulse, hint: "عاداتك اليومية" },
] as const;

export function DashboardView() {
  const { data, update, notify } = useStore();
  const today = useToday();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const hour = new Date().getHours();
  const currentTime = minutesToTime(new Date().getHours() * 60 + new Date().getMinutes());

  const view = useMemo(() => {
    if (!data) return null;
    const todayTasks = data.tasks.filter((task) => occursOn(task, today));
    const progress = calculateProgress(todayTasks, data.taskCompletions, today);
    const upcoming = getUpcomingTask(todayTasks, data.taskCompletions, today, currentTime);
    const cleaningToday = buildCleaningItems(data, today).filter((item) => item.isDueToday);
    const habitsToday = data.habits.filter((habit) => isHabitScheduledOn(habit, today));
    const habitsDone = habitsToday.filter((habit) =>
      isHabitCompleted(data.habitCompletions, habit.id, today),
    ).length;
    return {
      todayTasks,
      progress,
      upcoming,
      cleaningToday,
      habitsToday,
      habitsDone,
      hasAnyTasks: data.tasks.length > 0,
    };
  }, [data, today, currentTime]);

  if (!data || !view) return null;

  const handleSubmit = (input: TaskInput) => {
    if (editingTask) {
      update((current) => updateTask(current, editingTask.id, input));
      notify("اتعدّلت المهمة ✅");
    } else {
      update((current) => addTask(current, input).data);
      notify("المهمة اتضافت ليومك 🌿");
    }
    setFormOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={formatFullDate(today)}
        title={getGreeting(hour, data.settings.displayName)}
        subtitle={
          view.progress.total === 0
            ? "لسه مفيش مهام النهاردة — خليكي خفيفة وابدئي بحاجة صغيرة."
            : `عندك ${view.progress.total} مهمة النهاردة، ${view.progress.completed} خلصوا و${view.progress.remaining} فاضلين.`
        }
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
            مهمة سريعة
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ProgressCard progress={view.progress} hint={getEncouragement(view.progress.percentage, view.progress.total)} />
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="card-flat flex items-center gap-2 py-2.5">
              <Sun className="h-4 w-4 text-sage-600" aria-hidden="true" />
              <span className="font-semibold text-ink-soft">{formatTime(data.settings.wakeUpTime)}</span>
            </div>
            <div className="card-flat flex items-center gap-2 py-2.5">
              <Moon className="h-4 w-4 text-sage-600" aria-hidden="true" />
              <span className="font-semibold text-ink-soft">{formatTime(data.settings.bedTime)}</span>
            </div>
          </div>
        </div>

        <section className="card lg:col-span-2" aria-labelledby="today-preview-title">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id="today-preview-title" className="section-title">
              <span>مهام النهاردة</span>
            </h2>
            <Link href="/today" className="btn-ghost btn-sm">
              شوفي الكل
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {view.upcoming ? (
            <div className="mb-3 rounded-2xl border border-sage-200 bg-sage-50 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-sage-700">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                أقرب مهمة جاية
              </p>
              <p className="text-sm font-bold text-ink">{view.upcoming.title}</p>
              <p className="mt-0.5 text-[11px] text-ink-soft">
                {view.upcoming.startTime ? formatTime(view.upcoming.startTime) : "من غير وقت محدد"}
              </p>
            </div>
          ) : null}

          {view.todayTasks.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="يومك لسه فاضي"
              description="ابدئي بإضافة أول مهمة، أو خدي فكرة من قوالب المهام في صفحة اليوم."
              action={
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={() => setFormOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  أضيفي مهمة
                </button>
              }
              compact
            />
          ) : (
            <TaskList
              tasks={view.todayTasks.slice(0, 5)}
              date={today}
              completions={data.taskCompletions}
              onToggle={(taskId) => update((current) => toggleTaskCompletion(current, taskId, today))}
              onEdit={(task) => {
                setEditingTask(task);
                setFormOpen(true);
              }}
              onDelete={(task) => setTaskToDelete(task)}
              ariaLabel="معاينة مهام اليوم"
            />
          )}
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card" aria-labelledby="cleaning-today-title">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="cleaning-today-title" className="flex items-center gap-2 text-sm font-bold">
              <SprayCan className="h-4 w-4 text-sage-600" aria-hidden="true" />
              تنظيف مستحق النهاردة
            </h2>
            <Link href="/cleaning" className="btn-ghost btn-sm">
              الكل
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          {view.cleaningToday.length === 0 ? (
            <p className="rounded-xl bg-sage-50 px-3 py-4 text-center text-xs text-ink-soft">
              مفيش تنظيف مستحق النهاردة — استمتعي بوقتك 🌸
            </p>
          ) : (
            <ul className="space-y-2">
              {view.cleaningToday.slice(0, 4).map((item) => {
                const completed = item.completedOnDue;
                return (
                  <li key={item.task.id}>
                    <button
                      type="button"
                      onClick={() =>
                        update((current) =>
                          toggleCleaningCompletion(current, item.task.id, today),
                        )
                      }
                      className="flex w-full items-center gap-2 rounded-xl border border-sage-100 p-2.5 text-right transition-colors hover:bg-sage-50"
                      aria-pressed={completed}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                          completed
                            ? "border-sage-500 bg-sage-500 text-white"
                            : "border-sage-300 text-transparent"
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-xs font-semibold ${
                            completed ? "text-ink-soft line-through" : "text-ink"
                          }`}
                        >
                          {item.task.title}
                        </span>
                        <span className="block text-[10px] text-ink-soft">
                          {item.room?.name ?? "غرفة"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="habits-today-title">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="habits-today-title" className="flex items-center gap-2 text-sm font-bold">
              <HeartPulse className="h-4 w-4 text-sage-600" aria-hidden="true" />
              عادات النهاردة
            </h2>
            <Link href="/habits" className="btn-ghost btn-sm">
              الكل
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          {view.habitsToday.length === 0 ? (
            <p className="rounded-xl bg-sage-50 px-3 py-4 text-center text-xs text-ink-soft">
              مفيش عادات مجدولة النهاردة.
            </p>
          ) : (
            <>
              <p className="mb-2 text-[11px] font-medium text-ink-soft">
                خلّصتي {view.habitsDone} من {view.habitsToday.length}
              </p>
              <ul className="space-y-2">
                {view.habitsToday.map((habit) => {
                  const completed = isHabitCompleted(data.habitCompletions, habit.id, today);
                  return (
                    <li key={habit.id}>
                      <button
                        type="button"
                        onClick={() =>
                          update((current) => toggleHabitCompletion(current, habit.id, today))
                        }
                        aria-pressed={completed}
                        className="flex w-full items-center gap-2 rounded-xl border border-sage-100 p-2.5 text-right transition-colors hover:bg-sage-50"
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            completed
                              ? "border-sage-500 bg-sage-500 text-white"
                              : "border-sage-300 text-transparent"
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                        <span
                          className={`truncate text-xs font-semibold ${
                            completed ? "text-ink-soft line-through" : "text-ink"
                          }`}
                        >
                          {habit.name}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>

      <section aria-labelledby="quick-nav-title">
        <h2 id="quick-nav-title" className="mb-2 text-sm font-bold text-ink">
          روحي على طول
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SECTION_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="card-flat flex min-h-[84px] flex-col justify-between gap-2 transition-colors hover:border-sage-300 hover:bg-sage-50/60"
              >
                <Icon className="h-5 w-5 text-sage-600" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-bold text-ink">{card.label}</span>
                  <span className="block text-[10px] text-ink-soft">{card.hint}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {!view.hasAnyTasks ? (
        <EmptyState
          icon={Sparkles}
          title="بيتك لسه محتاج أول خطة"
          description="مفيش مهام محفوظة. ابدأي من صفحة اليوم، أو ارجعي لقوالب البداية من الإعدادات لو حابة تختاري قالب تاني."
          action={
            <button type="button" className="btn-primary btn-sm" onClick={() => setFormOpen(true)}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              أول مهمة عندي
            </button>
          }
        />
      ) : null}

      <TaskForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSubmit}
        initialTask={editingTask}
        defaultDate={today as IsoDate}
        weekStartsOn={data.settings.weekStartsOn}
      />

      <ConfirmDialog
        open={Boolean(taskToDelete)}
        title="تحذفي المهمة؟"
        description={`«${taskToDelete?.title ?? ""}» هتتشال مع سجل إكمالها. الخطوة دي مش بترجع.`}
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
