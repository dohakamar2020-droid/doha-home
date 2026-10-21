import { describe, expect, it } from "vitest";
import {
  calculateProgress,
  getUpcomingTask,
  isTaskCompleted,
  sortTasksByTime,
} from "@/lib/progress";
import type { Task, TaskCompletion } from "@/types/domain";

function makeTask(overrides: Partial<Task> & Pick<Task, "id" | "title">): Task {
  return {
    category: "home",
    priority: "medium",
    startTime: null,
    durationMinutes: null,
    recurrence: { type: "daily", startDate: "2026-10-01" },
    createdAt: "2026-10-01T08:00:00.000Z",
    ...overrides,
  };
}

const tasks: Task[] = [
  makeTask({ id: "a", title: "فطار", startTime: "08:00" }),
  makeTask({ id: "b", title: "غدا", startTime: "13:00" }),
  makeTask({ id: "c", title: "ترتيب", startTime: null }),
  makeTask({ id: "d", title: "عشا", startTime: "20:00" }),
];

const completions: TaskCompletion[] = [
  { id: "c1", taskId: "a", date: "2026-10-21", completedAt: "2026-10-21T08:10:00.000Z" },
];

describe("حالة الإكمال والتقدّم", () => {
  it("يعرف المهمة المكتملة في يوم معيّن فقط", () => {
    expect(isTaskCompleted(completions, "a", "2026-10-21")).toBe(true);
    expect(isTaskCompleted(completions, "a", "2026-10-22")).toBe(false);
    expect(isTaskCompleted(completions, "b", "2026-10-21")).toBe(false);
  });

  it("يحسب النسبة والعدد المتبقي", () => {
    const progress = calculateProgress(tasks, completions, "2026-10-21");
    expect(progress).toEqual({ total: 4, completed: 1, remaining: 3, percentage: 25 });
  });

  it("يرجع صفر بدون مهام بدون قسمة على صفر", () => {
    expect(calculateProgress([], [], "2026-10-21")).toEqual({
      total: 0,
      completed: 0,
      remaining: 0,
      percentage: 0,
    });
  });

  it("يكمل 100% لما كل المهام تخلص", () => {
    const all: TaskCompletion[] = tasks.map((task, index) => ({
      id: `c${index}`,
      taskId: task.id,
      date: "2026-10-21",
      completedAt: "2026-10-21T09:00:00.000Z",
    }));
    expect(calculateProgress(tasks, all, "2026-10-21").percentage).toBe(100);
  });

  it("يرتب المهام حسب الوقت والمهام من غير وقت في الآخر", () => {
    expect(sortTasksByTime(tasks).map((task) => task.id)).toEqual(["a", "b", "d", "c"]);
  });

  it("يختار أقرب مهمة قادمة غير مكتملة", () => {
    expect(getUpcomingTask(tasks, [], "2026-10-21", "12:00")?.id).toBe("b");
    expect(getUpcomingTask(tasks, [], "2026-10-21", "07:00")?.id).toBe("a");
    expect(getUpcomingTask(tasks, [], "2026-10-21", "22:00")?.id).toBe("a");
    expect(getUpcomingTask([], [], "2026-10-21", "22:00")).toBeNull();
  });
});
