import type {
  AdhkarPeriod,
  AppData,
  CleaningFrequency,
  CleaningTaskInput,
  HabitInput,
  IsoDate,
  MealIdeaInput,
  Room,
  Task,
  TaskInput,
  UserSettings,
  Weekday,
} from "@/types/domain";
import { createId } from "@/lib/id";
import { addDays, isAfter, isBefore, maxDate, todayIso } from "@/lib/date";
import { DEFAULT_SETTINGS, createEmptyData } from "@/lib/defaults";
import { applyHousePlan } from "@/data/housePlan";

/** كل الدوال هنا نقية: ترجع نسخة جديدة من البيانات بدون تعديل الأصل */

function nowIso(): string {
  return new Date().toISOString();
}

export function addTask(
  data: AppData,
  input: TaskInput,
  now: string = nowIso(),
): { data: AppData; task: Task } {
  const task: Task = {
    id: createId(),
    title: input.title.trim(),
    notes: input.notes?.trim() || undefined,
    category: input.category,
    priority: input.priority,
    startTime: input.startTime ?? null,
    durationMinutes: input.durationMinutes ?? null,
    recurrence: input.recurrence,
    createdAt: now,
    updatedAt: now,
  };
  return { data: { ...data, tasks: [...data.tasks, task] }, task };
}

export function updateTask(data: AppData, taskId: string, input: TaskInput): AppData {
  return {
    ...data,
    tasks: data.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            title: input.title.trim(),
            notes: input.notes?.trim() || undefined,
            category: input.category,
            priority: input.priority,
            startTime: input.startTime ?? null,
            durationMinutes: input.durationMinutes ?? null,
            recurrence: input.recurrence,
            updatedAt: nowIso(),
          }
        : task,
    ),
    // سجلات الإكمال التاريخية تبقى كما هي
  };
}

export function deleteTask(data: AppData, taskId: string): AppData {
  return {
    ...data,
    tasks: data.tasks.filter((task) => task.id !== taskId),
    taskCompletions: data.taskCompletions.filter((completion) => completion.taskId !== taskId),
  };
}

export function toggleTaskCompletion(data: AppData, taskId: string, date: IsoDate): AppData {
  const existing = data.taskCompletions.find(
    (completion) => completion.taskId === taskId && completion.date === date,
  );
  if (existing) {
    return {
      ...data,
      taskCompletions: data.taskCompletions.filter((completion) => completion.id !== existing.id),
    };
  }
  return {
    ...data,
    taskCompletions: [
      ...data.taskCompletions,
      { id: createId(), taskId, date, completedAt: nowIso() },
    ],
  };
}

/**
 * إعادة جدولة مهمة لتاريخ جديد.
 * - مرة واحدة: بيتغيّر تاريخها.
 * - متكررة: بننقل بداية السلسلة (مع ضم يوم الهدف في التكرار الأسبوعي)،
 *   عشان المهمة تظهر في اليوم الجديد من غير ما نلمس سجلات الإكمال القديمة.
 */
export function rescheduleTask(data: AppData, taskId: string, targetDate: IsoDate): AppData {
  return {
    ...data,
    tasks: data.tasks.map((task) => {
      if (task.id !== taskId) return task;
      const recurrence = task.recurrence;
      if (recurrence.type === "once") {
        return { ...task, recurrence: { ...recurrence, date: targetDate }, updatedAt: nowIso() };
      }
      const weekdaysFromTarget = Number(targetDate.slice(8, 10));
      const startDate = isBefore(targetDate, recurrence.startDate) ? targetDate : recurrence.startDate;
      if (recurrence.type === "monthly") {
        return {
          ...task,
          recurrence: { ...recurrence, startDate, dayOfMonth: weekdaysFromTarget },
          updatedAt: nowIso(),
        };
      }
      // يومي/أسبوعي: التاريخ الجديد لازم يكون ضمن السلسلة
      const shiftedStart = isAfter(recurrence.startDate, targetDate) ? targetDate : recurrence.startDate;
      return {
        ...task,
        recurrence: { ...recurrence, startDate: shiftedStart },
        updatedAt: nowIso(),
      };
    }),
  };
}

