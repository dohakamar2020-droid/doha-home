"use client";

import { useMemo, useState } from "react";
import { ChefHat, Pencil, Plus, RefreshCw, Sparkles, Trash2, UtensilsCrossed } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useToday } from "@/hooks/useToday";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MealForm } from "@/components/MealForm";
import { mealsForWeekday, primaryMeal, mealAlternatives } from "@/lib/meals";
import { addMealIdea, deleteMealIdea, rotateMealIdea, updateMealIdea } from "@/lib/operations";
import { formatDayLabel, orderedWeekdays, weekdayOf } from "@/lib/date";
import { WEEKDAY_LABELS } from "@/types/domain";
import type { MealIdea, Weekday } from "@/types/domain";

export function MealsView() {
  const { data, update, notify } = useStore();
  const today = useToday();
  const [formOpen, setFormOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealIdea | null>(null);
  const [defaultWeekday, setDefaultWeekday] = useState<Weekday>(() => weekdayOf(today));
  const [mealToDelete, setMealToDelete] = useState<MealIdea | null>(null);

  const days = useMemo(
    () => orderedWeekdays(data?.settings.weekStartsOn ?? 6),
    [data?.settings.weekStartsOn],
  );

  if (!data) return null;

  const todayWeekday = weekdayOf(today);
  const todayMeal = primaryMeal(data.meals, todayWeekday);
  const todayAlternatives = mealAlternatives(data.meals, todayWeekday);

  const openAdd = (weekday: Weekday) => {
    setEditingMeal(null);
    setDefaultWeekday(weekday);
    setFormOpen(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="غدا الأسبوع"
        title="غدا النهاردة إيه؟"
        subtitle="اقتراح جاهز لكل يوم وبدائل لو النفس اتغيّرت — كل حاجة قابلة للتعديل."
        actions={
          <button type="button" className="btn-primary" onClick={() => openAdd(todayWeekday)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            اقتراح جديد
          </button>
        }
      />

      <section className="card border-sage-200 bg-sage-50/60" aria-labelledby="today-meal-title">
        <p className="text-[11px] font-semibold text-sage-700">{formatDayLabel(today)}</p>
        <h2 id="today-meal-title" className="mt-1 flex items-center gap-2 text-lg font-bold text-ink">
          <ChefHat className="h-5 w-5 text-sage-600" aria-hidden="true" />
          {todayMeal ? todayMeal.title : "لسه مفيش اقتراح للنهاردة"}
        </h2>
        {todayMeal?.notes ? (
          <p className="mt-1 text-xs leading-6 text-ink-soft">{todayMeal.notes}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => {
              update((current) => rotateMealIdea(current, todayWeekday));
              notify("غيّرنا اقتراح النهاردة 🔄", "info");
            }}
            disabled={!todayMeal || todayAlternatives.length === 0}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            بدّلي الاقتراح
          </button>
          {todayMeal ? (
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => {
                setEditingMeal(todayMeal);
                setDefaultWeekday(todayMeal.weekday);
                setFormOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              تعديل
            </button>
          ) : null}
          <button type="button" className="btn-ghost btn-sm" onClick={() => openAdd(todayWeekday)}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            ضيفي بديل
          </button>
        </div>
        {todayAlternatives.length > 0 ? (
          <p className="mt-2 text-[11px] text-ink-soft">
            فيه {todayAlternatives.length} بديل لليوم ده — اضغطي «بدّلي الاقتراح» لو مش على مزاجك.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="week-meals-title">
        <h2 id="week-meals-title" className="mb-2 text-base font-bold text-ink">
          خطة الغدا للأسبوع
        </h2>

        {data.meals.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="مفيش اقتراحات غدا لسه"
            description="ضيفي أول أكلة وهنرتّبها على أيام الأسبوع."
            action={
              <button type="button" className="btn-primary btn-sm" onClick={() => openAdd(todayWeekday)}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                إضافة اقتراح
              </button>
            }
            compact
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {days.map((day) => {
              const dayMeals = mealsForWeekday(data.meals, day);
              const primary = dayMeals[0];
              const isToday = day === todayWeekday;
              return (
                <li
                  key={day}
                  className={`card-flat ${isToday ? "border-sage-400 bg-sage-50/50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-sage-700">
                        {WEEKDAY_LABELS[day]}
                        {isToday ? " • النهاردة" : ""}
                      </p>
                      <p className="mt-1 break-words text-sm font-bold text-ink">
                        {primary ? primary.title : "لسه فاضي"}
                      </p>
                      {primary?.notes ? (
                        <p className="mt-0.5 text-[11px] leading-5 text-ink-soft">{primary.notes}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className="icon-btn h-9 w-9"
                        onClick={() => openAdd(day)}
                        aria-label={`إضافة اقتراح ليوم ${WEEKDAY_LABELS[day]}`}
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      {primary ? (
                        <>
                          <button
                            type="button"
                            className="icon-btn h-9 w-9"
                            onClick={() => {
                              setEditingMeal(primary);
                              setDefaultWeekday(day);
                              setFormOpen(true);
                            }}
                            aria-label={`تعديل اقتراح ${WEEKDAY_LABELS[day]}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="icon-btn h-9 w-9 text-[#9C4451] hover:bg-[#FDF3F4]"
                            onClick={() => setMealToDelete(primary)}
                            aria-label={`حذف اقتراح ${WEEKDAY_LABELS[day]}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {dayMeals.length > 1 ? (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-ink-soft">بدائل:</span>
                      {dayMeals.slice(1).map((meal) => (
                        <span key={meal.id} className="chip max-w-full truncate">
                          {meal.title}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {dayMeals.length > 1 ? (
                    <button
                      type="button"
                      className="btn-ghost btn-sm mt-2"
                      onClick={() => {
                        update((current) => rotateMealIdea(current, day));
                        notify(`بدّلنا اقتراح ${WEEKDAY_LABELS[day]}`, "info");
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      بدّلي الترتيب
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="flex items-start gap-2 rounded-2xl bg-white/70 p-3 text-[11px] leading-6 text-ink-soft">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" aria-hidden="true" />
        الاقتراح الأساسي هو أول أكلة في اليوم. «بدّلي» بتلفّ الترتيب بدون ما تحذف حاجة،
        وكل الاقتراحات محفوظة على جهازك بس.
      </p>

      <MealForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingMeal(null);
        }}
        initialMeal={editingMeal}
        defaultWeekday={defaultWeekday}
        weekStartsOn={data.settings.weekStartsOn}
        onSubmit={(values) => {
          if (editingMeal) {
            update((current) => updateMealIdea(current, editingMeal.id, values));
            notify("الاقتراح اتعدّل ✅");
          } else {
            update((current) => addMealIdea(current, values).data);
            notify("اقتراح غدا جديد اتضاف 🍲");
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(mealToDelete)}
        title="تحذفي الاقتراح؟"
        description={`«${mealToDelete?.title ?? ""}» هيتشال من خطة الغدا.`}
        confirmLabel="احذفي"
        danger
        onCancel={() => setMealToDelete(null)}
        onConfirm={() => {
          if (mealToDelete) {
            update((current) => deleteMealIdea(current, mealToDelete.id));
            notify("الاقتراح اتحذف", "info");
          }
          setMealToDelete(null);
        }}
      />
    </div>
  );
}
