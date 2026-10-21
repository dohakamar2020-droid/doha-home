"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  HeartPulse,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useToday } from "@/hooks/useToday";
import { PageHeader } from "@/components/PageHeader";
import { HabitCard } from "@/components/HabitCard";
import { HabitTracker } from "@/components/HabitTracker";
import { HabitForm } from "@/components/HabitForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { ProgressBar } from "@/components/ProgressBar";
import {
  addDays,
  formatDayLabel,
  formatMonthYear,
  relativeDayLabel,
  weekDates,
} from "@/lib/date";
import { isHabitScheduledOn } from "@/lib/recurrence";
import {
  calculateHabitStreak,
  habitWeekProgress,
  isHabitCompleted,
} from "@/lib/habits";
import { addHabit, deleteHabit, toggleHabitCompletion, updateHabit } from "@/lib/operations";
import type { Habit, HabitInput, IsoDate } from "@/types/domain";

export function HabitsView() {
  const { data, update, notify } = useStore();
  const today = useToday();
  const weekStartsOn = data?.settings.weekStartsOn ?? 6;
  const [selectedDate, setSelectedDate] = useState<IsoDate>(today);
  const [weekAnchor, setWeekAnchor] = useState<IsoDate>(today);
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  const dates = useMemo(() => weekDates(weekAnchor, weekStartsOn), [weekAnchor, weekStartsOn]);

  const view = useMemo(() => {
    if (!data) return null;
    const scheduled = data.habits.filter((habit) => isHabitScheduledOn(habit, selectedDate));
    const completed = scheduled.filter((habit) =>
      isHabitCompleted(data.habitCompletions, habit.id, selectedDate),
    );
    const others = data.habits.filter((habit) => !scheduled.includes(habit));
    const scheduledTotal = data.habits.reduce(
      (sum, habit) => sum + habitWeekProgress(habit, data.habitCompletions, dates, today).scheduled,
      0,
    );
    const completedTotal = data.habits.reduce(
      (sum, habit) => sum + habitWeekProgress(habit, data.habitCompletions, dates, today).completed,
      0,
    );
    const bestStreak = data.habits.reduce(
      (best, habit) => Math.max(best, calculateHabitStreak(habit, data.habitCompletions, today)),
      0,
    );
    return {
      scheduled,
      others,
      completedCount: completed.length,
      weekPercentage:
        scheduledTotal === 0 ? 0 : Math.round((completedTotal / scheduledTotal) * 100),
      weekCompleted: completedTotal,
      weekScheduled: scheduledTotal,
      bestStreak,
    };
  }, [data, selectedDate, dates, today]);

  if (!data || !view) return null;

  const handleSubmit = (input: HabitInput) => {
    if (editingHabit) {
      update((current) => updateHabit(current, editingHabit.id, input));
      notify("العادة اتعدّلت ✅");
    } else {
      update((current) => addHabit(current, input).data);
      notify("عادة جديدة اتضافت 🌿");
    }
    setFormOpen(false);
    setEditingHabit(null);
  };

  const toggle = (habitId: string, date: IsoDate) => {
    const habit = data.habits.find((item) => item.id === habitId);
    const wasCompleted = isHabitCompleted(data.habitCompletions, habitId, date);
    update((current) => toggleHabitCompletion(current, habitId, date));
    notify(
      wasCompleted ? "شيلنا علامة العادة" : `تمام! ${habit?.name ?? "العادة"} اتسجلت ✅`,
      wasCompleted ? "info" : "success",
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="عاداتي"
        title="عادات صغيرة… فرق كبير"
        subtitle="علّمي الأيام اللي عملتي فيها العادة، والسلسلة بتكبر لوحدها."
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditingHabit(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            عادة جديدة
          </button>
        }
      />

      {data.habits.length === 0 ? (
        <EmptyState
          icon={HeartPulse}
          title="لسه مفيش عادات"
          description="ابدئي بعادة واحدة صغيرة — شرب ميه، قراءة صفحتين، أو مشي 10 دقايق."
          action={
            <button type="button" className="btn-primary btn-sm" onClick={() => setFormOpen(true)}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              أول عادة
            </button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="card-flat">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-soft">
                <HeartPulse className="h-3.5 w-3.5 text-sage-600" aria-hidden="true" />
                عادات النهاردة
              </p>
              <p className="mt-1 text-2xl font-bold text-ink">
                {view.completedCount}
                <span className="text-sm font-medium text-ink-soft"> / {view.scheduled.length}</span>
              </p>
            </div>
            <div className="card-flat">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-soft">
                <Flame className="h-3.5 w-3.5 text-[#9C5A2E]" aria-hidden="true" />
                أطول سلسلة
              </p>
              <p className="mt-1 text-2xl font-bold text-ink">
                {view.bestStreak}
                <span className="text-sm font-medium text-ink-soft"> يوم</span>
              </p>
            </div>
            <div className="card-flat">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-soft">
                <Sparkles className="h-3.5 w-3.5 text-sage-600" aria-hidden="true" />
                تقدّم الأسبوع
              </p>
              <p className="mt-1 text-2xl font-bold text-ink">{view.weekPercentage}%</p>
              <div className="mt-1">
                <ProgressBar
                  value={view.weekPercentage}
                  label={`${view.weekCompleted} من ${view.weekScheduled}`}
                />
              </div>
            </div>
          </div>

          <section className="card" aria-labelledby="habit-tracker-title">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 id="habit-tracker-title" className="text-sm font-bold text-ink">
                متابعة الأسبوع — {formatMonthYear(dates[0] ?? today)}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="icon-btn h-9 w-9 border border-sage-200"
                  onClick={() => {
                    setWeekAnchor((current) => addDays(current, -7));
                    setSelectedDate((current) => addDays(current, -7));
                  }}
                  aria-label="الأسبوع السابق"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="icon-btn h-9 w-9 border border-sage-200"
                  onClick={() => {
                    setWeekAnchor((current) => addDays(current, 7));
                    setSelectedDate((current) => addDays(current, 7));
                  }}
                  aria-label="الأسبوع التالي"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => {
                    setWeekAnchor(today);
                    setSelectedDate(today);
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  النهاردة
                </button>
              </div>
            </div>
            <HabitTracker
              habits={data.habits}
              completions={data.habitCompletions}
              weekDates={dates}
              selectedDate={selectedDate}
              onToggle={toggle}
              onSelectDate={setSelectedDate}
            />
          </section>

          <section aria-labelledby="day-habits-title">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 id="day-habits-title" className="text-base font-bold text-ink">
                  عادات {formatDayLabel(selectedDate)}
                </h2>
                <p className="text-[11px] text-ink-soft">
                  {relativeDayLabel(selectedDate, today)} • {view.completedCount} من{" "}
                  {view.scheduled.length} مكتملة
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="icon-btn h-9 w-9 border border-sage-200"
                  onClick={() => setSelectedDate((current) => addDays(current, -1))}
                  aria-label="اليوم السابق"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="icon-btn h-9 w-9 border border-sage-200"
                  onClick={() => setSelectedDate((current) => addDays(current, 1))}
                  aria-label="اليوم التالي"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {view.scheduled.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  completions={data.habitCompletions}
                  today={today}
                  date={selectedDate}
                  weekDates={dates}
                  weekProgress={habitWeekProgress(habit, data.habitCompletions, dates, today)}
                  onToggle={(date) => toggle(habit.id, date)}
                  onEdit={() => {
                    setEditingHabit(habit);
                    setFormOpen(true);
                  }}
                  onDelete={() => setHabitToDelete(habit)}
                />
              ))}
              {view.scheduled.length === 0 ? (
                <p className="rounded-xl bg-sage-50 px-3 py-4 text-center text-xs text-ink-soft">
                  مفيش عادات مجدولة في اليوم ده — يوم راحة مش محسوب عليكي.
                </p>
              ) : null}
            </div>

            {view.others.length > 0 ? (
              <details className="mt-3 rounded-2xl border border-sage-100 bg-white p-3">
                <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
                  عادات مش مجدولة في اليوم ده ({view.others.length})
                </summary>
                <p className="mt-2 text-[11px] leading-5 text-ink-soft">
                  لو عملتيها برضه وعايزة تسجّليها، اضغطي على اليوم في المتابعة أو سجليها من هنا
                  بعد ما تختاري اليوم.
                </p>
                <ul className="mt-2 space-y-1.5">
                  {view.others.map((habit) => (
                    <li key={habit.id} className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium text-ink">{habit.name}</span>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => toggle(habit.id, selectedDate)}
                          aria-pressed={isHabitCompleted(
                            data.habitCompletions,
                            habit.id,
                            selectedDate,
                          )}
                        >
                          {isHabitCompleted(data.habitCompletions, habit.id, selectedDate)
                            ? "مسجلة"
                            : "تسجيل إنجاز"}
                        </button>
                        <button
                          type="button"
                          className="icon-btn h-8 w-8"
                          onClick={() => {
                            setEditingHabit(habit);
                            setFormOpen(true);
                          }}
                          aria-label={`تعديل ${habit.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </section>
        </>
      )}

      <HabitForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingHabit(null);
        }}
        onSubmit={handleSubmit}
        initialHabit={editingHabit}
        weekStartsOn={weekStartsOn}
      />

      <ConfirmDialog
        open={Boolean(habitToDelete)}
        title="تحذفي العادة؟"
        description={`«${habitToDelete?.name ?? ""}» هتتشال مع كل سجل إنجازها.`}
        confirmLabel="احذفي"
        danger
        onCancel={() => setHabitToDelete(null)}
        onConfirm={() => {
          if (habitToDelete) {
            update((current) => deleteHabit(current, habitToDelete.id));
            notify("العادة اتحذفت", "info");
          }
          setHabitToDelete(null);
        }}
      />
    </div>
  );
}
