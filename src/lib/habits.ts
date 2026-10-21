import type { Habit, HabitCompletion, IsoDate } from "@/types/domain";
import { addDays, isAfter, isBefore, weekdayOf } from "@/lib/date";
import { isHabitScheduledOn } from "@/lib/recurrence";

export function habitCompletionSet(completions: readonly HabitCompletion[], habitId: string): Set<IsoDate> {
  return new Set(
    completions.filter((completion) => completion.habitId === habitId).map((item) => item.date),
  );
}

export function isHabitCompleted(
  completions: readonly HabitCompletion[],
  habitId: string,
  date: IsoDate,
): boolean {
  return completions.some((completion) => completion.habitId === habitId && completion.date === date);
}

/**
 * السلسلة الحالية: عدد الأيام المجدولة المتتالية المكتملة.
 * - الأيام غير المجدولة لا تُحسب ولا تقطع السلسلة.
 * - عدم إكمال "النهاردة" لا يقطع السلسلة لأن اليوم لسه ما خلصش.
 * - قبل إنشاء العادة لا يوجد تكليف، فالسلسلة تقف عند تاريخ الإنشاء.
 */
export function calculateHabitStreak(
  habit: Habit,
  completions: readonly HabitCompletion[],
  today: IsoDate,
  maxLookbackDays = 730,
): number {
  const completedDates = habitCompletionSet(completions, habit.id);
  const createdDate = habit.createdAt.slice(0, 10);
  let streak = 0;
  let cursor = today;

  for (let index = 0; index < maxLookbackDays; index += 1) {
    if (isBefore(cursor, createdDate)) break;
    if (habit.weekdays.includes(weekdayOf(cursor))) {
      if (completedDates.has(cursor)) {
        streak += 1;
      } else if (cursor !== today) {
        // يوم مجدول وعدّى من غير إكمال → السلسلة اتكسرت
        break;
      }
    }
    // الأيام غير المجدولة تتخطى بدون كسر السلسلة
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export interface HabitWeekProgress {
  scheduled: number;
  completed: number;
  percentage: number;
}

/** تقدّم العادة داخل أسبوع معيّن (أيام الأسبوع مرتبة) */
export function habitWeekProgress(
  habit: Habit,
  completions: readonly HabitCompletion[],
  weekDates: readonly IsoDate[],
  today: IsoDate,
): HabitWeekProgress {
  const completedDates = habitCompletionSet(completions, habit.id);
  const relevant = weekDates.filter(
    (date) => !isAfter(date, today) && isHabitScheduledOn(habit, date),
  );
  const scheduled = relevant.length;
  const completed = relevant.filter((date) => completedDates.has(date)).length;
  const percentage = scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);
  return { scheduled, completed, percentage };
}

/** عدد المرات المكتملة للعادة داخل مدى (اختياري للعرض) */
export function habitCompletedInRange(
  habitId: string,
  completions: readonly HabitCompletion[],
  start: IsoDate,
  end: IsoDate,
): number {
  return completions.filter(
    (completion) =>
      completion.habitId === habitId && !isBefore(completion.date, start) && !isAfter(completion.date, end),
  ).length;
}

/** أفضل سلسلة تاريخية (للعرض في تفاصيل العادة) */
export function calculateBestHabitStreak(
  habit: Habit,
  completions: readonly HabitCompletion[],
  today: IsoDate,
  maxLookbackDays = 365,
): { length: number; endDate: IsoDate | null } {
  const completedDates = habitCompletionSet(completions, habit.id);
  let best = 0;
  let bestEnd: IsoDate | null = null;
  let cursor = today;
  let running = 0;
  let runEnd: IsoDate | null = null;

  for (let index = 0; index < maxLookbackDays; index += 1) {
    if (isBefore(cursor, habit.createdAt.slice(0, 10))) break;
    if (habit.weekdays.includes(weekdayOf(cursor))) {
      if (completedDates.has(cursor)) {
        if (running === 0) runEnd = cursor;
        running += 1;
        if (running > best) {
          best = running;
          bestEnd = runEnd;
        }
      } else if (cursor !== today) {
        running = 0;
        runEnd = null;
      }
    }
    cursor = addDays(cursor, -1);
  }

  return { length: best, endDate: bestEnd };
}
