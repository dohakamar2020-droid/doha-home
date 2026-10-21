import { describe, expect, it } from "vitest";
import {
  HOUSE_PLAN_CLEANING,
  HOUSE_PLAN_VERSION,
  applyHousePlan,
  buildPlanCleaningTasks,
  buildPlanTasks,
} from "@/data/housePlan";
import { MEAL_SEEDS, buildDefaultMeals } from "@/data/meals";
import { ADHKAR_ITEMS, adhkarForPeriod } from "@/data/adhkar";
import { createDefaultRooms } from "@/data/rooms";
import { createEmptyData, DATA_VERSION } from "@/lib/defaults";
import {
  addMealIdea,
  deleteMealIdea,
  incrementAdhkar,
  rotateMealIdea,
  resetAdhkar,
  setAdhkarCount,
  updateMealIdea,
  getAdhkarCount,
} from "@/lib/operations";
import { adhkarSummary, suggestedPeriod } from "@/lib/adhkar";
import { addDays, todayIso, weekdayOf } from "@/lib/date";
import type { AppData } from "@/types/domain";

const TODAY = todayIso();

function onboardedData(): AppData {
  const base = createEmptyData();
  return {
    ...base,
    settings: { ...base.settings, onboardingCompleted: true, housePlanVersion: 0 },
  };
}

describe("خطة البيت", () => {
  it("بتكوّن مهام تنظيف لكل عنصر في الخطة وغسيل مرتين في الأسبوع", () => {
    const rooms = createDefaultRooms();
    const cleaning = buildPlanCleaningTasks(rooms, TODAY);
    expect(cleaning).toHaveLength(HOUSE_PLAN_CLEANING.length);
    const laundryTwice = cleaning.filter(
      (task) => task.frequency === "weekly" && task.title.includes("غسيل الملابس"),
    );
    expect(laundryTwice).toHaveLength(2);
    expect(laundryTwice.map((task) => task.weekday).sort()).toEqual([0, 3]);
  });

  it("يوم التلات فيه تنظيف شامل، وكل يوم ليها تنظيف عميق لأوضة", () => {
    const deepDays = HOUSE_PLAN_CLEANING.filter((item) => item.title.startsWith("تنظيف عميق:"));
    expect(deepDays).toHaveLength(6);
    const wholeHouse = HOUSE_PLAN_CLEANING.find((item) => item.planKey === "v2-whole-house-deep");
    expect(wholeHouse?.weekday).toBe(2);
    const weekdays = deepDays.map((item) => item.weekday);
    expect(new Set(weekdays).size).toBe(6); // كل أوضة ليوم مختلف
  });

  it("مهام العبادة بتتولد بوقت الفجر وقيام قبل النوم", () => {
    const tasks = buildPlanTasks(TODAY, "23:00");
    const fajr = tasks.find((task) => task.planKey === "v2-fajr-worship");
    const qiyam = tasks.find((task) => task.planKey === "v2-qiyam");
    expect(fajr?.startTime).toBe("05:00");
    expect(qiyam?.startTime).toBe("22:30"); // 23:00 ناقص 30 دقيقة
    expect(tasks.every((task) => task.recurrence.type === "daily")).toBe(true);
  });

  it("applyHousePlan بيحوّل مهام التنظيف الافتراضية بدل ما يكررها", () => {
    const data = createEmptyData(); // فيها مهام التنظيف الافتراضية القديمة
    const before = data.cleaningTasks.length;
    const planned = applyHousePlan(data, TODAY);
    expect(planned.settings.housePlanVersion).toBe(HOUSE_PLAN_VERSION);
    // مهام افتراضية اتحوّلت + مهام خطة جديدة، من غير تكرار للعناوين المحوّلة
    expect(planned.cleaningTasks.length).toBeLessThan(before + HOUSE_PLAN_CLEANING.length);
    const titles = planned.cleaningTasks.map((task) => task.title);
    expect(new Set(titles).size).toBe(titles.length);
    // غسيل مرتين موجود
    expect(titles.filter((title) => title.includes("غسيل الملابس"))).toHaveLength(2);
    // مهام العبادة اتضافت
    expect(planned.tasks.some((task) => task.planKey === "v2-fajr-worship")).toBe(true);
  });

  it("تطبيق الخطة مرتين مبيضاعفش حاجة", () => {
    let data = applyHousePlan(onboardedData(), TODAY);
    const tasksAfterFirst = data.tasks.length;
    const cleaningAfterFirst = data.cleaningTasks.length;
    data = applyHousePlan(data, TODAY);
    expect(data.tasks).toHaveLength(tasksAfterFirst);
    expect(data.cleaningTasks).toHaveLength(cleaningAfterFirst);
  });

  it("في الترحيل، الخطة ما بتتطبقش غير لما الإعداد يكون مكتمل", async () => {
    const { migrateRawData } = await import("@/lib/storage");
    const legacy = (completed: boolean) => ({
      version: 1,
      settings: { displayName: "دعاء", onboardingCompleted: completed },
      tasks: [],
      taskCompletions: [],
      rooms: [],
      cleaningTasks: [],
      cleaningCompletions: [],
      habits: [],
      habitCompletions: [],
    });

    const notOnboarded = migrateRawData(legacy(false));
    expect(notOnboarded.ok).toBe(true);
    if (notOnboarded.ok) {
      const data = notOnboarded.data as { settings: { housePlanVersion: number }; tasks: unknown[] };
      expect(data.settings.housePlanVersion).toBe(0);
      expect(data.tasks).toHaveLength(0);
    }

    const onboarded = migrateRawData(legacy(true));
    expect(onboarded.ok).toBe(true);
    if (onboarded.ok) {
      const data = onboarded.data as { settings: { housePlanVersion: number }; tasks: { planKey?: string }[] };
      expect(data.settings.housePlanVersion).toBe(HOUSE_PLAN_VERSION);
      expect(data.tasks.length).toBeGreaterThan(0);
    }
  });

  it("النسخة الحالية (version 2) مطابقة لثبات البيانات", () => {
    expect(DATA_VERSION).toBe(2);
  });
});

