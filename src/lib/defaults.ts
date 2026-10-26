import type { AppData, UserSettings } from "@/types/domain";
import { APP_SECTIONS } from "@/types/domain";
import { buildDefaultCleaningTasks, createDefaultRooms } from "@/data/templates";
import { buildDefaultMeals } from "@/data/meals";
import { todayIso } from "@/lib/date";

export const APP_VERSION = "1.2.0";

/** نسخة شكل البيانات المحفوظة */
export const DATA_VERSION = 2;

export const DEFAULT_SETTINGS: UserSettings = {
  displayName: "",
  wakeUpTime: "06:30",
  bedTime: "22:30",
  weekStartsOn: 6, // السبت بداية الأسبوع في مصر
  routineTemplate: "balanced",
  onboardingCompleted: false,
  visibleSections: [...APP_SECTIONS],
  housePlanVersion: 0,
};

/** بيانات مبدئية فاضية مع الغرف الافتراضية ومهام التنظيف الأساسية */
export function createEmptyData(settings: UserSettings = DEFAULT_SETTINGS): AppData {
  const now = new Date().toISOString();
  const rooms = createDefaultRooms(now);
  const today = todayIso();
  return {
    version: DATA_VERSION,
    settings: { ...settings },
    tasks: [],
    taskCompletions: [],
    rooms,
    cleaningTasks: buildDefaultCleaningTasks(rooms, today, now),
    cleaningCompletions: [],
    habits: [],
    habitCompletions: [],
    meals: buildDefaultMeals(now),
    adhkarProgress: [],
  };
}
