import type {
  CleaningTask,
  Habit,
  IsoDate,
  Priority,
  Room,
  RoutineTemplate,
  Task,
  TaskCategory,
  Weekday,
} from "@/types/domain";
import { createId } from "@/lib/id";
import { weekdayOf } from "@/lib/date";
import { DEFAULT_ROOMS, createDefaultRooms } from "@/data/rooms";
import { buildPlanCleaningTasks, buildPlanTasks } from "@/data/housePlan";

export { DEFAULT_ROOMS, createDefaultRooms } from "@/data/rooms";

/**
 * قوالب البداية: تُنشئ مهامًا وعادات ومهام تنظيف قابلة للتعديل بالكامل.
 * كل التواريخ تُحسب نسبةً لليوم الحالي وقت الإعداد فقط.
 */

export interface StarterBundle {
  tasks: Task[];
  rooms: Room[];
  cleaningTasks: CleaningTask[];
  habits: Habit[];
}

interface TaskSeed {
  title: string;
  category: TaskCategory;
  priority: Priority;
  time?: string;
  duration?: number;
  repeat?: "daily" | "weekly" | "monthly";
  weekdays?: Weekday[];
  dayOfMonth?: number;
  notes?: string;
}

interface HabitSeed {
  name: string;
  description?: string;
  weekdays: Weekday[];
}

const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

const CLEANING_SEEDS: Record<
  string,
  Array<{
    title: string;
    frequency: "daily" | "weekly" | "monthly";
    weekday?: Weekday;
    dayOfMonth?: number;
    notes?: string;
  }>
> = {
  kitchen: [
    { title: "مسح أسطح المطبخ بعد الطبخ", frequency: "daily" },
    { title: "تنظيف البوتاجاز والشواية", frequency: "weekly", weekday: 4 },
    { title: "تنظيف التلاجة من جوه", frequency: "monthly", dayOfMonth: 1 },
  ],
  bathroom: [
    { title: "تلميع الحوض والمرآة", frequency: "daily" },
    { title: "غسل الحمام بالكامل", frequency: "weekly", weekday: 6 },
    { title: "تنظيف سيراميك الحيطة", frequency: "monthly", dayOfMonth: 15 },
  ],
  bedroom: [
    { title: "ترتيب السرير", frequency: "daily" },
    { title: "تغيير ملايات السرير", frequency: "weekly", weekday: 5 },
    { title: "تنظيف تحت السرير والدولاب", frequency: "monthly", dayOfMonth: 20 },
  ],
  living: [
    { title: "ترتيب الكنب والوسادات", frequency: "daily" },
    { title: "مسح الترابيزة والسفرة", frequency: "daily" },
    { title: "تنظيف الشبابيك", frequency: "monthly", dayOfMonth: 10 },
  ],
  laundry: [
    { title: "تشغيل غسلة الغسيل", frequency: "weekly", weekday: 0 },
    { title: "تشغيل غسلة تانية", frequency: "weekly", weekday: 3 },
    { title: "ترتيب الملابس في الدولاب", frequency: "weekly", weekday: 5 },
  ],
  general: [
    { title: "كنس ومسح الأرضيات", frequency: "daily" },
    { title: "مسح التراب والرفوف", frequency: "weekly", weekday: 4 },
    { title: "تنظيف المدخل والسلم", frequency: "monthly", dayOfMonth: 5 },
  ],
};

