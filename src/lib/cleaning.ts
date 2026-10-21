import type { AppData, CleaningTask, IsoDate, Room } from "@/types/domain";
import { addDays, compareDates, maxDate } from "@/lib/date";
import {
  isCleaningScheduledOn,
  nextCleaningDate,
  previousCleaningDate,
} from "@/lib/recurrence";

export interface CleaningItem {
  task: CleaningTask;
  room: Room | undefined;
  lastCompleted: IsoDate | null;
  /** الميعاد المستحق الحالي */
  dueDate: IsoDate | null;
  completedOnDue: boolean;
  isDueToday: boolean;
  isOverdue: boolean;
  nextDate: IsoDate | null;
}

export function buildCleaningItems(data: AppData, today: IsoDate): CleaningItem[] {
  const roomsById = new Map(data.rooms.map((room) => [room.id, room]));

  return data.cleaningTasks.map((task) => {
    const completions = data.cleaningCompletions
      .filter((completion) => completion.cleaningTaskId === task.id)
      .map((completion) => completion.date);
    const lastCompleted = completions.length > 0 ? maxDate(...completions) : null;
    const completedSet = new Set(completions);

    const latestScheduled = previousCleaningDate(task, today);
    let dueDate: IsoDate | null = latestScheduled;
    let completedOnDue = false;
    let isDueToday = false;
    let isOverdue = false;

    if (latestScheduled) {
      completedOnDue = completedSet.has(latestScheduled);
      if (latestScheduled === today) {
        isDueToday = true;
      } else if (!completedOnDue) {
        isOverdue = true;
      }
    }

    if (completedOnDue && dueDate === today) {
      dueDate = latestScheduled;
    }

    let nextDate: IsoDate | null;
    if (isDueToday && !completedOnDue) {
      nextDate = today;
    } else if (isOverdue) {
      nextDate = dueDate;
    } else {
      nextDate = nextCleaningDate(task, addDays(today, 1));
    }

    return {
      task,
      room: roomsById.get(task.roomId),
      lastCompleted,
      dueDate,
      completedOnDue,
      isDueToday,
      isOverdue,
      nextDate,
    };
  });
}

export function sortCleaningItems(items: readonly CleaningItem[]): CleaningItem[] {
  return items.slice().sort((a, b) => {
    const priority = (item: CleaningItem) => (item.isOverdue ? 0 : item.isDueToday ? 1 : 2);
    const diff = priority(a) - priority(b);
    if (diff !== 0) return diff;
    if (a.nextDate && b.nextDate) return compareDates(a.nextDate, b.nextDate);
    if (a.nextDate) return -1;
    if (b.nextDate) return 1;
    return a.task.title.localeCompare(b.task.title, "ar");
  });
}

export function dueTodayItems(items: readonly CleaningItem[]): CleaningItem[] {
  return items.filter((item) => item.isDueToday);
}

export function overdueItems(items: readonly CleaningItem[]): CleaningItem[] {
  return items.filter((item) => item.isOverdue);
}

export function upcomingItems(items: readonly CleaningItem[], limit = 8): CleaningItem[] {
  return sortCleaningItems(items.filter((item) => !item.isDueToday && !item.isOverdue)).slice(
    0,
    limit,
  );
}

export function isCleaningCompletedOn(
  data: AppData,
  cleaningTaskId: string,
  date: IsoDate,
): boolean {
  return data.cleaningCompletions.some(
    (completion) =>
      completion.cleaningTaskId === cleaningTaskId && completion.date === date,
  );
}

export function isCleaningScheduledToday(task: CleaningTask, today: IsoDate): boolean {
  return isCleaningScheduledOn(task, today);
}
