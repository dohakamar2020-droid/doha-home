import type { MealIdea, Weekday } from "@/types/domain";
import { weekdayOf } from "@/lib/date";

export function mealsForWeekday(meals: readonly MealIdea[], weekday: Weekday): MealIdea[] {
  return meals.filter((meal) => meal.weekday === weekday);
}

export function primaryMeal(meals: readonly MealIdea[], weekday: Weekday): MealIdea | null {
  return mealsForWeekday(meals, weekday)[0] ?? null;
}

export function mealForDate(meals: readonly MealIdea[], date: string): MealIdea | null {
  return primaryMeal(meals, weekdayOf(date));
}

export function mealAlternatives(meals: readonly MealIdea[], weekday: Weekday): MealIdea[] {
  return mealsForWeekday(meals, weekday).slice(1);
}

export function hasAlternatives(meals: readonly MealIdea[], weekday: Weekday): boolean {
  return mealsForWeekday(meals, weekday).length > 1;
}
