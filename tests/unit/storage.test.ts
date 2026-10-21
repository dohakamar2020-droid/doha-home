import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  STORAGE_KEY,
  clearStoredData,
  loadData,
  migrateRawData,
  parseStoredData,
  saveData,
} from "@/lib/storage";
import { createEmptyData, DEFAULT_SETTINGS } from "@/lib/defaults";
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tasks: "wrong" }));
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
      const data = migrated.data as { version: number; settings: { weekStartsOn: number } };
      expect(data.version).toBe(1);
      expect(migrated.migrated).toBe(true);
      expect(data.settings.weekStartsOn).toBe(DEFAULT_SETTINGS.weekStartsOn);
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
