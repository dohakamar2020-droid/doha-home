import type { AdhkarPeriod, AdhkarProgress, IsoDate } from "@/types/domain";
import { ADHKAR_ITEMS, adhkarForPeriod, type AdhkarItem } from "@/data/adhkar";

export interface AdhkarItemState {
  item: AdhkarItem;
  count: number;
  done: boolean;
  percentage: number;
}

export function adhkarCountFor(
  progress: readonly AdhkarProgress[],
  itemId: string,
  date: IsoDate,
): number {
  return progress.find((entry) => entry.itemId === itemId && entry.date === date)?.count ?? 0;
}

export function buildAdhkarStates(
  progress: readonly AdhkarProgress[],
  period: AdhkarPeriod,
  date: IsoDate,
): AdhkarItemState[] {
  return adhkarForPeriod(period).map((item) => {
    const count = Math.min(adhkarCountFor(progress, item.id, date), item.repeat);
    return {
      item,
      count,
      done: count >= item.repeat,
      percentage: Math.round((count / item.repeat) * 100),
    };
  });
}

export interface AdhkarSummary {
  total: number;
  completed: number;
  percentage: number;
  remaining: number;
}

export function adhkarSummary(
  progress: readonly AdhkarProgress[],
  period: AdhkarPeriod,
  date: IsoDate,
): AdhkarSummary {
  const states = buildAdhkarStates(progress, period, date);
  const total = states.length;
  const completed = states.filter((state) => state.done).length;
  return {
    total,
    completed,
    remaining: total - completed,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function adhkarDaySummary(
  progress: readonly AdhkarProgress[],
  date: IsoDate,
): { morning: AdhkarSummary; evening: AdhkarSummary } {
  return {
    morning: adhkarSummary(progress, "morning", date),
    evening: adhkarSummary(progress, "evening", date),
  };
}

/** الوقت المقترح لعرض أذكار الصباح أو المساء حسب الساعة */
export function suggestedPeriod(hour: number): AdhkarPeriod {
  return hour >= 15 || hour < 4 ? "evening" : "morning";
}

export const ADHKAR_TOTAL = ADHKAR_ITEMS.length;
