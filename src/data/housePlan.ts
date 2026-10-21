import type {
  AppData,
  CleaningFrequency,
  CleaningTask,
  IsoDate,
  Room,
  Task,
  Weekday,
} from "@/types/domain";
import { DEFAULT_ROOMS, createDefaultRooms } from "@/data/rooms";
import { buildDefaultMeals } from "@/data/meals";
import { createId } from "@/lib/id";
import { addMinutesToTime } from "@/lib/date";

/**
 * «خطة البيت» — الروتين اللي المستخدمة طلبته:
 * - عبادة من الفجر لحد 7، وأذكار صباح ومساء، وقيام ليل قبل النوم.
 * - ترويق خفيف كل يوم + تنظيف عميق لأوضة واحدة كل يوم.
 * - الثلاثاء: تنظيف عميق شامل للبيت.
 * - غسيل الملابس مرتين في الأسبوع (الأحد والأربع).
 * - اقتراح غدا لكل يوم (بيتبني في data/meals).
 *
 * الخطة تُطبَّق مرة واحدة لكل نسخة (housePlanVersion)، وبعدها كل حاجة قابلة
 * للتعديل أو الحذف من غير ما ترجع تلقائيًا.
 */

export const HOUSE_PLAN_VERSION = 2;

export const PLAN_ROOM_KEYS = [
  "kitchen",
  "bathroom",
  "bedroom",
  "living",
  "laundry",
  "general",
] as const;

export type PlanRoomKey = (typeof PLAN_ROOM_KEYS)[number];

const roomName = (index: number, fallback: string): string =>
  DEFAULT_ROOMS[index]?.name ?? fallback;

export const PLAN_ROOM_NAMES: Record<PlanRoomKey, string> = {
  kitchen: roomName(0, "المطبخ"),
  bathroom: roomName(1, "الحمام"),
  bedroom: roomName(2, "أوضة النوم"),
  living: roomName(3, "الصالة"),
  laundry: roomName(4, "الغسيل"),
  general: roomName(5, "البيت عمومًا"),
};

export interface PlanCleaningItem {
  planKey: string;
  roomKey: PlanRoomKey;
  title: string;
  notes?: string;
  frequency: CleaningFrequency;
  weekday?: Weekday;
  /** عناوين المهام الافتراضية القديمة اللي بنحوّلها بدل ما نكررها */
  upgradeFrom?: string[];
}

/** يوم التنظيف العميق لكل أوضة — الباقي (الثلاثاء) كامل البيت */
export const ROOM_DEEP_CLEAN_DAYS: Record<PlanRoomKey, Weekday | null> = {
  kitchen: 6, // السبت
  bathroom: 0, // الأحد
  bedroom: 1, // الاتنين
  living: 3, // الأربع
  laundry: 4, // الخميس
  general: 5, // الجمعة — المدخل والسلّم
};

export const WHOLE_HOUSE_DEEP_CLEAN_DAY: Weekday = 2; // الثلاثاء

export const PLAN_WEEKDAY_TITLE: Record<Weekday, string> = {
  0: "الأحد",
  1: "الاتنين",
  2: "التلات",
  3: "الأربع",
  4: "الخميس",
  5: "الجمعة",
  6: "السبت",
};

