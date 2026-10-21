import { describe, expect, it } from "vitest";
import {
  backupFileName,
  buildBackup,
  parseBackup,
  serializeBackup,
  summarizeBackup,
} from "@/lib/backup";
import { createEmptyData, DATA_VERSION } from "@/lib/defaults";
import { addHabit, addTask } from "@/lib/operations";

function sampleData() {
  const base = createEmptyData();
  const withTask = addTask(base, {
    title: "تجهيز الغدا",
    category: "kitchen",
    priority: "high",
    startTime: "13:00",
    recurrence: { type: "daily", startDate: "2026-10-21" },
  }).data;
  return addHabit(withTask, { name: "مشي", weekdays: [1, 3] }).data;
}

describe("النسخ الاحتياطي", () => {
  it("يبني نسخة بالشكل والإصدار الصحيح", () => {
    const backup = buildBackup(sampleData(), "2026-10-21T10:00:00.000Z");
    expect(backup.app).toBe("bayti-monazam");
    expect(backup.backupVersion).toBe(1);
    expect(backup.exportedAt).toBe("2026-10-21T10:00:00.000Z");
  });

  it("يعمل round-trip للتصدير والاستيراد", () => {
    const data = sampleData();
    const text = serializeBackup(data);
    const result = parseBackup(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.data.tasks[0]?.title).toBe("تجهيز الغدا");
      expect(result.backup.data.habits[0]?.name).toBe("مشي");
      expect(result.backup.data.rooms.length).toBe(data.rooms.length);
    }
  });

  it("يرفض الملف الفاضي أو غير الـ JSON", () => {
    expect(parseBackup("").ok).toBe(false);
    const invalid = parseBackup("hello");
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.message).toContain("JSON");
  });

  it("يرفض نسخة تطبيق تاني", () => {
    const backup = { app: "other-app", backupVersion: 1, exportedAt: "2026-10-21T10:00:00.000Z", data: {} };
    expect(parseBackup(JSON.stringify(backup)).ok).toBe(false);
  });

  it("يرفض البيانات الناقصة أو الغلط", () => {
    const backup = buildBackup(sampleData());
    const broken = { ...backup, data: { ...backup.data, tasks: [{ id: 1 }] } };
    const result = parseBackup(JSON.stringify(broken));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("غير صالحة");
  });

  it("يقبل بيانات بدون غلاف (تصدير قديم)", () => {
    const data = sampleData();
    const result = parseBackup(JSON.stringify(data));
    expect(result.ok).toBe(true);
  });

  it("يلخّص محتوى النسخة", () => {
    const summary = summarizeBackup(buildBackup(sampleData(), "2026-10-21T10:00:00.000Z"));
    expect(summary.tasks).toBe(1);
    expect(summary.habits).toBe(1);
    expect(summary.rooms).toBe(6);
    expect(summary.taskCompletions).toBe(0);
  });

  it("يسمّي الملف بتاريخ التصدير", () => {
    expect(backupFileName("2026-10-21T10:00:00.000Z")).toBe("bayti-monazam-backup-2026-10-21.json");
  });
});

describe("استيراد نسخ قديمة v1", () => {
  it("نسخة v1 كاملة بترحّل لـ 2 عند الاستيراد", () => {
    const legacy = {
      app: "bayti-monazam",
      backupVersion: 1,
      exportedAt: "2026-09-01T09:00:00.000Z",
      data: {
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
      },
    };
    const result = parseBackup(JSON.stringify(legacy));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.data.version).toBe(DATA_VERSION);
      expect(result.backup.data.meals.length).toBeGreaterThanOrEqual(21);
    }
  });

  it("ملف مشوّه (بدون version) بيترفض كأنه غير صالح", () => {
    const garbage = {
      app: "bayti-monazam",
      hello: "world",
    };
    const result = parseBackup(JSON.stringify(garbage));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("غير صالحة");
  });
});
