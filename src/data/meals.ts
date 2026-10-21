import type { MealIdea, Weekday } from "@/types/domain";
import { createId } from "@/lib/id";

/**
 * اقتراحات الغدا: أكلة أساسية + بدائل لكل يوم، وكلها قابلة للتعديل والحذف.
 * الترتيب داخل كل يوم هو اللي بيحدد الاقتراح الأساسي، وزر «بدّلي» بيلفّ الترتيب.
 */

export interface MealSeed {
  weekday: Weekday;
  title: string;
  notes?: string;
}

export const MEAL_SEEDS: readonly MealSeed[] = [
  // السبت
  { weekday: 6, title: "ملوخية وفراخ مشوية", notes: "مع رز أبيض وسلطة خضرا" },
  { weekday: 6, title: "كبسة فراخ", notes: "بصلصة الطماطم والزبادي" },
  { weekday: 6, title: "سمك مشوي ورز صيادية", notes: "لو فيه سمك طازة في السوق" },
  // الأحد
  { weekday: 0, title: "مسقعة بالبشاميل ورز", notes: "من غير لحمة، ومعاها سلطة" },
  { weekday: 0, title: "بامية باللحمة", notes: "مع رز أبيض" },
  { weekday: 0, title: "كفتة ورز بشعيرية", notes: "مع سلطة طحينة" },
  // الاتنين
  { weekday: 1, title: "رز معمر وفراخ بالفرن", notes: "أكلة البداية الأسبوع" },
  { weekday: 1, title: "مكرونة بشاميل", notes: "مع سلطة خضرا" },
  { weekday: 1, title: "شكشوكة بالبيض", notes: "عشا سريع أو غدا خفيف" },
  // التلات
  { weekday: 2, title: "صيادية سمك", notes: "مع رز بني وسلطة" },
  { weekday: 2, title: "محشي كرنب وورق عنب", notes: "اعمليه كمية وتتجمّد" },
  { weekday: 2, title: "بطاطس بالفرن وفراخ بالردة", notes: "صينية واحدة على الفرن" },
  // الأربع
  { weekday: 3, title: "فاصوليا بيضاء باللحمة", notes: "مع رز أبيض" },
  { weekday: 3, title: "لسان عصفور بالفراخ", notes: "مع شوربة" },
  { weekday: 3, title: "طاجن بطاطس باللحمة", notes: "في الفرن" },
  // الخميس
  { weekday: 4, title: "كباب حلة", notes: "مع رز وسلطة" },
  { weekday: 4, title: "رز بخاري بالفراخ", notes: "مع بهارات البخاري" },
  { weekday: 4, title: "كفتة داود باشا", notes: "مع مكرونة" },
  // الجمعة
  { weekday: 5, title: "فتة باللحمة", notes: "غدا الجمعة مع العيلة" },
  { weekday: 5, title: "محشي مشكل", notes: "يجهز من بدري" },
  { weekday: 5, title: "بيتزا منزلية وسلطة", notes: "لو اليوم خفيف" },
];

export function buildDefaultMeals(now: string = new Date().toISOString()): MealIdea[] {
  return MEAL_SEEDS.map((seed) => ({
    id: createId(),
    weekday: seed.weekday,
    title: seed.title,
    notes: seed.notes,
    createdAt: now,
  }));
}

/** الدوال المساعدة في lib/meals — إعادة تصدير للاستخدام من طبقة البيانات */
export { primaryMeal, mealForDate, mealsForWeekday } from "@/lib/meals";
export { mealAlternatives as alternativesForDay } from "@/lib/meals";
