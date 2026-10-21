import type { Page } from "@playwright/test";

export const STORAGE_KEY = "bayti-monazam:data";

/** تاريخ اليوم بتوقيت القاهرة بصيغة YYYY-MM-DD */
export function todayInCairo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function weekdayIndex(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function isoNow(): string {
  return new Date().toISOString();
}

export interface SeedOptions {
  displayName?: string;
  tasks?: Array<Record<string, unknown>>;
  habits?: Array<Record<string, unknown>>;
  cleaningTasks?: Array<Record<string, unknown>>;
  completions?: Array<Record<string, unknown>>;
  habitCompletions?: Array<Record<string, unknown>>;
}

export function buildSeed(options: SeedOptions = {}) {
  const today = todayInCairo();
  const now = isoNow();
  const roomId = "room-kitchen";
  return {
    version: 2,
    settings: {
      displayName: options.displayName ?? "دعاء",
      wakeUpTime: "06:30",
      bedTime: "22:30",
      weekStartsOn: 6,
      routineTemplate: "balanced",
      onboardingCompleted: true,
      visibleSections: ["dashboard", "today", "week", "cleaning", "habits", "meals", "adhkar"],
      housePlanVersion: 0,
      createdAt: now,
    },
    tasks: options.tasks ?? [],
    taskCompletions: options.completions ?? [],
    rooms: [
      { id: roomId, name: "المطبخ", emoji: "🍳", order: 0, createdAt: now },
      { id: "room-living", name: "الصالة", emoji: "🛋️", order: 1, createdAt: now },
    ],
    cleaningTasks: options.cleaningTasks ?? [
      {
        id: "clean-1",
        roomId,
        title: "مسح أسطح المطبخ",
        frequency: "daily",
        weekday: null,
        dayOfMonth: null,
        startDate: today,
        createdAt: now,
      },
    ],
    cleaningCompletions: [],
    habits: options.habits ?? [],
    habitCompletions: options.habitCompletions ?? [],
    meals: [],
    adhkarProgress: [],
  };
}

/**
 * يزرع بيانات البداية مرة واحدة فقط لكل سياق اختبار.
 * مهم: لو السكربت كتب كل مرة، كان هيمسح أي تعديل بعد إعادة تحميل الصفحة
 * وده كان هيخلي اختبارات الثبات (persistence) تفشل زورًا.
 */
export async function seed(page: Page, options: SeedOptions = {}): Promise<void> {
  const data = buildSeed(options);
  await page.addInitScript(
    ([key, payload]) => {
      if (window.localStorage.getItem(key as string) === null) {
        window.localStorage.setItem(key as string, payload as string);
      }
    },
    [STORAGE_KEY, JSON.stringify(data)] as const,
  );
}

export interface StoredShape {
  settings: {
    displayName: string;
    onboardingCompleted: boolean;
    weekStartsOn: number;
    visibleSections: string[];
  };
  tasks: Array<{ id: string; title: string }>;
  taskCompletions: Array<{ taskId: string; date: string }>;
  cleaningCompletions: Array<{ cleaningTaskId: string; date: string }>;
  habits: Array<{ id: string; name: string }>;
  habitCompletions: Array<{ habitId: string; date: string }>;
}

/** يقرأ البيانات المحفوظة فعليًا في المتصفح */
export async function readStored(page: Page): Promise<StoredShape | null> {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as StoredShape;
}

export function dailyTask(overrides: Record<string, unknown> = {}) {
  const today = todayInCairo();
  return {
    id: "task-daily",
    title: "تجهيز الغدا",
    category: "kitchen",
    priority: "high",
    startTime: "13:00",
    durationMinutes: 45,
    recurrence: { type: "daily", startDate: today },
    createdAt: isoNow(),
    ...overrides,
  };
}

export function habitEveryDay(id = "habit-water", name = "شرب ميه") {
  return {
    id,
    name,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    createdAt: isoNow(),
  };
}