describe("اقتراحات الغدا", () => {
  it("فيه 21 اقتراح افتراضي (3 لكل يوم) وقابل للبناء", () => {
    const meals = buildDefaultMeals("2026-10-21T10:00:00.000Z");
    expect(meals).toHaveLength(MEAL_SEEDS.length);
    expect(meals).toHaveLength(21);
    for (const day of [0, 1, 2, 3, 4, 5, 6]) {
      expect(meals.filter((meal) => meal.weekday === day)).toHaveLength(3);
    }
  });

  it("إضافة وتعديل وحذف اقتراح بدون تعديل الأصل", () => {
    const data = createEmptyData();
    const added = addMealIdea(data, { weekday: 2, title: "شوربة لسان عصفور" });
    expect(added.data.meals).toHaveLength(data.meals.length + 1);
    expect(added.data).not.toBe(data);

    const meal = added.data.meals.at(-1);
    if (!meal) throw new Error("الاقتراح المضاف مش موجود");
    const updated = updateMealIdea(added.data, meal.id, {
      weekday: 3,
      title: "شوربة شعريّة",
      notes: "خفيفة",
    });
    const found = updated.meals.find((item) => item.id === meal.id);
    expect(found?.weekday).toBe(3);
    expect(found?.title).toBe("شوربة شعريّة");

    const removed = deleteMealIdea(updated, meal.id);
    expect(removed.meals.some((item) => item.id === meal.id)).toBe(false);
  });

  it("«بدّلي» بتلفّ ترتيب اليوم من غير حذف وبغير تأثير على باقي الأيام", () => {
    const data = createEmptyData();
    const day = weekdayOf(TODAY);
    const rotated = rotateMealIdea(data, day);
    const before = data.meals.filter((meal) => meal.weekday === day).map((meal) => meal.id);
    const after = rotated.meals.filter((meal) => meal.weekday === day).map((meal) => meal.id);
    expect(after[0]).toBe(before[1]);
    expect(after).toHaveLength(before.length);
    // الأيام التانية زي ما هي
    expect(
      rotated.meals.filter((meal) => meal.weekday !== day).map((meal) => meal.id),
    ).toEqual(data.meals.filter((meal) => meal.weekday !== day).map((meal) => meal.id));
    // يوم فيه اقتراح واحد بس: مفيش تدوير
    const single = rotateMealIdea(
      { ...data, meals: data.meals.filter((meal) => meal.weekday !== day) },
      day,
    );
    expect(single.meals).toEqual(data.meals.filter((meal) => meal.weekday !== day));
  });
});

