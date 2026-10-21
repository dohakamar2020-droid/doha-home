import type { IsoDate, Task, TaskCompletion } from "@/types/domain";
import { timeToMinutes } from "@/lib/date";

export interface DayProgress {
  total: number;
  completed: number;
  remaining: number;
  percentage: number;
}

export function isTaskCompleted(
  completions: readonly TaskCompletion[],
  taskId: string,
  date: IsoDate,
): boolean {
  return completions.some((completion) => completion.taskId === taskId && completion.date === date);
}

export function getCompletionFor(
  completions: readonly TaskCompletion[],
  taskId: string,
  date: IsoDate,
): TaskCompletion | undefined {
  return completions.find(
    (completion) => completion.taskId === taskId && completion.date === date,
  );
}

/** ترتيب المهام حسب وقت البداية، وغير المجدولة في الآخر */
export function sortTasksByTime(tasks: readonly Task[]): Task[] {
  return tasks.slice().sort((a, b) => {
    const aTime = timeToMinutes(a.startTime ?? null);
    const bTime = timeToMinutes(b.startTime ?? null);
    if (aTime === null && bTime === null) return a.createdAt.localeCompare(b.createdAt);
    if (aTime === null) return 1;
    if (bTime === null) return -1;
    return aTime - bTime;
  });
}

export function calculateProgress(
  tasks: readonly Task[],
  completions: readonly TaskCompletion[],
  date: IsoDate,
): DayProgress {
  const total = tasks.length;
  const completed = tasks.filter((task) => isTaskCompleted(completions, task.id, date)).length;
  const remaining = total - completed;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, remaining, percentage };
}

export function completedCountForDate(
  completions: readonly TaskCompletion[],
  date: IsoDate,
): number {
  return completions.filter((completion) => completion.date === date).length;
}

/** المهمة القادمة غير المكتملة اليوم حسب الوقت الحالي */
export function getUpcomingTask(
  tasks: readonly Task[],
  completions: readonly TaskCompletion[],
  date: IsoDate,
  currentTime: string,
): Task | null {
  const currentMinutes = timeToMinutes(currentTime);
  const scheduled = sortTasksByTime(tasks).filter(
    (task) => task.startTime && !isTaskCompleted(completions, task.id, date),
  );
  if (scheduled.length === 0) return null;
  if (currentMinutes === null) return scheduled[0] ?? null;
  const upcoming = scheduled.find((task) => (timeToMinutes(task.startTime ?? null) ?? 0) >= currentMinutes);
  return upcoming ?? scheduled[0] ?? null;
}
