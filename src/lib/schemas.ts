import { z } from "zod";

/**
 * مخططات التحقق وقت التشغيل.
 * كل ما يُخزَّن في LocalStorage أو يُستورد من نسخة احتياطية يمر من هنا.
 */

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "التاريخ لازم يكون بصيغة YYYY-MM-DD")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return false;
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "تاريخ غير صالح");

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "الوقت لازم يكون بصيغة HH:MM");

const weekdaySchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

const isoDateTimeSchema = z.string().min(1);

const categorySchema = z.enum([
  "home",
  "kitchen",
  "self",
  "family",
  "worship",
  "health",
  "work",
  "other",
]);

const prioritySchema = z.enum(["low", "medium", "high"]);

const recurrenceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("once"), date: isoDateSchema }),
  z.object({
    type: z.literal("daily"),
    startDate: isoDateSchema,
    endDate: isoDateSchema.optional(),
  }),
  z.object({
    type: z.literal("weekly"),
    startDate: isoDateSchema,
    weekdays: z.array(weekdaySchema).min(1, "اختاري يوم واحد على الأقل"),
    endDate: isoDateSchema.optional(),
  }),
  z.object({
    type: z.literal("monthly"),
    startDate: isoDateSchema,
    dayOfMonth: z.number().int().min(1).max(31),
    endDate: isoDateSchema.optional(),
  }),
]);

export const userSettingsSchema = z.object({
  displayName: z.string().trim().max(60),
  wakeUpTime: timeSchema,
  bedTime: timeSchema,
  weekStartsOn: weekdaySchema,
  routineTemplate: z.enum(["calm", "balanced", "busy"]),
  onboardingCompleted: z.boolean(),
  visibleSections: z.array(z.enum(["dashboard", "today", "week", "cleaning", "habits"])),
  createdAt: isoDateTimeSchema.optional(),
});

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, "اكتبي اسم المهمة").max(120),
  notes: z.string().max(1000).optional(),
  category: categorySchema,
  priority: prioritySchema,
  startTime: timeSchema.nullable().optional(),
  durationMinutes: z.number().int().min(5).max(720).nullable().optional(),
  recurrence: recurrenceSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema.optional(),
});

export const taskCompletionSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  date: isoDateSchema,
  completedAt: isoDateTimeSchema,
});

export const roomSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  emoji: z.string().max(8).optional(),
  order: z.number().int().min(0),
  createdAt: isoDateTimeSchema,
});

export const cleaningTaskSchema = z.object({
  id: z.string().min(1),
  roomId: z.string().min(1),
  title: z.string().trim().min(1, "اكتبي اسم مهمة التنظيف").max(120),
  notes: z.string().max(500).optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  weekday: weekdaySchema.nullable().optional(),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  startDate: isoDateSchema,
  createdAt: isoDateTimeSchema,
});

export const cleaningCompletionSchema = z.object({
  id: z.string().min(1),
  cleaningTaskId: z.string().min(1),
  date: isoDateSchema,
  completedAt: isoDateTimeSchema,
});

export const habitSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "اكتبي اسم العادة").max(80),
  description: z.string().max(300).optional(),
  weekdays: z.array(weekdaySchema).min(1, "اختاري يوم واحد على الأقل"),
  createdAt: isoDateTimeSchema,
});

export const habitCompletionSchema = z.object({
  id: z.string().min(1),
  habitId: z.string().min(1),
  date: isoDateSchema,
  completedAt: isoDateTimeSchema,
});

export const appDataSchema = z.object({
  version: z.literal(1),
  settings: userSettingsSchema,
  tasks: z.array(taskSchema),
  taskCompletions: z.array(taskCompletionSchema),
  rooms: z.array(roomSchema),
  cleaningTasks: z.array(cleaningTaskSchema),
  cleaningCompletions: z.array(cleaningCompletionSchema),
  habits: z.array(habitSchema),
  habitCompletions: z.array(habitCompletionSchema),
});

export const BACKUP_APP_ID = "bayti-monazam";
export const BACKUP_VERSION = 1;

export const backupSchema = z.object({
  app: z.literal(BACKUP_APP_ID),
  backupVersion: z.number().int().min(1).max(BACKUP_VERSION),
  exportedAt: isoDateTimeSchema,
  data: appDataSchema,
});

export type BackupFile = z.infer<typeof backupSchema>;

export function formatZodError(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return "بيانات غير صالحة";
  const path = first.path.filter((part) => typeof part === "string").join(" › ");
  return path ? `${path}: ${first.message}` : first.message;
}
