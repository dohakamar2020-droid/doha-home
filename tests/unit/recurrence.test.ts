import { describe, expect, it } from "vitest";
import {
  isCleaningScheduledOn,
  isHabitScheduledOn,
  nextCleaningDate,
  nextOccurrenceAfter,
  occursOn,
  previousCleaningDate,
  recurrenceOccursOn,
} from "@/lib/recurrence";
import type { CleaningTask, Habit, Recurrence, Task } from "@/types/domain";

const baseTask: Task = {
  id: "t1",
  title: "مهمة",
  category: "home",
  priority: "medium",
  startTime: null,
  durationMinutes: null,
  recurrence: { type: "daily", startDate: "2026-10-01" },
  createdAt: "2026-10-01T08:00:00.000Z",
};

describe("قواعد التكرار", () => {
  it("المهمة لمرة واحدة تظهر في يومها فقط", () => {
    const task: Task = {
      ...baseTask,
      recurrence: { type: "once", date: "2026-10-21" },
    };
    expect(occursOn(task, "2026-10-21")).toBe(true);
    expect(occursOn(task, "2026-10-22")).toBe(false);
    expect(occursOn(task, "2026-10-20")).toBe(false);
  });

  it("التكرار اليومي يبدأ من تاريخ البداية (شامل)", () => {
    const recurrence = { type: "daily" as const, startDate: "2026-10-21" };
    expect(recurrenceOccursOn(recurrence, "2026-10-20")).toBe(false);
    expect(recurrenceOccursOn(recurrence, "2026-10-21")).toBe(true);
    expect(recurrenceOccursOn(recurrence, "2027-03-15")).toBe(true);
  });

  it("التكرار اليومي يحترم تاريخ النهاية", () => {
    const recurrence = {
      type: "daily" as const,
      startDate: "2026-10-01",
      endDate: "2026-10-05",
    };
    expect(recurrenceOccursOn(recurrence, "2026-10-05")).toBe(true);
    expect(recurrenceOccursOn(recurrence, "2026-10-06")).toBe(false);
  });

  it("التكرار الأسبوعي يظهر في الأيام المختارة فقط", () => {
    // 2026-10-17 سبت (6)، و2026-10-21 أربع (3)
    const recurrence: Recurrence = {
      type: "weekly",
      startDate: "2026-10-17",
      weekdays: [6, 3],
    };
    const days = ["2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21"];
    expect(days.filter((day) => recurrenceOccursOn(recurrence, day))).toEqual([
      "2026-10-17",
      "2026-10-21",
    ]);
    expect(recurrenceOccursOn(recurrence, "2026-10-10")).toBe(false);
  });

  it("التكرار الشهري يوم 15 يظهر في الشهر نفسه", () => {
    const recurrence = { type: "monthly" as const, startDate: "2026-10-01", dayOfMonth: 15 };
    expect(recurrenceOccursOn(recurrence, "2026-10-15")).toBe(true);
    expect(recurrenceOccursOn(recurrence, "2026-11-15")).toBe(true);
    expect(recurrenceOccursOn(recurrence, "2026-11-16")).toBe(false);
  });

  it("التكرار الشهري يوم 31 يتحول لآخر يوم في الشهر القصير", () => {
    const recurrence = { type: "monthly" as const, startDate: "2026-01-01", dayOfMonth: 31 };
    expect(recurrenceOccursOn(recurrence, "2026-01-31")).toBe(true);
    expect(recurrenceOccursOn(recurrence, "2026-02-28")).toBe(true);
    expect(recurrenceOccursOn(recurrence, "2026-02-27")).toBe(false);
    expect(recurrenceOccursOn(recurrence, "2026-04-30")).toBe(true);
    expect(recurrenceOccursOn(recurrence, "2026-04-29")).toBe(false);
  });

  it("التكرار الشهري في سنة كبيسة يحسب 29 فبراير", () => {
    const recurrence = { type: "monthly" as const, startDate: "2024-01-01", dayOfMonth: 31 };
    expect(recurrenceOccursOn(recurrence, "2024-02-29")).toBe(true);
    expect(recurrenceOccursOn(recurrence, "2024-02-28")).toBe(false);
  });

  it("يحسب أول موعد قادم بعد تاريخ معيّن", () => {
    const task: Task = {
      ...baseTask,
      recurrence: { type: "weekly", startDate: "2026-10-17", weekdays: [6] },
    };
    expect(nextOccurrenceAfter(task, "2026-10-17")).toBe("2026-10-24");
    expect(nextOccurrenceAfter(task, "2026-10-18")).toBe("2026-10-24");
  });

  it("لا يولّد نسخًا غير محدودة — الحساب عند الطلب فقط", () => {
    const recurrence = { type: "daily" as const, startDate: "2020-01-01" };
    expect(recurrenceOccursOn(recurrence, "2026-10-21")).toBe(true);
    expect(recurrenceOccursOn(recurrence, "2019-12-31")).toBe(false);
  });
});

describe("جدولة التنظيف", () => {
  const weeklyTask: CleaningTask = {
    id: "c1",
    roomId: "room-1",
    title: "غسل الحمام",
    frequency: "weekly",
    weekday: 6,
    dayOfMonth: null,
    startDate: "2026-10-01",
    createdAt: "2026-10-01T08:00:00.000Z",
  };

  it("المهمة الأسبوعية بتظهر في يومها", () => {
    expect(isCleaningScheduledOn(weeklyTask, "2026-10-17")).toBe(true);
    expect(isCleaningScheduledOn(weeklyTask, "2026-10-18")).toBe(false);
    expect(isCleaningScheduledOn(weeklyTask, "2026-09-26")).toBe(false);
  });

  it("الموعد القادم والسابق بيتحسبوا صح", () => {
    expect(nextCleaningDate(weeklyTask, "2026-10-18")).toBe("2026-10-24");
    expect(previousCleaningDate(weeklyTask, "2026-10-18")).toBe("2026-10-17");
  });

  it("المهمة الشهرية يوم 31 بتتحسب آخر الشهر", () => {
    const monthly: CleaningTask = {
      ...weeklyTask,
      frequency: "monthly",
      weekday: null,
      dayOfMonth: 31,
      startDate: "2026-01-01",
    };
    expect(isCleaningScheduledOn(monthly, "2026-02-28")).toBe(true);
    expect(nextCleaningDate(monthly, "2026-02-01")).toBe("2026-02-28");
  });
});

describe("جدولة العادات", () => {
  const habit: Habit = {
    id: "h1",
    name: "مشي",
    weekdays: [0, 2],
    createdAt: "2026-10-01T08:00:00.000Z",
  };

  it("بتظهر في الأيام المختارة فقط", () => {
    expect(isHabitScheduledOn(habit, "2026-10-20")).toBe(true); // التلات
    expect(isHabitScheduledOn(habit, "2026-10-18")).toBe(true); // الحد
    expect(isHabitScheduledOn(habit, "2026-10-21")).toBe(false); // الأربع
  });

  it("قبل تاريخ إنشاء العادة مش مجدولة", () => {
    expect(isHabitScheduledOn(habit, "2026-09-29")).toBe(false);
  });
});
