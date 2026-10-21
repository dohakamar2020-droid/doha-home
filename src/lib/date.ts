import type { IsoDate, Weekday } from "@/types/domain";

/**
 * كل التعاملات مع التواريخ هنا تعتمد على "تاريخ تقويمي محلي" بصيغة YYYY-MM-DD،
 * والحساب يتم عبر UTC لتجنّب مشاكل التوقيت الصيفي وفروق المناطق الزمنية.
 */

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export function parseIsoDate(value: string): DateParts | null {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function isValidIsoDate(value: string): boolean {
  return parseIsoDate(value) !== null;
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function toIsoDate(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** تاريخ اليوم في التوقيت المحلي للمتصفح */
export function todayIso(now: Date = new Date()): IsoDate {
  return toIsoDate(now);
}

/** كائن Date عند منتصف ليل UTC — يُستخدم للعرض فقط */
export function fromIsoDate(value: IsoDate): Date {
  const parts = parseIsoDate(value);
  if (!parts) throw new Error(`تاريخ غير صالح: ${value}`);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addDays(value: IsoDate, days: number): IsoDate {
  const parts = parseIsoDate(value);
  if (!parts) throw new Error(`تاريخ غير صالح: ${value}`);
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

/** يضيف شهورًا مع تثبيت اليوم على آخر يوم في الشهر عند الحاجة */
export function addMonthsClamped(value: IsoDate, months: number): IsoDate {
  const parts = parseIsoDate(value);
  if (!parts) throw new Error(`تاريخ غير صالح: ${value}`);
  const totalMonths = parts.year * 12 + (parts.month - 1) + months;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;
  const day = Math.min(parts.day, daysInMonth(year, month));
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** عدد الأيام من `from` إلى `to` (موجب لو `to` بعد `from`) */
export function diffInDays(to: IsoDate, from: IsoDate): number {
  return Math.round((fromIsoDate(to).getTime() - fromIsoDate(from).getTime()) / MS_PER_DAY);
}

/** 0 = الأحد */
export function weekdayOf(value: IsoDate): Weekday {
  return fromIsoDate(value).getUTCDay() as Weekday;
}

export function startOfWeek(value: IsoDate, weekStartsOn: Weekday): IsoDate {
  const weekday = weekdayOf(value);
  const offset = (weekday - weekStartsOn + 7) % 7;
  return addDays(value, -offset);
}

export function weekDates(value: IsoDate, weekStartsOn: Weekday): IsoDate[] {
  const start = startOfWeek(value, weekStartsOn);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function compareDates(a: IsoDate, b: IsoDate): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function isBefore(a: IsoDate, b: IsoDate): boolean {
  return compareDates(a, b) < 0;
}

export function isAfter(a: IsoDate, b: IsoDate): boolean {
  return compareDates(a, b) > 0;
}

export function isWithin(date: IsoDate, start: IsoDate, end?: IsoDate): boolean {
  if (isBefore(date, start)) return false;
  if (end && isAfter(date, end)) return false;
  return true;
}

export function maxDate(...dates: IsoDate[]): IsoDate {
  return dates.reduce((latest, current) => (isAfter(current, latest) ? current : latest));
}

export function minDate(...dates: IsoDate[]): IsoDate {
  return dates.reduce((earliest, current) => (isBefore(current, earliest) ? current : earliest));
}

// ---------------------------------------------------------------------------
// التنسيق العربي
// ---------------------------------------------------------------------------

const AR_LOCALE = "ar-EG-u-nu-latn";

function formatWith(options: Intl.DateTimeFormatOptions, value: IsoDate): string {
  return new Intl.DateTimeFormat(AR_LOCALE, { ...options, timeZone: "UTC" }).format(
    fromIsoDate(value),
  );
}

export function formatFullDate(value: IsoDate): string {
  return formatWith({ weekday: "long", day: "numeric", month: "long", year: "numeric" }, value);
}

export function formatDayMonth(value: IsoDate): string {
  return formatWith({ day: "numeric", month: "long" }, value);
}

export function formatMonthYear(value: IsoDate): string {
  return formatWith({ month: "long", year: "numeric" }, value);
}

export function formatWeekday(value: IsoDate): string {
  return formatWith({ weekday: "long" }, value);
}

/** اسم اليوم + الشهر بصيغة قصيرة: «الأحد 21 أكتوبر» */
export function formatDayLabel(value: IsoDate): string {
  return formatWith({ weekday: "long", day: "numeric", month: "long" }, value);
}

export function formatTime(value: string): string {
  const [hoursPart, minutesPart] = value.split(":");
  const hours = Number(hoursPart);
  const minutes = minutesPart ?? "00";
  if (!Number.isFinite(hours)) return value;
  const suffix = hours < 12 ? "ص" : "م";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutes} ${suffix}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourLabel = hours === 1 ? "ساعة" : hours === 2 ? "ساعتين" : `${hours} ساعات`;
  if (rest === 0) return hourLabel;
  return `${hourLabel} و${rest} دقيقة`;
}

/** «النهاردة» / «بكرة» / «امبارح» أو اسم اليوم */
export function relativeDayLabel(value: IsoDate, reference: IsoDate): string {
  const difference = diffInDays(value, reference);
  if (difference === 0) return "النهاردة";
  if (difference === 1) return "بكرة";
  if (difference === -1) return "امبارح";
  return formatWeekday(value);
}

export function timeToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function minutesToTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(normalized / 60))}:${pad2(normalized % 60)}`;
}

export function addMinutesToTime(value: string, minutes: number): string {
  const start = timeToMinutes(value);
  if (start === null) return value;
  return minutesToTime(start + minutes);
}

/** يعيد ترتيب أيام الأسبوع حسب بداية الأسبوع المختارة */
export function orderedWeekdays(weekStartsOn: Weekday): Weekday[] {
  return Array.from({ length: 7 }, (_, index) => ((weekStartsOn + index) % 7) as Weekday);
}
