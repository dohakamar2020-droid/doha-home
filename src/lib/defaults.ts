import type { AppData, UserSettings } from "@/types/domain";
import { APP_SECTIONS } from "@/types/domain";
import { buildDefaultCleaningTasks, createDefaultRooms } from "@/data/templates";
import { todayIso } from "@/lib/date";

export const APP_VERSION = "1.0.0";

export const DEFAULT_SETTINGS: UserSettings = {
  displayName: "",
  wakeUpTime: "06:30",
  bedTime: "22:30",
  weekStartsOn: 6, // السبت بداية الأسبوع في مصر
  routineTemplate: "balanced",
  onboardingCompleted: false,
  visibleSections: [...APP_SECTIONS],
};

/** بيانات مبدئية فاضية مع الغرف الافتراضية ومهام التنظيف الأساسية */
export function createEmptyData(settings: UserSettings = DEFAULT_SETTINGS): AppData {
  const now = new Date().toISOString();
  const rooms = createDefaultRooms(now);
  const today = todayIso();
  return {
    version: 1,
    settings: { ...settings },
    tasks: [],
    taskCompletions: [],
    rooms,
    cleaningTasks: buildDefaultCleaningTasks(rooms, today, now),
    cleaningCompletions: [],
    habits: [],
    habitCompletions: [],
  };
}
