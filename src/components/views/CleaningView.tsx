"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarCheck2, CalendarClock, Plus, SprayCan } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useToday } from "@/hooks/useToday";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { RoomCard } from "@/components/RoomCard";
import { CleaningChecklist, cleaningCompletionDate } from "@/components/CleaningChecklist";
import { RoomDialog } from "@/components/RoomDialog";
import { CleaningTaskForm } from "@/components/CleaningTaskForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { buildCleaningItems, sortCleaningItems } from "@/lib/cleaning";
import type { CleaningItem } from "@/lib/cleaning";
import {
  addCleaningTask,
  addRoom,
  deleteCleaningTask,
  deleteRoom,
  renameRoom,
  toggleCleaningCompletion,
  updateCleaningTask,
} from "@/lib/operations";
import { formatDayMonth } from "@/lib/date";
import type { CleaningTask, CleaningTaskInput, IsoDate, Room } from "@/types/domain";

type DeleteTarget =
  | { type: "task"; id: string; title: string }
  | { type: "room"; id: string; title: string; taskCount: number }
  | null;

export function CleaningView() {
  const { data, update, notify } = useStore();
  const today = useToday();
  const [roomDialog, setRoomDialog] = useState<{ open: boolean; room: Room | null }>({
    open: false,
    room: null,
  });
  const [taskForm, setTaskForm] = useState<{
    open: boolean;
    task: CleaningTask | null;
    roomId?: string;
  }>({ open: false, task: null });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const items = useMemo(() => (data ? buildCleaningItems(data, today) : []), [data, today]);
  const dueToday = items.filter((item) => item.isDueToday);
  const overdue = sortCleaningItems(items.filter((item) => item.isOverdue));
  const upcoming = sortCleaningItems(
    items.filter((item) => !item.isDueToday && !item.isOverdue),
  ).slice(0, 6);

  const itemsByRoom = useMemo(() => {
    const map = new Map<string, CleaningItem[]>();
    items.forEach((item) => {
      const list = map.get(item.task.roomId) ?? [];
      list.push(item);
      map.set(item.task.roomId, list);
    });
    return map;
  }, [items]);

  if (!data) return null;

  const toggle = (item: CleaningItem) => {
    const date = cleaningCompletionDate(item, today);
    update((current) => toggleCleaningCompletion(current, item.task.id, date));
    const wasCompleted = data.cleaningCompletions.some(
      (completion) => completion.cleaningTaskId === item.task.id && completion.date === date,
    );
    notify(
      wasCompleted ? "شيلنا علامة الإكمال" : `تمام! «${item.task.title}» خلصت 🌿`,
      wasCompleted ? "info" : "success",
    );
  };

  const handleTaskSubmit = (input: CleaningTaskInput) => {
    if (taskForm.task) {
      update((current) => updateCleaningTask(current, taskForm.task!.id, input));
      notify("مهمة التنظيف اتعدّلت ✅");
    } else {
      update((current) => addCleaningTask(current, input).data);
      notify("مهمة تنظيف جديدة اتضافت 🧽");
    }
    setTaskForm({ open: false, task: null });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="تنظيف البيت"
        title="خطة تنظيف بيتك"
        subtitle="مهام التنظيف مقسّمة على الغرف، وكل مهمة ليها مواعيد واضحة."
        actions={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setRoomDialog({ open: true, room: null })}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              غرفة
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setTaskForm({ open: true, task: null })}
              disabled={data.rooms.length === 0}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              مهمة تنظيف
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="card-flat">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-soft">
            <CalendarCheck2 className="h-3.5 w-3.5 text-sage-600" aria-hidden="true" />
            مستحق النهاردة
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">{dueToday.length}</p>
        </div>
        <div className="card-flat">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-soft">
            <AlertTriangle className="h-3.5 w-3.5 text-[#B4545B]" aria-hidden="true" />
            متأخر
          </p>
          <p className="mt-1 text-2xl font-bold text-[#9C4451]">{overdue.length}</p>
        </div>
        <div className="card-flat">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-soft">
            <CalendarClock className="h-3.5 w-3.5 text-sage-600" aria-hidden="true" />
            كل مهام التنظيف
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">{items.length}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={SprayCan}
          title="لسه مفيش مهام تنظيف"
          description="أضيفي مهام لتنظيف البيت، أو اعملي غرفة جديدة الأول."
          action={
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => setTaskForm({ open: true, task: null })}
              disabled={data.rooms.length === 0}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              إضافة مهمة تنظيف
            </button>
          }
        />
      ) : null}

      {overdue.length > 0 ? (
        <section className="card border-[#E7C3C6]" aria-labelledby="overdue-title">
          <h2 id="overdue-title" className="mb-3 flex items-center gap-2 text-sm font-bold text-[#9C4451]">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            متأخر عن ميعاده ({overdue.length})
          </h2>
          <CleaningChecklist
            items={overdue}
            today={today}
            onToggle={toggle}
            onEdit={(item) => setTaskForm({ open: true, task: item.task })}
            onDelete={(item) =>
              setDeleteTarget({ type: "task", id: item.task.id, title: item.task.title })
            }
            showRoom
          />
        </section>
      ) : null}

      <section className="card" aria-labelledby="due-today-title">
        <h2 id="due-today-title" className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
          <CalendarCheck2 className="h-4 w-4 text-sage-600" aria-hidden="true" />
          مستحق النهاردة ({dueToday.length})
        </h2>
        {dueToday.length === 0 ? (
          <p className="rounded-xl bg-sage-50 px-3 py-4 text-center text-xs text-ink-soft">
            مفيش تنظيف مستحق النهاردة — يوم خفيف 🌸
          </p>
        ) : (
          <CleaningChecklist
            items={dueToday}
            today={today}
            onToggle={toggle}
            onEdit={(item) => setTaskForm({ open: true, task: item.task })}
            onDelete={(item) =>
              setDeleteTarget({ type: "task", id: item.task.id, title: item.task.title })
            }
            showRoom
          />
        )}
      </section>

      {upcoming.length > 0 ? (
        <section className="card" aria-labelledby="upcoming-title">
          <h2 id="upcoming-title" className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
            <CalendarClock className="h-4 w-4 text-sage-600" aria-hidden="true" />
            الجاي في الأيام اللي جاية
          </h2>
          <ul className="space-y-2">
            {upcoming.map((item) => (
              <li
                key={item.task.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-cream/70 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-ink">{item.task.title}</p>
                  <p className="text-[10px] text-ink-soft">{item.room?.name ?? "غرفة"}</p>
                </div>
                <span className="chip shrink-0">
                  {item.nextDate ? formatDayMonth(item.nextDate) : "قريب"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="rooms-title">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="rooms-title" className="text-base font-bold text-ink">
            الغرف
          </h2>
          <p className="text-[11px] text-ink-soft">{data.rooms.length} غرفة</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {data.rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              today={today as IsoDate}
              items={itemsByRoom.get(room.id) ?? []}
              onToggle={toggle}
              onEditTask={(item) => setTaskForm({ open: true, task: item.task })}
              onDeleteTask={(item) =>
                setDeleteTarget({ type: "task", id: item.task.id, title: item.task.title })
              }
              onRenameRoom={(target) => setRoomDialog({ open: true, room: target })}
              onDeleteRoom={(target) =>
                setDeleteTarget({
                  type: "room",
                  id: target.id,
                  title: target.name,
                  taskCount: itemsByRoom.get(target.id)?.length ?? 0,
                })
              }
              onAddTask={(target) =>
                setTaskForm({ open: true, task: null, roomId: target.id })
              }
            />
          ))}
        </div>
        {data.rooms.length === 0 ? (
          <EmptyState
            icon={SprayCan}
            title="مفيش غرف لسه"
            description="ضيفي أول غرفة وبعدها ابدأي تضيفي مهام التنظيف."
            action={
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => setRoomDialog({ open: true, room: null })}
              >
                إضافة غرفة
              </button>
            }
            compact
          />
        ) : null}
      </section>

      <RoomDialog
        open={roomDialog.open}
        initialRoom={roomDialog.room}
        onClose={() => setRoomDialog({ open: false, room: null })}
        onSubmit={(name, emoji) => {
          if (roomDialog.room) {
            update((current) => {
              const renamed = renameRoom(current, roomDialog.room!.id, name);
              return {
                ...renamed,
                rooms: renamed.rooms.map((room) =>
                  room.id === roomDialog.room!.id ? { ...room, emoji } : room,
                ),
              };
            });
            notify("اسم الغرفة اتحدّث ✅");
          } else {
            update((current) => addRoom(current, name, emoji).data);
            notify("غرفة جديدة اتضافت 🏠");
          }
        }}
      />

      <CleaningTaskForm
        open={taskForm.open}
        onClose={() => setTaskForm({ open: false, task: null })}
        onSubmit={handleTaskSubmit}
        rooms={data.rooms}
        initialTask={taskForm.task}
        defaultRoomId={taskForm.roomId}
        today={today}
        weekStartsOn={data.settings.weekStartsOn}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.type === "room" ? "تحذفي الغرفة؟" : "تحذفي مهمة التنظيف؟"}
        description={
          deleteTarget?.type === "room"
            ? `«${deleteTarget.title}» هتتشال مع ${deleteTarget.taskCount} مهمة تنظيف وسجل إكمالهم.`
            : `«${deleteTarget?.title ?? ""}» هتتشال نهائي مع سجل إكمالها.`
        }
        confirmLabel="احذفي"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            if (deleteTarget.type === "room") {
              update((current) => deleteRoom(current, deleteTarget.id));
              notify("الغرفة اتحذفت", "info");
            } else {
              update((current) => deleteCleaningTask(current, deleteTarget.id));
              notify("مهمة التنظيف اتحذفت", "info");
            }
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