/**
 * تأجيل مهمة يوم واحد. المهام المتكررة بترجع زي ما هي عن قصد،
 * لأن تأجيل نسخة واحدة كان هيحتاج نظام استثناءات كامل.
 */
export function snoozeTask(data: AppData, taskId: string, from: IsoDate): AppData {
  const task = data.tasks.find((item) => item.id === taskId);
  if (!task) return data;
  if (task.recurrence.type !== "once") return data;
  return rescheduleTask(data, taskId, addDays(from, 1));
}

export function canSnooze(task: Task): boolean {
  return task.recurrence.type === "once";
}

export function updateSettings(data: AppData, settings: Partial<UserSettings>): AppData {
  return { ...data, settings: { ...data.settings, ...settings } };
}

export function completeOnboarding(
  data: AppData,
  settings: Pick<
    UserSettings,
    "displayName" | "wakeUpTime" | "bedTime" | "weekStartsOn" | "routineTemplate"
  >,
): AppData {
  // لو الإعداد خلص قبل كده، مانلمسش البيانات الموجودة
  if (data.settings.onboardingCompleted) {
    return { ...data, settings: { ...data.settings, ...settings, onboardingCompleted: true } };
  }
  const onboarded: AppData = {
    ...data,
    settings: { ...data.settings, ...settings, onboardingCompleted: true, createdAt: nowIso() },
  };
  // خطة البيت (عبادة + تنظيف + غسيل + غدا) تتطبق مرة واحدة أول ما الإعداد يخلص
  return applyHousePlan(onboarded, todayIso());
}

// ---------------------------------------------------------------------------
// الغرف والتنظيف
// ---------------------------------------------------------------------------

function nextRoomOrder(rooms: readonly Room[]): number {
  return rooms.reduce((max, room) => Math.max(max, room.order), -1) + 1;
}

export function addRoom(data: AppData, name: string, emoji = "🏠"): { data: AppData; room: Room } {
  const room: Room = {
    id: createId(),
    name: name.trim(),
    emoji,
    order: nextRoomOrder(data.rooms),
    createdAt: nowIso(),
  };
  return { data: { ...data, rooms: [...data.rooms, room] }, room };
}

export function renameRoom(data: AppData, roomId: string, name: string): AppData {
  return {
    ...data,
    rooms: data.rooms.map((room) => (room.id === roomId ? { ...room, name: name.trim() } : room)),
  };
}

export function deleteRoom(data: AppData, roomId: string): AppData {
  const taskIds = new Set(
    data.cleaningTasks.filter((task) => task.roomId === roomId).map((task) => task.id),
  );
  return {
    ...data,
    rooms: data.rooms.filter((room) => room.id !== roomId),
    cleaningTasks: data.cleaningTasks.filter((task) => task.roomId !== roomId),
    cleaningCompletions: data.cleaningCompletions.filter(
      (completion) => !taskIds.has(completion.cleaningTaskId),
    ),
  };
}

export function addCleaningTask(
  data: AppData,
  input: CleaningTaskInput,
): { data: AppData; id: string } {
  const id = createId();
  return {
    id,
    data: {
      ...data,
      cleaningTasks: [
        ...data.cleaningTasks,
        {
          id,
          roomId: input.roomId,
          title: input.title.trim(),
          notes: input.notes?.trim() || undefined,
          frequency: input.frequency,
          weekday: input.weekday ?? null,
          dayOfMonth: input.dayOfMonth ?? null,
          startDate: input.startDate ?? todayIso(),
          createdAt: nowIso(),
        },
      ],
    },
  };
}

export function updateCleaningTask(
  data: AppData,
  taskId: string,
  input: CleaningTaskInput,
): AppData {
  return {
    ...data,
    cleaningTasks: data.cleaningTasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            roomId: input.roomId,
            title: input.title.trim(),
            notes: input.notes?.trim() || undefined,
            frequency: input.frequency,
            weekday: input.weekday ?? null,
            dayOfMonth: input.dayOfMonth ?? null,
            startDate: input.startDate ?? task.startDate,
          }
        : task,
    ),
  };
}

