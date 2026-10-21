import { describe, expect, it } from "vitest";
import { createEmptyData } from "@/lib/defaults";
import {
  addCleaningTask,
  addHabit,
  addRoom,
  addTask,
  completeOnboarding,
  deleteHabit,
  deleteTask,
  lastCleaningCompletionDate,
  rescheduleTask,
  resetAll,
  toggleCleaningCompletion,
  toggleHabitCompletion,
  toggleTaskCompletion,
  updateTask,
} from "@/lib/operations";
import type { AppData, TaskInput } from "@/types/domain";

const taskInput: TaskInput = {
  title: "تجهيز الغدا",
  notes: "خضار وسلطة",
  category: "kitchen",
  priority: "high",
  startTime: "13:00",
  durationMinutes: 45,
  recurrence: { type: "daily", startDate: "2026-10-21" },
};

function withTask(): { data: AppData; taskId: string } {
  const result = addTask(createEmptyData(), taskInput);
  return { data: result.data, taskId: result.task.id };
}

describe("عمليات المهام", () => {
  it("يضيف مهمة بمعرّف مستقر وبلا تعديل للأصل", () => {
    const base = createEmptyData();
    const { data, task } = addTask(base, taskInput);
    expect(base.tasks).toHaveLength(0);
    expect(task.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(data.tasks).toHaveLength(1);
    expect(data.tasks[0]?.title).toBe("تجهيز الغدا");
    expect(data.tasks[0]?.startTime).toBe("13:00");
  });

  it("يكمل ويلغي الإكمال في نفس اليوم بدون لمس الأيام التانية", () => {
    const { data, taskId } = withTask();
    const completed = toggleTaskCompletion(data, taskId, "2026-10-21");
    expect(completed.taskCompletions).toHaveLength(1);
    expect(completed.taskCompletions[0]?.date).toBe("2026-10-21");

    const otherDay = toggleTaskCompletion(completed, taskId, "2026-10-22");
    expect(otherDay.taskCompletions).toHaveLength(2);

    const undone = toggleTaskCompletion(otherDay, taskId, "2026-10-21");
    expect(undone.taskCompletions).toHaveLength(1);
    expect(undone.taskCompletions[0]?.date).toBe("2026-10-22");
  });

  it("إكمال يوم مش بيكمّل الأيام الجاية", () => {
    const { data, taskId } = withTask();
    const completed = toggleTaskCompletion(data, taskId, "2026-10-21");
    expect(
      completed.taskCompletions.some((completion) => completion.date === "2026-10-22"),
    ).toBe(false);
  });

  it("التعديل بيحافظ على سجلات الإكمال التاريخية", () => {
    const { data, taskId } = withTask();
    const completed = toggleTaskCompletion(data, taskId, "2026-10-21");
    const edited = updateTask(completed, taskId, { ...taskInput, title: "غدا العيلة" });
    expect(edited.taskCompletions).toHaveLength(1);
    expect(edited.tasks[0]?.title).toBe("غدا العيلة");
  });

  it("الحذف بيشيل المهمة وسجلاتها بس", () => {
    const { data, taskId } = withTask();
    const second = addTask(data, { ...taskInput, title: "مهمة تانية" });
    const completed = toggleTaskCompletion(second.data, taskId, "2026-10-21");
    const afterDelete = deleteTask(completed, taskId);
    expect(afterDelete.tasks).toHaveLength(1);
    expect(afterDelete.tasks[0]?.title).toBe("مهمة تانية");
    expect(afterDelete.taskCompletions).toHaveLength(0);
  });

  it("إعادة جدولة مهمة لمرة واحدة بتغيّر تاريخها", () => {
    const { data, taskId } = withTask();
    const once = updateTask(data, taskId, {
      ...taskInput,
      recurrence: { type: "once", date: "2026-10-21" },
    });
    const moved = rescheduleTask(once, taskId, "2026-10-25");
    expect(moved.tasks[0]?.recurrence).toEqual({ type: "once", date: "2026-10-25" });
  });

  it("إعادة جدولة مهمة شهرية بتغيّر يوم الشهر", () => {
    const { data, taskId } = withTask();
    const monthly = updateTask(data, taskId, {
      ...taskInput,
      recurrence: { type: "monthly", startDate: "2026-10-21", dayOfMonth: 21 },
    });
    const moved = rescheduleTask(monthly, taskId, "2026-11-05");
    expect(moved.tasks[0]?.recurrence).toEqual({
      type: "monthly",
      startDate: "2026-10-21",
      dayOfMonth: 5,
    });
  });
});

describe("عمليات التنظيف", () => {
  it("يضيف غرفة ويحذفها مع مهامها", () => {
    const { data, room } = addRoom(createEmptyData(), "أوضة الأطفال", "🧸");
    expect(data.rooms.some((item) => item.id === room.id)).toBe(true);
    const withCleaning = addCleaningTask(data, {
      roomId: room.id,
      title: "ترتيب اللعب",
      frequency: "daily",
    });
    const toggled = toggleCleaningCompletion(withCleaning.data, withCleaning.id, "2026-10-21");
    expect(lastCleaningCompletionDate(toggled, withCleaning.id)).toBe("2026-10-21");
  });

  it("يعمل toggle لإكمال التنظيف", () => {
    const data = createEmptyData();
    const cleaningTask = data.cleaningTasks[0];
    expect(cleaningTask).toBeDefined();
    if (!cleaningTask) return;
    const done = toggleCleaningCompletion(data, cleaningTask.id, "2026-10-21");
    expect(done.cleaningCompletions).toHaveLength(1);
    const undone = toggleCleaningCompletion(done, cleaningTask.id, "2026-10-21");
    expect(undone.cleaningCompletions).toHaveLength(0);
  });
});

describe("عمليات العادات", () => {
  it("يضيف عادة ويسجّل إنجازها ويحذفها", () => {
    const { data, id } = addHabit(createEmptyData(), {
      name: "قراءة",
      weekdays: [1, 2, 3],
    });
    expect(data.habits[0]?.weekdays).toEqual([1, 2, 3]);
    const done = toggleHabitCompletion(data, id, "2026-10-21");
    expect(done.habitCompletions).toHaveLength(1);
    const removed = deleteHabit(done, id);
    expect(removed.habits).toHaveLength(0);
    expect(removed.habitCompletions).toHaveLength(0);
  });
});

describe("الإعداد والتصفير", () => {
  it("إكمال الإعداد مرة واحدة لا يمسح البيانات الحالية", () => {
    const { data } = withTask();
    const settings = {
      displayName: "دعاء",
      wakeUpTime: "06:00",
      bedTime: "22:00",
      weekStartsOn: 6 as const,
      routineTemplate: "calm" as const,
    };
    const onboarded = completeOnboarding(data, settings);
    expect(onboarded.settings.onboardingCompleted).toBe(true);
    expect(onboarded.tasks).toHaveLength(1);
    const again = completeOnboarding(onboarded, { ...settings, displayName: "تاني" });
    expect(again.tasks).toHaveLength(1);
    expect(again.settings.displayName).toBe("تاني");
  });

  it("التصفير يرجع بيانات البداية", () => {
    const { data } = withTask();
    const fresh = resetAll();
    expect(fresh.tasks).toHaveLength(0);
    expect(fresh.settings.onboardingCompleted).toBe(false);
    expect(fresh.rooms.length).toBe(6);
    expect(data.tasks).toHaveLength(1);
  });
});
