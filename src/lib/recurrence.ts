import type { CleaningTask, Habit, IsoDate, Recurrence, Task, Weekday } from "@/types/domain";
import { WEEKDAY_LABELS, PRIORITY_LABELS } from "@/types/domain";
import {
  addDays,
  addMonthsClamped,
  daysInMonth,
  isAfter,
  isBefore,
  isWithin,
  parseIsoDate,
  weekdayOf,
} from "@/lib/date";

/**
 * قواعد التكرار:
 * - مرة واحدة: تظهر في تاريخها فقط.
 * - يومي: كل يوم من تاريخ البداية (شاملًا) حتى تاريخ النهاية إن وُجد.
 * - أسبوعي: أيام الأسبوع المختارة داخل المدى.
 * - شهري: يوم الشهر المختار. لو الشهر أقصر من اليوم المطلوب
 *   (مثل 31 في شهر 30 يومًا) تُنفَّذ المهمة في آخر يوم من الشهر.
 *   هذا السلوك موثّق في README وفي واجهة نموذج المهمة.
 *
 * لا يتم توليد نسخ مهام غير محدودة أبدًا؛ التكرار يُحسب عند الطلب لكل تاريخ.
 */

export function occursOn(task: Task, date: IsoDate): boolean {
  return recurrenceOccursOn(task.recurrence, date);
}

export function recurrenceOccursOn(recurrence: Recurrence, date: IsoDate): boolean {
  switch (recurrence.type) {
    case "once":
      return recurrence.date === date;
    case "daily":
      return isWithin(date, recurrence.startDate, recurrence.endDate);
    case "weekly": {
      if (!isWithin(date, recurrence.startDate, recurrence.endDate)) return false;
      return recurrence.weekdays.includes(weekdayOf(date));
    }
    case "monthly": {
      if (!isWithin(date, recurrence.startDate, recurrence.endDate)) return false;
      const parts = parseIsoDate(date);
      if (!parts) return false;
      const effectiveDay = Math.min(recurrence.dayOfMonth, daysInMonth(parts.year, parts.month));
      return parts.day === effectiveDay;
    }
    default:
      return false;
  }
}

/** أول تاريخ يظهر فيه التكرار (بداية صلاحية المهمة) */
export function recurrenceStart(recurrence: Recurrence): IsoDate {
  return recurrence.type === "once" ? recurrence.date : recurrence.startDate;
}

export function recurrenceEnd(recurrence: Recurrence): IsoDate | undefined {
  return recurrence.type === "once" ? recurrence.date : recurrence.endDate;
}

/**
 * هل التاريخ جزء من سلسلة التكرار؟ (بغض النظر عن تطابق اليوم)
 * يُستخدم لتقرير ما إذا كانت المهمة "مستحقة" في ذلك اليوم حتى لو لم تتكرر فيه،
 * ولحماية سجلات الإكمال التاريخية عند تعديل المهمة.
 */
export function isRecurrenceActiveOn(recurrence: Recurrence, date: IsoDate): boolean {
  const start = recurrenceStart(recurrence);
  const end = recurrenceEnd(recurrence);
  return isWithin(date, start, end);
}

export function occurrenceIndex(recurrence: Recurrence, date: IsoDate): number | null {
  if (!recurrenceOccursOn(recurrence, date)) return null;
  if (recurrence.type === "once") return 0;
  const start = recurrenceStart(recurrence);
  if (recurrence.type === "daily") {
    return Math.round(
      (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000,
    );
  }
  if (recurrence.type === "weekly") {
    // عدد الأسابيع منذ بداية السلسلة
    return Math.floor(
      (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / (86_400_000 * 7),
    );
  }
  return null;
}

/** يحسب أول موعد قادم للمهمة المتكررة بعد تاريخ معيّن (بحث محدود) */
export function nextOccurrenceAfter(task: Task, date: IsoDate, limitDays = 400): IsoDate | null {
  if (task.recurrence.type === "once") {
    return isAfter(task.recurrence.date, date) ? task.recurrence.date : null;
  }
  let cursor = addDays(date, 1);
  for (let index = 0; index < limitDays; index += 1) {
    if (occursOn(task, cursor)) return cursor;
    cursor = addDays(cursor, 1);
  }
  return null;
}

export function isCleaningScheduledOn(task: CleaningTask, date: IsoDate): boolean {
  if (isBefore(date, task.startDate)) return false;
  if (task.frequency === "daily") return true;
  if (task.frequency === "weekly") {
    const weekday = task.weekday ?? weekdayOf(task.startDate);
    return weekdayOf(date) === weekday;
  }
  const parts = parseIsoDate(date);
  if (!parts) return false;
  const requested = task.dayOfMonth ?? Number(task.startDate.slice(8, 10));
  const effectiveDay = Math.min(requested, daysInMonth(parts.year, parts.month));
  return parts.day === effectiveDay;
}

/** موعد التنظيف القادم (بعد اليوم أو اليوم نفسه) */
export function nextCleaningDate(task: CleaningTask, from: IsoDate, limitDays = 400): IsoDate | null {
  let cursor = from;
  for (let index = 0; index < limitDays; index += 1) {
    if (isCleaningScheduledOn(task, cursor)) return cursor;
    cursor = addDays(cursor, 1);
  }
  return null;
}

/** موعد سابق للتنظيف (أو اليوم) — يُستخدم لمعرفة آخر موعد مستحق */
export function previousCleaningDate(
  task: CleaningTask,
  from: IsoDate,
  limitDays = 400,
): IsoDate | null {
  let cursor = from;
  for (let index = 0; index < limitDays; index += 1) {
    if (isCleaningScheduledOn(task, cursor)) return cursor;
    cursor = addDays(cursor, -1);
  }
  return null;
}

export function isHabitScheduledOn(habit: Habit, date: IsoDate): boolean {
  if (isBefore(date, habit.createdAt.slice(0, 10))) return false;
  return habit.weekdays.includes(weekdayOf(date));
}

export function describeRecurrence(recurrence: Recurrence): string {
  switch (recurrence.type) {
    case "once":
      return "مرة واحدة";
    case "daily":
      return recurrence.endDate ? "كل يوم (حتى تاريخ محدد)" : "كل يوم";
    case "weekly": {
      const days = recurrence.weekdays
        .slice()
        .sort((a, b) => a - b)
        .map((day: Weekday) => WEEKDAY_LABELS[day])
        .join(" و");
      return `كل ${days}`;
    }
    case "monthly":
      return `كل شهر يوم ${recurrence.dayOfMonth}`;
    default:
      return "";
  }
}

export function describeCleaningSchedule(task: CleaningTask): string {
  switch (task.frequency) {
    case "daily":
      return "كل يوم";
    case "weekly": {
      const weekday = task.weekday ?? weekdayOf(task.startDate);
      return `كل ${WEEKDAY_LABELS[weekday]}`;
    }
    case "monthly": {
      const day = task.dayOfMonth ?? Number(task.startDate.slice(8, 10));
      return `كل شهر يوم ${day}`;
    }
    default:
      return "";
  }
}

export function describePriority(priority: Task["priority"]): string {
  return PRIORITY_LABELS[priority];
}

/** يحسب موعد إعادة المهمة لليوم التالي (أو الشهر التالي) عند إعادة الجدولة */
export function nextDateForReschedule(task: Task, from: IsoDate): IsoDate {
  if (task.recurrence.type === "monthly") return addMonthsClamped(from, 1);
  return addDays(from, 1);
}
