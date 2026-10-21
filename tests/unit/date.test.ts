import { describe, expect, it } from "vitest";
import {
  addDays,
  addMinutesToTime,
  addMonthsClamped,
  daysInMonth,
  diffInDays,
  formatDuration,
  formatFullDate,
  formatTime,
  isWithin,
  parseIsoDate,
  relativeDayLabel,
  startOfWeek,
  timeToMinutes,
  todayIso,
  toIsoDate,
  weekDates,
  weekdayOf,
} from "@/lib/date";

describe("التواريخ المحلية", () => {
  it("يتحقق من صحة تواريخ ISO", () => {
    expect(parseIsoDate("2026-10-21")).toEqual({ year: 2026, month: 10, day: 21 });
    expect(parseIsoDate("2026-02-30")).toBeNull();
    expect(parseIsoDate("21-10-2026")).toBeNull();
    expect(parseIsoDate("2024-02-29")).not.toBeNull();
    expect(parseIsoDate("2026-02-29")).toBeNull();
  });

  it("ينسّق التاريخ بالعربي بدون أرقام هندية", () => {
    expect(formatFullDate("2026-10-21")).toBe("الأربعاء، 21 أكتوبر 2026");
    expect(formatFullDate("2026-10-21")).not.toMatch(/[٠-٩]/);
  });

  it("يبني تاريخ ISO من كائن Date محلي", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(todayIso(new Date(2026, 11, 31, 23, 30))).toBe("2026-12-31");
  });

  it("يحسب عدد أيام الشهر مع السنة الكبيسة", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2026, 4)).toBe(30);
  });

  it("يتعامل مع حدود الشهور والسنوات", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(diffInDays("2026-03-01", "2026-02-28")).toBe(1);
  });

  it("يثبّت اليوم على آخر يوم في الشهر عند التثبيت", () => {
    expect(addMonthsClamped("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsClamped("2024-01-31", 1)).toBe("2024-02-29");
    expect(addMonthsClamped("2026-12-15", 1)).toBe("2027-01-15");
    expect(addMonthsClamped("2026-03-31", -1)).toBe("2026-02-28");
  });

  it("يحسب يوم الأسبوع وبداية الأسبوع", () => {
    expect(weekdayOf("2026-10-21")).toBe(3); // الأربع
    expect(startOfWeek("2026-10-21", 6)).toBe("2026-10-17"); // السبت
    expect(startOfWeek("2026-10-21", 0)).toBe("2026-10-18"); // الأحد
    expect(startOfWeek("2026-10-17", 6)).toBe("2026-10-17");
    expect(weekDates("2026-10-21", 6)).toEqual([
      "2026-10-17",
      "2026-10-18",
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
      "2026-10-23",
    ]);
  });

  it("يبني أسبوعًا كاملًا حتى مع تغيير السنة", () => {
    expect(weekDates("2026-01-01", 4)).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
      "2026-01-05",
      "2026-01-06",
      "2026-01-07",
    ]);
  });

  it("يتحقق من المدى", () => {
    expect(isWithin("2026-10-21", "2026-10-01")).toBe(true);
    expect(isWithin("2026-10-21", "2026-10-01", "2026-10-20")).toBe(false);
    expect(isWithin("2026-10-21", "2026-10-01", "2026-10-21")).toBe(true);
  });

  it("ينسّق الأوقات والمدة", () => {
    expect(formatTime("05:30")).toBe("5:30 ص");
    expect(formatTime("13:05")).toBe("1:05 م");
    expect(formatTime("00:00")).toBe("12:00 ص");
    expect(formatTime("12:00")).toBe("12:00 م");
    expect(formatDuration(30)).toBe("30 دقيقة");
    expect(formatDuration(60)).toBe("ساعة");
    expect(formatDuration(120)).toBe("ساعتين");
    expect(formatDuration(90)).toBe("ساعة و30 دقيقة");
  });

  it("يحوّل بين الوقت والدقايق", () => {
    expect(timeToMinutes("06:30")).toBe(390);
    expect(timeToMinutes("")).toBeNull();
    expect(timeToMinutes(null)).toBeNull();
    expect(addMinutesToTime("23:50", 20)).toBe("00:10");
  });

  it("يسمّي الأيام النسبية", () => {
    expect(relativeDayLabel("2026-10-21", "2026-10-21")).toBe("النهاردة");
    expect(relativeDayLabel("2026-10-22", "2026-10-21")).toBe("بكرة");
    expect(relativeDayLabel("2026-10-20", "2026-10-21")).toBe("امبارح");
  });
});
