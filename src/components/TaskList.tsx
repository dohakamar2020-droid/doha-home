"use client";

import { TaskCard } from "@/components/TaskCard";
import type { IsoDate, Task, TaskCompletion } from "@/types/domain";
import { isTaskCompleted, sortTasksByTime } from "@/lib/progress";

interface TaskListProps {
  tasks: readonly Task[];
  date: IsoDate;
  completions: readonly TaskCompletion[];
  onToggle: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onReschedule?: (task: Task, date: IsoDate) => void;
  emptyState?: React.ReactNode;
  ariaLabel?: string;
  sort?: boolean;
}

export function TaskList({
  tasks,
  date,
  completions,
  onToggle,
  onEdit,
  onDelete,
  onReschedule,
  emptyState,
  ariaLabel = "قائمة المهام",
  sort = true,
}: TaskListProps) {
  const ordered = sort ? sortTasksByTime(tasks) : tasks;

  if (ordered.length === 0) {
    return emptyState ? <>{emptyState}</> : null;
  }

  return (
    <ul className="space-y-2" aria-label={ariaLabel}>
      {ordered.map((task) => (
        <li key={task.id}>
          <TaskCard
            task={task}
            date={date}
            completed={isTaskCompleted(completions, task.id, date)}
            onToggle={() => onToggle(task.id)}
            onEdit={onEdit ? () => onEdit(task) : undefined}
            onDelete={onDelete ? () => onDelete(task) : undefined}
            onReschedule={
              onReschedule ? (target) => onReschedule(task, target) : undefined
            }
          />
        </li>
      ))}
    </ul>
  );
}