const HABIT_SEEDS: Record<RoutineTemplate, HabitSeed[]> = {
  calm: [
    { name: "شرب 8 كوبايات ميه", description: "كوباية مع كل وجبة ووسط اليوم", weekdays: ALL_DAYS },
    { name: "قراءة صفحتين", description: "قبل النوم بدل الموبايل", weekdays: ALL_DAYS },
    { name: "مشي 10 دقايق", weekdays: [1, 2, 3, 4, 6] },
  ],
  balanced: [
    { name: "شرب 8 كوبايات ميه", weekdays: ALL_DAYS },
    { name: "رياضة خفيفة 15 دقيقة", weekdays: [1, 3, 5] },
    { name: "قراءة صفحتين", weekdays: ALL_DAYS },
    { name: "ترتيب سريع 10 دقايق", description: "حاجة صغيرة كل يوم", weekdays: ALL_DAYS },
  ],
  busy: [
    { name: "شرب 8 كوبايات ميه", weekdays: ALL_DAYS },
    { name: "رياضة خفيفة 15 دقيقة", weekdays: [0, 2, 4] },
    { name: "وقت هادي من غير موبايل", description: "10 دقايق بس لنفسك", weekdays: ALL_DAYS },
    { name: "تجهيز شنطة بكرة", description: "قبل النوم", weekdays: [0, 1, 2, 3, 4] },
  ],
};

const TASK_SEEDS: Record<RoutineTemplate, TaskSeed[]> = {
  calm: [
    { title: "صلاة الفجر وورد الصبح", category: "worship", priority: "high", time: "05:30", duration: 20 },
    { title: "فطار هادي وفنجان قهوة", category: "kitchen", priority: "medium", time: "08:00", duration: 30 },
    { title: "ترتيب سريع للبيت", category: "home", priority: "medium", time: "10:00", duration: 20 },
    { title: "تجهيز الغدا", category: "kitchen", priority: "high", time: "13:00", duration: 45 },
    { title: "وقت راحة وشاي", category: "self", priority: "low", time: "16:00", duration: 30 },
    { title: "تجهيز العشا", category: "kitchen", priority: "medium", time: "20:00", duration: 30 },
    {
      title: "تغيير ملايات السرير",
      category: "home",
      priority: "low",
      time: "11:00",
      duration: 20,
      repeat: "weekly",
      weekdays: [4],
    },
  ],
  balanced: [
    { title: "صلاة الفجر وورد الصبح", category: "worship", priority: "high", time: "05:30", duration: 20 },
    { title: "تجهيز فطار العيلة", category: "kitchen", priority: "high", time: "07:30", duration: 30 },
    { title: "ترتيب البيت السريع", category: "home", priority: "medium", time: "09:30", duration: 25 },
    { title: "تجهيز الغدا", category: "kitchen", priority: "high", time: "12:30", duration: 60 },
    { title: "وقت مع العيلة", category: "family", priority: "medium", time: "17:00", duration: 60 },
    { title: "رياضة أو مشي", category: "health", priority: "medium", time: "18:30", duration: 30 },
    { title: "تجهيز العشا وترتيب المطبخ", category: "kitchen", priority: "medium", time: "20:00", duration: 40 },
    {
      title: "تسليك غسيل",
      category: "home",
      priority: "medium",
      time: "10:00",
      repeat: "weekly",
      weekdays: [0, 3],
      duration: 30,
    },
    {
      title: "تسويق الأسبوع",
      category: "home",
      priority: "high",
      time: "11:00",
      repeat: "weekly",
      weekdays: [5],
      duration: 90,
    },
    {
      title: "مكالمة مع ماما",
      category: "family",
      priority: "low",
      time: "19:00",
      repeat: "weekly",
      weekdays: [6],
      duration: 20,
    },
    {
      title: "تنظيف الشبابيك",
      category: "home",
      priority: "low",
      repeat: "monthly",
      dayOfMonth: 1,
      duration: 60,
    },
  ],
  busy: [
    { title: "صلاة الفجر وورد الصبح", category: "worship", priority: "high", time: "05:00", duration: 20 },
    { title: "فطار سريع", category: "kitchen", priority: "medium", time: "06:30", duration: 15 },
    { title: "تجهيز شنطة البيت والمشتريات", category: "home", priority: "high", time: "08:00", duration: 20 },
    { title: "ترتيب وتنظيف سريع", category: "home", priority: "high", time: "09:00", duration: 30 },
    { title: "تجهيز الغدا", category: "kitchen", priority: "high", time: "12:00", duration: 45 },
    { title: "شغل / مهام خارج البيت", category: "work", priority: "high", time: "14:00", duration: 120 },
    { title: "تجهيز العشا", category: "kitchen", priority: "medium", time: "19:30", duration: 30 },
    { title: "ترتيب البيت قبل النوم", category: "home", priority: "medium", time: "21:30", duration: 15 },
    {
      title: "غسيل المفارش",
      category: "home",
      priority: "low",
      repeat: "weekly",
      weekdays: [6],
      duration: 30,
    },
    {
      title: "مراجعة مصاريف الأسبوع",
      category: "other",
      priority: "medium",
      repeat: "weekly",
      weekdays: [5],
      duration: 30,
    },
    {
      title: "تنظيف عميق للمطبخ",
      category: "kitchen",
      priority: "low",
      repeat: "monthly",
      dayOfMonth: 15,
      duration: 90,
    },
  ],
};