export const HOUSE_PLAN_CLEANING: readonly PlanCleaningItem[] = [
  {
    planKey: "v2-kitchen-deep",
    roomKey: "kitchen",
    title: "تنظيف عميق: المطبخ",
    notes: "البوتاجاز والدولاب والتلاجة من بره + الأرضية",
    frequency: "weekly",
    weekday: ROOM_DEEP_CLEAN_DAYS.kitchen ?? 6,
    upgradeFrom: ["تنظيف البوتاجاز والشواية"],
  },
  {
    planKey: "v2-bathroom-deep",
    roomKey: "bathroom",
    title: "تنظيف عميق: الحمام",
    notes: "السيراميك والحوض والمرآة والستارة",
    frequency: "weekly",
    weekday: ROOM_DEEP_CLEAN_DAYS.bathroom ?? 0,
    upgradeFrom: ["غسل الحمام بالكامل"],
  },
  {
    planKey: "v2-bedroom-deep",
    roomKey: "bedroom",
    title: "تنظيف عميق: أوضة النوم",
    notes: "تحت السرير والدولاب والمرتبة",
    frequency: "weekly",
    weekday: ROOM_DEEP_CLEAN_DAYS.bedroom ?? 1,
  },
  {
    planKey: "v2-living-deep",
    roomKey: "living",
    title: "تنظيف عميق: الصالة",
    notes: "الكنب والسجاد والشبابيك",
    frequency: "weekly",
    weekday: ROOM_DEEP_CLEAN_DAYS.living ?? 3,
  },
  {
    planKey: "v2-laundry-deep",
    roomKey: "laundry",
    title: "تنظيف عميق: الغسيل",
    notes: "ترتيب الدولاب وتنظيف الغسالة من جوه",
    frequency: "weekly",
    weekday: ROOM_DEEP_CLEAN_DAYS.laundry ?? 4,
    upgradeFrom: ["ترتيب الملابس في الدولاب"],
  },
  {
    planKey: "v2-general-deep-entrance",
    roomKey: "general",
    title: "تنظيف عميق: المدخل والسلّم",
    notes: "مع تلميع الأرضية",
    frequency: "weekly",
    weekday: ROOM_DEEP_CLEAN_DAYS.general ?? 5,
    upgradeFrom: ["تنظيف المدخل والسلم"],
  },
  {
    planKey: "v2-whole-house-deep",
    roomKey: "general",
    title: "تنظيف عميق شامل للبيت (كل الأوض)",
    notes: "يوم التلات: الأوض كلها + الأرضيات + التراب والرفوف",
    frequency: "weekly",
    weekday: WHOLE_HOUSE_DEEP_CLEAN_DAY,
  },
  {
    planKey: "v2-daily-tidy",
    roomKey: "general",
    title: "ترويق خفيف للبيت",
    notes: "كنس سريع، ترتيب، ومسح الترابيزة — 15 دقيقة",
    frequency: "daily",
    upgradeFrom: ["كنس ومسح الأرضيات"],
  },
  {
    planKey: "v2-laundry-load-1",
    roomKey: "laundry",
    title: "غسيل الملابس (١)",
    notes: "غسلة الغسيل الأسبوعية الأولى",
    frequency: "weekly",
    weekday: 0,
    upgradeFrom: ["تشغيل غسلة الغسيل"],
  },
  {
    planKey: "v2-laundry-load-2",
    roomKey: "laundry",
    title: "غسيل الملابس (٢)",
    notes: "غسلة الغسيل الأسبوعية التانية",
    frequency: "weekly",
    weekday: 3,
    upgradeFrom: ["تشغيل غسلة تانية"],
  },
] as const;

export interface PlanTaskItem {
  planKey: string;
  title: string;
  notes?: string;
  startTime: string;
  durationMinutes: number;
}

/** وقت العبادة: من الفجر (5) لحد 7 */
export const FAJR_WINDOW_START = "05:00";
export const FAJR_WINDOW_END = "07:00";

export function planWorshipTasks(bedTime = "22:30"): PlanTaskItem[] {
  return [
    {
      planKey: "v2-fajr-worship",
      title: "عبادة الفجر (من الفجر لحد 7)",
      notes: "قرآن + دعاء + ذكر، من غير موبايل — لحد الساعة 7",
      startTime: FAJR_WINDOW_START,
      durationMinutes: 120,
    },
    {
      planKey: "v2-morning-adhkar",
      title: "أذكار الصباح",
      notes: "من تاب «أذكاري» وتابعي العدّاد",
      startTime: FAJR_WINDOW_END,
      durationMinutes: 10,
    },
    {
      planKey: "v2-evening-adhkar",
      title: "أذكار المساء",
      notes: "بعد العصر",
      startTime: "19:30",
      durationMinutes: 10,
    },
    {
      planKey: "v2-qiyam",
      title: "قيام الليل (ركعتين قبل النوم)",
      notes: "قبل ما تنامي على طول",
      startTime: addMinutesToTime(bedTime, -30),
      durationMinutes: 20,
    },
  ];
}

export function buildPlanTasks(today: IsoDate, bedTime = "22:30"): Task[] {
  const now = new Date().toISOString();
  return planWorshipTasks(bedTime).map((item) => ({
    id: createId(),
    title: item.title,
    notes: item.notes,
    category: "worship",
    priority: "high",
    startTime: item.startTime,
    durationMinutes: item.durationMinutes,
    recurrence: { type: "daily", startDate: today },
    planKey: item.planKey,
    createdAt: now,
  }));
}

