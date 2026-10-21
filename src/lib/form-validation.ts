import { z } from "zod";
import type { CleaningTaskInput, HabitInput, TaskInput, Weekday } from "@/types/domain";
import { recurringTasksLimits } from "@/lib/constants";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "اختاري تاريخ صحيح")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return false;
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "التاريخ غير صحيح");

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "الوقت لازم يكون بصيغة HH:MM")
  .or(z.literal(""));

export const taskFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "اكتبي اسم المهمة")
      .max(recurringTasksLimits.titleMax, "اسم المهمة طويل أوي"),
    notes: z.string().max(1000, "الملاحظات طويلة أوي").optional(),
    category: z.enum([
      "home",
      "kitchen",
      "self",
      "family",
      "worship",
      "health",
      "work",
      "other",
    ]),
    priority: z.enum(["low", "medium", "high"]),
    date: isoDate,
    startTime: timeString,
    durationMinutes: z
      .string()
      .regex(/^\d*$/, "المدة لازم تكون رقم بالدقايق")
      .refine((value) => {
        if (!value) return true;
        const parsed = Number(value);
        return parsed >= 5 && parsed <= 720;
      }, "المدة بين 5 و720 دقيقة"),
    recurrenceType: z.enum(["once", "daily", "weekly", "monthly"]),
    weekdays: z.array(z.number().int().min(0).max(6)),
    dayOfMonth: z
      .string()
      .regex(/^\d*$/, "اليوم لازم يكون رقم")
      .refine((value) => {
        if (!value) return true;
        const parsed = Number(value);
        return parsed >= 1 && parsed <= 31;
      }, "يوم الشهر من 1 لـ 31"),
  })
  .superRefine((values, ctx) => {
    if (values.recurrenceType === "weekly" && values.weekdays.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["weekdays"],
        message: "اختاري يوم واحد على الأقل للأسبوع",
      });
    }
    if (values.recurrenceType === "monthly" && !values.dayOfMonth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dayOfMonth"],
        message: "اكتبي يوم الشهر",
      });
    }
  });

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export type FieldErrors = Record<string, string>;

export function zodToFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  error.issues.forEach((issue) => {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "form";
    if (!errors[key]) errors[key] = issue.message;
  });
  return errors;
}

export function validateTaskForm(values: TaskFormValues):
  | { ok: true; input: TaskInput }
  | { ok: false; errors: FieldErrors } {
  const parsed = taskFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, errors: zodToFieldErrors(parsed.error) };
  const data = parsed.data;
  const duration =
    data.durationMinutes.trim() === "" ? null : Number(data.durationMinutes);

  let recurrence: TaskInput["recurrence"];
  switch (data.recurrenceType) {
    case "once":
      recurrence = { type: "once", date: data.date };
      break;
    case "daily":
      recurrence = { type: "daily", startDate: data.date };
      break;
    case "weekly":
      recurrence = {
        type: "weekly",
        startDate: data.date,
        weekdays: Array.from(new Set(data.weekdays)).sort((a, b) => a - b) as Weekday[],
      };
      break;
    case "monthly":
      recurrence = {
        type: "monthly",
        startDate: data.date,
        dayOfMonth: Number(data.dayOfMonth),
      };
      break;
  }

  return {
    ok: true,
    input: {
      title: data.title,
      notes: data.notes?.trim() || undefined,
      category: data.category,
      priority: data.priority,
      startTime: data.startTime === "" ? null : data.startTime,
      durationMinutes: duration,
      recurrence,
    },
  };
}

export const habitFormSchema = z.object({
  name: z.string().trim().min(1, "اكتبي اسم العادة").max(80, "اسم العادة طويل أوي"),
  description: z.string().max(300, "الوصف طويل أوي").optional(),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1, "اختاري يوم واحد على الأقل"),
});

export function validateHabitForm(values: z.input<typeof habitFormSchema>):
  | { ok: true; input: HabitInput }
  | { ok: false; errors: FieldErrors } {
  const parsed = habitFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, errors: zodToFieldErrors(parsed.error) };
  return {
    ok: true,
    input: {
      name: parsed.data.name,
      description: parsed.data.description?.trim() || undefined,
      weekdays: Array.from(new Set(parsed.data.weekdays)).sort((a, b) => a - b) as Weekday[],
    },
  };
}

export const cleaningFormSchema = z
  .object({
    roomId: z.string().min(1, "اختاري الغرفة"),
    title: z.string().trim().min(1, "اكتبي اسم مهمة التنظيف").max(120, "الاسم طويل أوي"),
    notes: z.string().max(500, "الملاحظات طويلة أوي").optional(),
    frequency: z.enum(["daily", "weekly", "monthly"]),
    weekday: z.number().int().min(0).max(6).optional(),
    dayOfMonth: z
      .string()
      .regex(/^\d*$/, "اليوم لازم يكون رقم")
      .refine((value) => {
        if (!value) return true;
        const parsed = Number(value);
        return parsed >= 1 && parsed <= 31;
      }, "يوم الشهر من 1 لـ 31"),
  })
  .superRefine((values, ctx) => {
    if (values.frequency === "monthly" && !values.dayOfMonth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dayOfMonth"],
        message: "اكتبي يوم الشهر",
      });
    }
  });

export function validateCleaningForm(
  values: z.input<typeof cleaningFormSchema>,
  startDate: string,
):
  | { ok: true; input: CleaningTaskInput }
  | { ok: false; errors: FieldErrors } {
  const parsed = cleaningFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, errors: zodToFieldErrors(parsed.error) };
  const data = parsed.data;
  return {
    ok: true,
    input: {
      roomId: data.roomId,
      title: data.title,
      notes: data.notes?.trim() || undefined,
      frequency: data.frequency,
      weekday:
        data.frequency === "weekly"
          ? ((data.weekday ?? new Date(`${startDate}T00:00:00Z`).getUTCDay()) as Weekday)
          : null,
      dayOfMonth: data.frequency === "monthly" ? Number(data.dayOfMonth) : null,
      startDate,
    },
  };
}