export function deleteCleaningTask(data: AppData, taskId: string): AppData {
  return {
    ...data,
    cleaningTasks: data.cleaningTasks.filter((task) => task.id !== taskId),
    cleaningCompletions: data.cleaningCompletions.filter(
      (completion) => completion.cleaningTaskId !== taskId,
    ),
  };
}

export function toggleCleaningCompletion(
  data: AppData,
  cleaningTaskId: string,
  date: IsoDate,
): AppData {
  const existing = data.cleaningCompletions.find(
    (completion) => completion.cleaningTaskId === cleaningTaskId && completion.date === date,
  );
  if (existing) {
    return {
      ...data,
      cleaningCompletions: data.cleaningCompletions.filter(
        (completion) => completion.id !== existing.id,
      ),
    };
  }
  return {
    ...data,
    cleaningCompletions: [
      ...data.cleaningCompletions,
      { id: createId(), cleaningTaskId, date, completedAt: nowIso() },
    ],
  };
}

export function frequencyDefaults(
  frequency: CleaningFrequency,
  today: IsoDate,
): { weekday: number | null; dayOfMonth: number | null } {
  if (frequency === "weekly") {
    return { weekday: Number(new Date(`${today}T00:00:00Z`).getUTCDay()), dayOfMonth: null };
  }
  if (frequency === "monthly") {
    return { weekday: null, dayOfMonth: Number(today.slice(8, 10)) };
  }
  return { weekday: null, dayOfMonth: null };
}

// ---------------------------------------------------------------------------
// العادات
// ---------------------------------------------------------------------------

export function addHabit(data: AppData, input: HabitInput): { data: AppData; id: string } {
  const id = createId();
  return {
    id,
    data: {
      ...data,
      habits: [
        ...data.habits,
        {
          id,
          name: input.name.trim(),
          description: input.description?.trim() || undefined,
          weekdays: Array.from(new Set(input.weekdays)).sort((a, b) => a - b),
          createdAt: nowIso(),
        },
      ],
    },
  };
}

export function updateHabit(data: AppData, habitId: string, input: HabitInput): AppData {
  return {
    ...data,
    habits: data.habits.map((habit) =>
      habit.id === habitId
        ? {
            ...habit,
            name: input.name.trim(),
            description: input.description?.trim() || undefined,
            weekdays: Array.from(new Set(input.weekdays)).sort((a, b) => a - b),
          }
        : habit,
    ),
  };
}

export function deleteHabit(data: AppData, habitId: string): AppData {
  return {
    ...data,
    habits: data.habits.filter((habit) => habit.id !== habitId),
    habitCompletions: data.habitCompletions.filter((completion) => completion.habitId !== habitId),
  };
}

export function toggleHabitCompletion(
  data: AppData,
  habitId: string,
  date: IsoDate,
): AppData {
  const existing = data.habitCompletions.find(
    (completion) => completion.habitId === habitId && completion.date === date,
  );
  if (existing) {
    return {
      ...data,
      habitCompletions: data.habitCompletions.filter((completion) => completion.id !== existing.id),
    };
  }
  return {
    ...data,
    habitCompletions: [
      ...data.habitCompletions,
      { id: createId(), habitId, date, completedAt: nowIso() },
    ],
  };
}

/** تصفير التطبيق: يرجع لبيانات البداية (غرف ومهام تنظيف افتراضية، بدون إعداد شخصي) */
export function resetAll(): AppData {
  return createEmptyData(DEFAULT_SETTINGS);
}

/** أحدث تاريخ إكمال لمهمة تنظيف (أو null) */
export function lastCleaningCompletionDate(
  data: AppData,
  cleaningTaskId: string,
): IsoDate | null {
  const dates = data.cleaningCompletions
    .filter((completion) => completion.cleaningTaskId === cleaningTaskId)
    .map((completion) => completion.date);
  return dates.length > 0 ? maxDate(...dates) : null;
}

// ---------------------------------------------------------------------------
// اقتراحات الغدا
// ---------------------------------------------------------------------------

