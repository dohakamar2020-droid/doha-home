import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  STORAGE_KEY,
  clearStoredData,
  loadData,
  migrateRawData,
  parseStoredData,
  saveData,
} from "@/lib/storage";
import { createEmptyData, DATA_VERSION, DEFAULT_SETTINGS } from "@/lib/defaults";
import { addTask } from "@/lib/operations";

describe("خدمة التخزين", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("يرجع empty لو مفيش بيانات محفوظة", () => {
    expect(loadData().status).toBe("empty");
  });

  it("يحفظ ويقرا البيانات بنجاح", () => {
    const data = addTask(createEmptyData(), {
      title: "مهمة تجريبية",
      category: "home",
      priority: "medium",
      recurrence: { type: "once", date: "2026-10-21" },
    }).data;
    expect(saveData(data).ok).toBe(true);
    const loaded = loadData();
    expect(loaded.status).toBe("ok");
    if (loaded.status === "ok") {
      expect(loaded.data.tasks).toHaveLength(1);
      expect(loaded.data.tasks[0]?.title).toBe("مهمة تجريبية");
      expect(loaded.migrated).toBe(false);
    }
  });

  it("يرجع corrupted للـ JSON التالف", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    const result = loadData();
    expect(result.status).toBe("corrupted");
  });

  it("يرفض البيانات الغلط في المخطط", () => {
    // version 2 = الشكل الحالي، فمفيش ترحيل يصلّح البيانات الغلط
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, settings: "مش إعدادات", meals: 5 }),
    );
    const result = loadData();
    expect(result.status).toBe("corrupted");
    if (result.status === "corrupted") {
      expect(result.message).toContain("غير صالحة");
    }
  });

  it("يرحّل الإصدار القديم (0) للشكل الحالي", () => {
    const legacy = { tasks: [], settings: { displayName: "دعاء" } };
    const migrated = migrateRawData(legacy);
    expect(migrated.ok).toBe(true);
    if (migrated.ok) {
      const data = migrated.data as {
        version: number;
        settings: { weekStartsOn: number; housePlanVersion: number };
        meals: unknown[];
        adhkarProgress: unknown[];
      };
      expect(data.version).toBe(DATA_VERSION);
      expect(migrated.migrated).toBe(true);
      expect(data.settings.weekStartsOn).toBe(DEFAULT_SETTINGS.weekStartsOn);
      expect(Array.isArray(data.meals)).toBe(true);
      expect(Array.isArray(data.adhkarProgress)).toBe(true);
    }
  });

  it("يرحّل نسخة 1 القديمة لـ 2 ويضيف الوجبات والأذكار", () => {
    const legacy = {
      version: 1,
      settings: {
        displayName: "دعاء",
        onboardingCompleted: true,
        visibleSections: ["dashboard", "today", "week", "cleaning", "habits"],
      },
      tasks: [],
      taskCompletions: [],
      rooms: [],
      cleaningTasks: [],
      cleaningCompletions: [],
      habits: [],
      habitCompletions: [],
    };
    const migrated = migrateRawData(legacy);
    expect(migrated.ok).toBe(true);
    if (migrated.ok) {
      const data = migrated.data as {
        version: number;
        meals: { title: string }[];
        settings: { housePlanVersion: number };
        cleaningTasks: { planKey?: string }[];
      };
      expect(data.version).toBe(DATA_VERSION);
      // اقتراحات الغدا الافتراضية (21 أكلة على الأسبوع)
      expect(data.meals.length).toBeGreaterThanOrEqual(21);
      // خطة البيت اتطبقت: فيه تنظيف بخطة ومهام عبادة
      expect(data.settings.housePlanVersion).toBeGreaterThan(0);
      expect(data.cleaningTasks.some((task) => task.planKey === "v2-daily-tidy")).toBe(true);
    }
  });

  it("يرفض نسخة أحدث من التطبيق", () => {
    const result = migrateRawData({ version: 99 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("أحدث");
  });

  it("يكمّل الحقول الناقصة أثناء الترحيل", () => {
    const parsed = parseStoredData(
      JSON.stringify({ version: 0, tasks: [], rooms: [], habits: [], settings: {} }),
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.rooms.length).toBeGreaterThan(0);
      expect(parsed.data.settings.displayName).toBe("");
      expect(parsed.data.habitCompletions).toEqual([]);
    }
  });

  it("يتعامل مع امتلاء مساحة التخزين بهدوء", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    const result = saveData(createEmptyData());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("quota");
      expect(result.message).toContain("اتملت");
    }
    setItem.mockRestore();
  });

  it("يمسح البيانات", () => {
    saveData(createEmptyData());
    expect(clearStoredData().ok).toBe(true);
    expect(loadData().status).toBe("empty");
  });
});