function planRoom(rooms: readonly Room[], roomKey: PlanRoomKey): Room | undefined {
  const name = PLAN_ROOM_NAMES[roomKey];
  return rooms.find((room) => room.name.trim() === name) ?? rooms.find((room) => room.name.includes(name));
}

export function buildPlanCleaningTasks(rooms: readonly Room[], today: IsoDate): CleaningTask[] {
  const now = new Date().toISOString();
  return HOUSE_PLAN_CLEANING.flatMap((item) => {
    const room = planRoom(rooms, item.roomKey);
    if (!room) return [];
    return [
      {
        id: createId(),
        roomId: room.id,
        title: item.title,
        notes: item.notes,
        frequency: item.frequency,
        weekday: item.weekday ?? null,
        dayOfMonth: null,
        startDate: today,
        planKey: item.planKey,
        createdAt: now,
      },
    ];
  });
}

/**
 * يطبّق خطة البيت على بيانات موجودة:
 * - بيحوّل مهام التنظيف الافتراضية القديمة بدل ما يكررها.
 * - بيضيف الناقص فقط، وبيسجّل housePlanVersion عشان ما يتكررش.
 */
export function applyHousePlan(data: AppData, today: IsoDate): AppData {
  if (data.settings.housePlanVersion >= HOUSE_PLAN_VERSION) return data;

  const now = new Date().toISOString();
  // لو البيانات جاية بدون غرف (نسخة قديمة)، نكوّن الغرف الافتراضية الأول
  const rooms = data.rooms.length > 0 ? data.rooms : createDefaultRooms(now);
  const existingCleaning = data.cleaningTasks.slice();
  const addedCleaning: CleaningTask[] = [];

  for (const item of HOUSE_PLAN_CLEANING) {
    const room = planRoom(rooms, item.roomKey);
    if (!room) continue;
    if (existingCleaning.some((task) => task.planKey === item.planKey)) continue;

    const convertible = existingCleaning.find(
      (task) =>
        !task.planKey &&
        task.roomId === room.id &&
        (item.upgradeFrom ?? []).some((title) => task.title.trim() === title),
    );

    if (convertible) {
      const index = existingCleaning.indexOf(convertible);
      existingCleaning[index] = {
        ...convertible,
        title: item.title,
        notes: item.notes ?? convertible.notes,
        frequency: item.frequency,
        weekday: item.weekday ?? null,
        dayOfMonth: null,
        planKey: item.planKey,
      };
      continue;
    }

    addedCleaning.push({
      id: createId(),
      roomId: room.id,
      title: item.title,
      notes: item.notes,
      frequency: item.frequency,
      weekday: item.weekday ?? null,
      dayOfMonth: null,
      startDate: today,
      planKey: item.planKey,
      createdAt: now,
    });
  }

  const tasks = data.tasks.slice();
  for (const item of planWorshipTasks(data.settings.bedTime)) {
    if (tasks.some((task) => task.planKey === item.planKey)) continue;
    tasks.push({
      id: createId(),
      title: item.title,
      notes: item.notes,
      category: "worship",
      priority: "high",
      startTime: item.startTime,
      durationMinutes: item.durationMinutes,
      recurrence: { type: "daily", startDate: today },
      planKey: item.planKey,
      createdAt: now,
    });
  }

  return {
    ...data,
    settings: { ...data.settings, housePlanVersion: HOUSE_PLAN_VERSION },
    tasks,
    rooms,
    cleaningTasks: [...existingCleaning, ...addedCleaning],
    meals: data.meals.length > 0 ? data.meals : buildDefaultMeals(now),
  };
}

/** ملخص الخطة للعرض في الواجهة والإعدادات */
export function describeHousePlan(): string[] {
  return [
    "عبادة من الفجر لحد 7 الصبح، وأذكار صباح ومساء، وقيام ليل قبل النوم",
    "ترويق خفيف كل يوم + تنظيف عميق لأوضة واحدة كل يوم",
    "تنظيف عميق شامل للبيت يوم التلات",
    "غسيل الملابس مرتين في الأسبوع: الأحد والأربع",
    "اقتراح غدا لكل يوم مع بدائل",
  ];
}