export function addMealIdea(
  data: AppData,
  input: MealIdeaInput,
): { data: AppData; id: string } {
  const id = createId();
  return {
    id,
    data: {
      ...data,
      meals: [
        ...data.meals,
        {
          id,
          weekday: input.weekday,
          title: input.title.trim(),
          notes: input.notes?.trim() || undefined,
          createdAt: nowIso(),
        },
      ],
    },
  };
}

export function updateMealIdea(data: AppData, mealId: string, input: MealIdeaInput): AppData {
  return {
    ...data,
    meals: data.meals.map((meal) =>
      meal.id === mealId
        ? {
            ...meal,
            weekday: input.weekday,
            title: input.title.trim(),
            notes: input.notes?.trim() || undefined,
          }
        : meal,
    ),
  };
}

export function deleteMealIdea(data: AppData, mealId: string): AppData {
  return { ...data, meals: data.meals.filter((meal) => meal.id !== mealId) };
}

/**
 * «بدّلي» — تنقل الاقتراح الأساسي لآخر اليوم وتخلّي اللي بعده أساسي.
 * بتغيّر ترتيب نفس الأيام بس، بدون حذف أي اقتراح.
 */
export function rotateMealIdea(data: AppData, weekday: Weekday): AppData {
  const dayMeals = data.meals.filter((meal) => meal.weekday === weekday);
  if (dayMeals.length < 2) return data;
  const first = dayMeals[0];
  if (!first) return data;
  const others = data.meals.filter((meal) => meal.id !== first.id);
  const lastIndex = others.map((meal) => meal.weekday).lastIndexOf(weekday);
  const next = others.slice();
  next.splice(lastIndex + 1, 0, first);
  return { ...data, meals: next };
}

// ---------------------------------------------------------------------------
// عدّاد الأذكار
// ---------------------------------------------------------------------------

export function getAdhkarCount(
  data: AppData,
  itemId: string,
  date: IsoDate,
): number {
  return (
    data.adhkarProgress.find((entry) => entry.itemId === itemId && entry.date === date)?.count ?? 0
  );
}

export function setAdhkarCount(
  data: AppData,
  input: { itemId: string; period: AdhkarPeriod; date: IsoDate },
  count: number,
): AppData {
  const safeCount = Math.max(0, Math.min(1000, Math.round(count)));
  const existing = data.adhkarProgress.find(
    (entry) => entry.itemId === input.itemId && entry.date === input.date,
  );
  if (safeCount === 0) {
    return data.adhkarProgress.some(
      (entry) => entry.itemId === input.itemId && entry.date === input.date,
    )
      ? {
          ...data,
          adhkarProgress: data.adhkarProgress.filter(
            (entry) => !(entry.itemId === input.itemId && entry.date === input.date),
          ),
        }
      : data;
  }
  if (existing) {
    return {
      ...data,
      adhkarProgress: data.adhkarProgress.map((entry) =>
        entry.id === existing.id ? { ...entry, count: safeCount, updatedAt: nowIso() } : entry,
      ),
    };
  }
  return {
    ...data,
    adhkarProgress: [
      ...data.adhkarProgress,
      {
        id: createId(),
        itemId: input.itemId,
        period: input.period,
        date: input.date,
        count: safeCount,
        updatedAt: nowIso(),
      },
    ],
  };
}

export function incrementAdhkar(
  data: AppData,
  input: { itemId: string; period: AdhkarPeriod; date: IsoDate; step: number; target: number },
): AppData {
  const current = getAdhkarCount(data, input.itemId, input.date);
  const next = Math.min(input.target, current + input.step);
  return setAdhkarCount(data, input, next);
}

export function resetAdhkar(
  data: AppData,
  input: { itemId: string; period: AdhkarPeriod; date: IsoDate },
): AppData {
  return setAdhkarCount(data, input, 0);
}

/** يطبّق خطة البيت يدويًا (زر «إعادة تطبيق الخطة» في الإعدادات) */
export function reapplyHousePlan(data: AppData, today: IsoDate): AppData {
  return applyHousePlan(
    { ...data, settings: { ...data.settings, housePlanVersion: 0 } },
    today,
  );
}