describe("عدّاد الأذكار", () => {
  it("فيه أذكار صباح ومساء والأعداد معقولة", () => {
    const morning = adhkarForPeriod("morning");
    const evening = adhkarForPeriod("evening");
    expect(morning.length).toBeGreaterThanOrEqual(6);
    expect(evening.length).toBeGreaterThanOrEqual(6);
    expect(ADHKAR_ITEMS.every((item) => item.repeat >= 1)).toBe(true);
  });

  it("العدّاد بيزيد بالخطوة وبيقف عند الهدف وبيتصفّر", () => {
    const data = createEmptyData();
    const input = { itemId: "morning-hasbiya", period: "morning" as const, date: TODAY };
    const once = incrementAdhkar(data, { ...input, step: 1, target: 7 });
    expect(getAdhkarCount(once, input.itemId, TODAY)).toBe(1);
    const tenTimes = incrementAdhkar(once, { ...input, step: 10, target: 7 });
    expect(getAdhkarCount(tenTimes, input.itemId, TODAY)).toBe(7); // بيقف عند الهدف
    const cleared = resetAdhkar(tenTimes, input);
    expect(getAdhkarCount(cleared, input.itemId, TODAY)).toBe(0);
    expect(cleared.adhkarProgress).toHaveLength(0); // التصفير بيشيل السجل
  });

  it("العدّاد بيتسجّل لكل يوم لوحده والملخص بيحسب الصح", () => {
    let data = createEmptyData();
    const input = { itemId: "morning-hasbiya", period: "morning" as const };
    data = incrementAdhkar(data, { ...input, date: TODAY, step: 7, target: 7 });
    const tomorrow = addDays(TODAY, 1);
    expect(getAdhkarCount(data, input.itemId, tomorrow)).toBe(0);

    const summary = adhkarSummary(data.adhkarProgress, "morning", TODAY);
    expect(summary.completed).toBe(1);
    expect(summary.total).toBe(adhkarForPeriod("morning").length);
    expect(summary.remaining).toBe(summary.total - 1);
  });

  it("setAdhkarCount بصفر بيشيل السجل وبيحافظ على الثبات", () => {
    const data = createEmptyData();
    const input = { itemId: "evening-istighfar", period: "evening" as const, date: TODAY };
    const set = setAdhkarCount(data, input, 50);
    expect(getAdhkarCount(set, input.itemId, TODAY)).toBe(50);
    const same = setAdhkarCount(set, input, 50);
    expect(same.adhkarProgress).toHaveLength(1); // نفس القيمة مبيزودش سجلات
    const zeroed = setAdhkarCount(same, input, 0);
    expect(zeroed.adhkarProgress).toHaveLength(0);
    // قيمة أعلى من الحد بتتحسم لـ 1000
    const capped = setAdhkarCount(data, input, 5000);
    expect(getAdhkarCount(capped, input.itemId, TODAY)).toBe(1000);
  });

  it("الوقت المقترح: الصباح قبل العصر والمساء بعده", () => {
    expect(suggestedPeriod(6)).toBe("morning");
    expect(suggestedPeriod(12)).toBe("morning");
    expect(suggestedPeriod(16)).toBe("evening");
    expect(suggestedPeriod(2)).toBe("evening");
  });
});
