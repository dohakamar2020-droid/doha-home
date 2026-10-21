import { describe, expect, it } from "vitest";
import {
  calculateBestHabitStreak,
  calculateHabitStreak,
  habitWeekProgress,
  isHabitCompleted,
} from "@/lib/habits";
import { weekDates } from "@/lib/date";
import type { Habit, HabitCompletion, IsoDate } from "@/types/domain";

const habit: Habit = {
  id: "h1",
  name: "شرب ميه",
  weekdays: [0, 1, 2, 3, 4, 6], // كل الأيام ما عدا الجمعة
  createdAt: "2026-10-01T08:00:00.000Z",
};

function completionsFor(dates: IsoDate[]): HabitCompletion[] {
  return dates.map((date, index) => ({
    id: `c${index}`,
    habitId: "h1",
    date,
    completedAt: `${date}T09:00:00.000Z`,
  }));
}

describe("سلسلة العادات", () => {
  it("بتحسب الأيام المتتالية المكتملة", () => {
    const completions = completionsFor(["2026-10-19", "2026-10-20", "2026-10-21"]);
    expect(calculateHabitStreak(habit, completions, "2026-10-21")).toBe(3);
  });

  it("اليوم الحالي غير المكتمل مايكسرش السلسلة", () => {
    const completions = completionsFor(["2026-10-19", "2026-10-20"]);
    expect(calculateHabitStreak(habit, completions, "2026-10-21")).toBe(2);
  });

  it("اليوم الفائت المجدول غير المكتمل بيكسر السلسلة", () => {
    const completions = completionsFor(["2026-10-18", "2026-10-19"]);
    expect(calculateHabitStreak(habit, completions, "2026-10-21")).toBe(0);
  });

  it("اليوم غير المجدول لا يكسر السلسلة ولا يُحسب", () => {
    // الجمعة 2026-10-23 غير مجدولة — لو اليوم 24 سبت ومكتمل، السلسلة تكمل
    const habitNoFriday = habit;
    const completions = completionsFor(["2026-10-21", "2026-10-22", "2026-10-24"]);
    // اليوم 2026-10-23 جمعة (غير مجدولة) والمرجع 24
    expect(habitNoFriday.weekdays).not.toContain(5);
    expect(calculateHabitStreak(habitNoFriday, completions, "2026-10-24")).toBe(3);
  });

  it("العادة الجديدة بدون سجل سلسلتها صفر", () => {
    expect(calculateHabitStreak(habit, [], "2026-10-21")).toBe(0);
  });

  it("السلسلة متقفش قبل تاريخ إنشاء العادة", () => {
    const newHabit: Habit = {
      ...habit,
      createdAt: "2026-10-19T08:00:00.000Z",
      weekdays: [0, 1, 2, 3, 4, 5, 6],
    };
    const completions = completionsFor(["2026-10-19", "2026-10-20", "2026-10-21"]);
    expect(calculateHabitStreak(newHabit, completions, "2026-10-21")).toBe(3);
  });

  it("أفضل سلسلة تاريخية", () => {
    const completions = completionsFor([
      "2026-10-10",
      "2026-10-11",
      "2026-10-12",
      "2026-10-19",
    ]);
    const best = calculateBestHabitStreak(habit, completions, "2026-10-21");
    expect(best.length).toBe(3);
    expect(best.endDate).toBe("2026-10-12");
  });

  it("تقدّم الأسبوع يحسب الأيام المجدولة اللي فاتت بس", () => {
    const week = weekDates("2026-10-21", 6); // 17 → 23
    const completions = completionsFor(["2026-10-18", "2026-10-20"]);
    // الأيام المجدولة حتى 2026-10-21: 17،18،19،20،21 (الجمعة 23 لسه)، لكن 23 بعد اليوم فمش محسوبة
    const progress = habitWeekProgress(habit, completions, week, "2026-10-21");
    expect(progress.scheduled).toBe(5);
    expect(progress.completed).toBe(2);
    expect(progress.percentage).toBe(40);
  });

  it("يتحقق من إكمال العادة في يوم محدد", () => {
    const completions = completionsFor(["2026-10-21"]);
    expect(isHabitCompleted(completions, "h1", "2026-10-21")).toBe(true);
    expect(isHabitCompleted(completions, "h1", "2026-10-20")).toBe(false);
  });
});