export function buildDefaultCleaningTasks(
  rooms: Room[],
  today: IsoDate,
  now: string = new Date().toISOString(),
): CleaningTask[] {
  const tasks: CleaningTask[] = [];
  rooms.forEach((room, index) => {
    const defaultRoom = DEFAULT_ROOMS[index];
    if (!defaultRoom) return;
    const seeds = CLEANING_SEEDS[defaultRoom.key] ?? [];
    seeds.forEach((seed) => {
      tasks.push({
        id: createId(),
        roomId: room.id,
        title: seed.title,
        notes: seed.notes,
        frequency: seed.frequency,
        weekday: seed.weekday ?? null,
        dayOfMonth: seed.dayOfMonth ?? null,
        startDate: today,
        createdAt: now,
      });
    });
  });
  return tasks;
}

export function buildStarterBundle(
  template: RoutineTemplate,
  today: IsoDate,
  bedTime = "22:30",
): StarterBundle {
  const now = new Date().toISOString();
  const rooms = createDefaultRooms(now);
  // خطة البيت: ترويق خفيف + تنظيف عميق يومي لأوضة + التلات شامل + غسيل مرتين
  const cleaningTasks = buildPlanCleaningTasks(rooms, today);
  const planTasks = buildPlanTasks(today, bedTime);
  const weekday = weekdayOf(today);

  const templateTasks: Task[] = TASK_SEEDS[template].map((seed) => {
    const common = {
      id: createId(),
      title: seed.title,
      notes: seed.notes,
      category: seed.category,
      priority: seed.priority,
      startTime: seed.time ?? null,
      durationMinutes: seed.duration ?? null,
      createdAt: now,
    };
    if (seed.repeat === "weekly") {
      return {
        ...common,
        recurrence: {
          type: "weekly" as const,
          startDate: today,
          weekdays: seed.weekdays ?? [weekday],
        },
      };
    }
    if (seed.repeat === "monthly") {
      return {
        ...common,
        recurrence: {
          type: "monthly" as const,
          startDate: today,
          dayOfMonth: seed.dayOfMonth ?? 1,
        },
      };
    }
    return {
      ...common,
      recurrence: { type: "daily" as const, startDate: today },
    };
  });

  const habits: Habit[] = HABIT_SEEDS[template].map((seed) => ({
    id: createId(),
    name: seed.name,
    description: seed.description,
    weekdays: seed.weekdays,
    createdAt: now,
  }));

  return { tasks: [...templateTasks, ...planTasks], rooms, cleaningTasks, habits };
}

/** مهام تنظيف بسيطة لأي غرفة جديدة يضيفها المستخدم */
export function createRoomCleaningTask(
  roomId: string,
  today: IsoDate,
  title = "ترتيب ومسح سريع",
): CleaningTask {
  return {
    id: createId(),
    roomId,
    title,
    frequency: "weekly",
    weekday: weekdayOf(today),
    dayOfMonth: null,
    startDate: today,
    createdAt: new Date().toISOString(),
  };
}
