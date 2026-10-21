import type { z } from "zod";
import type {
  appDataSchema,
  cleaningCompletionSchema,
  cleaningTaskSchema,
  habitCompletionSchema,
  habitSchema,
  roomSchema,
  taskCompletionSchema,
  taskSchema,
  userSettingsSchema,
} from "@/lib/schemas";

/** 0 = الأحد … 6 = السبت */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: "الأحد",
  1: "الاتنين",
  2: "التلات",
  3: "الأربع",
  4: "الخميس",
  5: "الجمعة",
  6: "السبت",
};

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  0: "حد",
  1: "اتن",
  2: "تلا",
  3: "أرب",
  4: "خمي",
  5: "جمع",
  6: "سبت",
};

export const TASK_CATEGORIES = [
  { value: "home", label: "البيت" },
  { value: "kitchen", label: "المطبخ" },
  { value: "self", label: "عناية بنفسي" },
  { value: "family", label: "العيلة" },
  { value: "worship", label: "عبادة" },
  { value: "health", label: "صحة" },
  { value: "work", label: "شغل" },
  { value: "other", label: "حاجات تانية" },
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number]["value"];

export const CATEGORY_LABELS: Record<TaskCategory, string> = Object.fromEntries(
  TASK_CATEGORIES.map((category) => [category.value, category.label]),
) as Record<TaskCategory, string>;

export const PRIORITIES = [
  { value: "low", label: "منخفضة" },
  { value: "medium", label: "متوسطة" },
  { value: "high", label: "عالية" },
] as const;

export type Priority = (typeof PRIORITIES)[number]["value"];

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
};

export const APP_SECTIONS = ["dashboard", "today", "week", "cleaning", "habits"] as const;
export type SectionId = (typeof APP_SECTIONS)[number];

export const SECTION_LABELS: Record<SectionId, string> = {
  dashboard: "الرئيسية",
  today: "يومي",
  week: "الأسبوع",
  cleaning: "تنظيف البيت",
  habits: "عاداتي",
};

export const ROUTINE_TEMPLATES = ["calm", "balanced", "busy"] as const;
export type RoutineTemplate = (typeof ROUTINE_TEMPLATES)[number];

export const TEMPLATE_LABELS: Record<RoutineTemplate, string> = {
  calm: "يوم هادي وخفيف",
  balanced: "يوم بيت متوازن",
  busy: "يوم مليان ومشغول",
};

export const CLEANING_FREQUENCIES = ["daily", "weekly", "monthly"] as const;
export type CleaningFrequency = (typeof CLEANING_FREQUENCIES)[number];

export const CLEANING_FREQUENCY_LABELS: Record<CleaningFrequency, string> = {
  daily: "كل يوم",
  weekly: "كل أسبوع",
  monthly: "كل شهر",
};

// ---------------------------------------------------------------------------
// نماذج المجال (مستخرجة من مخططات Zod لضمان تطابق التحقق مع الأنواع)
// ---------------------------------------------------------------------------

export type UserSettings = z.infer<typeof userSettingsSchema>;
export type Task = z.infer<typeof taskSchema>;
export type TaskCompletion = z.infer<typeof taskCompletionSchema>;
export type Room = z.infer<typeof roomSchema>;
export type CleaningTask = z.infer<typeof cleaningTaskSchema>;
export type CleaningCompletion = z.infer<typeof cleaningCompletionSchema>;
export type Habit = z.infer<typeof habitSchema>;
export type HabitCompletion = z.infer<typeof habitCompletionSchema>;
export type AppData = z.infer<typeof appDataSchema>;

export type Recurrence = Task["recurrence"];
export type RecurrenceType = Recurrence["type"];

/** تاريخ محلي بصيغة YYYY-MM-DD */
export type IsoDate = string;

export type TaskInput = {
  title: string;
  notes?: string;
  category: TaskCategory;
  priority: Priority;
  startTime?: string | null;
  durationMinutes?: number | null;
  recurrence: Recurrence;
};

export type CleaningTaskInput = {
  roomId: string;
  title: string;
  notes?: string;
  frequency: CleaningFrequency;
  weekday?: Weekday | null;
  dayOfMonth?: number | null;
  startDate?: IsoDate;
};

export type HabitInput = {
  name: string;
  description?: string;
  weekdays: Weekday[];
};
