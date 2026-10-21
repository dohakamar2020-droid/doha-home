import type { AppData } from "@/types/domain";
import { appDataSchema, formatZodError } from "@/lib/schemas";
import { DEFAULT_SETTINGS, createEmptyData } from "@/lib/defaults";

export const STORAGE_KEY = "bayti-monazam:data";
export const STORAGE_VERSION = 1;

export type LoadResult =
  | { status: "ok"; data: AppData; migrated: boolean }
  | { status: "empty" }
  | { status: "corrupted"; message: string }
  | { status: "unavailable"; message: string };

export type SaveResult = { ok: true } | { ok: false; reason: "quota" | "unavailable" | "unknown"; message: string };

export function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const probeKey = `${STORAGE_KEY}:probe`;
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * الترحيل: أي نسخة قديمة بتتحول للشكل الحالي قبل التحقق منها.
 * الإصدار 0 = بيانات محفوظة بدون رقم إصدار (أول إصدار تجريبي من التطبيق).
 */
type RawData = Record<string, unknown>;

const migrations: Record<number, (data: RawData) => RawData> = {
  1: (raw) => {
    const base = createEmptyData(DEFAULT_SETTINGS);
    const settings = (
      raw.settings && typeof raw.settings === "object" ? raw.settings : {}
    ) as Partial<AppData["settings"]>;
    return {
      version: 1,
      settings: {
        ...base.settings,
        ...settings,
        visibleSections:
          Array.isArray(settings.visibleSections) && settings.visibleSections.length > 0
            ? settings.visibleSections
            : base.settings.visibleSections,
      },
      tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
      taskCompletions: Array.isArray(raw.taskCompletions) ? raw.taskCompletions : [],
      rooms: Array.isArray(raw.rooms) && raw.rooms.length > 0 ? raw.rooms : base.rooms,
      cleaningTasks: Array.isArray(raw.cleaningTasks) ? raw.cleaningTasks : [],
      cleaningCompletions: Array.isArray(raw.cleaningCompletions)
        ? raw.cleaningCompletions
        : [],
      habits: Array.isArray(raw.habits) ? raw.habits : [],
      habitCompletions: Array.isArray(raw.habitCompletions) ? raw.habitCompletions : [],
    };
  },
};

export function migrateRawData(raw: unknown): { ok: true; data: unknown; migrated: boolean } | { ok: false; message: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, message: "البيانات المحفوظة مش بالشكل المتوقع" };
  }
  let current = raw as RawData;
  const rawVersion = typeof current.version === "number" ? current.version : 0;
  if (rawVersion > STORAGE_VERSION) {
    return {
      ok: false,
      message: "البيانات محفوظة بنسخة أحدث من التطبيق. حدّثي الصفحة أو حدّثي الإصدار.",
    };
  }
  let version = rawVersion;
  while (version < STORAGE_VERSION) {
    const migration = migrations[version + 1];
    if (!migration) {
      return { ok: false, message: `مفيش ترحيل متاح من الإصدار ${version}` };
    }
    current = migration(current);
    version += 1;
  }
  return { ok: true, data: current, migrated: rawVersion !== STORAGE_VERSION };
}

export function parseStoredData(rawText: string): { ok: true; data: AppData; migrated: boolean } | { ok: false; message: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, message: "البيانات المحفوظة تالفة ومش قابلة للقراءة" };
  }
  const migrated = migrateRawData(parsed);
  if (!migrated.ok) return { ok: false, message: migrated.message };
  const validated = appDataSchema.safeParse(migrated.data);
  if (!validated.success) {
    return { ok: false, message: `البيانات المحفوظة غير صالحة — ${formatZodError(validated.error)}` };
  }
  return { ok: true, data: validated.data, migrated: migrated.migrated };
}

export function loadData(): LoadResult {
  if (typeof window === "undefined") {
    return { status: "unavailable", message: "التخزين المحلي غير متاح على السيرفر" };
  }
  let rawText: string | null;
  try {
    rawText = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return { status: "unavailable", message: "المتصفح مش سامح بالوصول للتخزين المحلي" };
  }
  if (!rawText) return { status: "empty" };
  const parsed = parseStoredData(rawText);
  if (!parsed.ok) return { status: "corrupted", message: parsed.message };
  return { status: "ok", data: parsed.data, migrated: parsed.migrated };
}

export function saveData(data: AppData): SaveResult {
  if (typeof window === "undefined") {
    return { ok: false, reason: "unavailable", message: "التخزين المحلي غير متاح" };
  }
  try {
    const payload = JSON.stringify(data);
    window.localStorage.setItem(STORAGE_KEY, payload);
    return { ok: true };
  } catch (error) {
    if (isQuotaError(error)) {
      return {
        ok: false,
        reason: "quota",
        message: "مساحة التخزين في المتصفح اتملت. امسحي بيانات قديمة أو اعملي تصدير وبعدين تصفير.",
      };
    }
    if (error instanceof DOMException && error.name === "SecurityError") {
      return { ok: false, reason: "unavailable", message: "المتصفح مش سامح بالحفظ المحلي" };
    }
    return { ok: false, reason: "unknown", message: "حصلت مشكلة وإحنا بنحفظ البيانات" };
  }
}

export function clearStoredData(): SaveResult {
  if (typeof window === "undefined") {
    return { ok: false, reason: "unavailable", message: "التخزين المحلي غير متاح" };
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return { ok: true };
  } catch {
    return { ok: false, reason: "unknown", message: "معرفناش نمسح البيانات المحفوظة" };
  }
}

function isQuotaError(error: unknown): boolean {
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return (
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014
    );
  }
  return false;
}
