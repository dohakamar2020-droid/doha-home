"use client";

import { useState } from "react";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import type { CleaningItem } from "@/lib/cleaning";
import { CleaningChecklist } from "@/components/CleaningChecklist";
import type { IsoDate, Room } from "@/types/domain";

interface RoomCardProps {
  room: Room;
  items: readonly CleaningItem[];
  today: IsoDate;
  onToggle: (item: CleaningItem) => void;
  onEditTask: (item: CleaningItem) => void;
  onDeleteTask: (item: CleaningItem) => void;
  onRenameRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
  onAddTask: (room: Room) => void;
}

export function RoomCard({
  room,
  items,
  today,
  onToggle,
  onEditTask,
  onDeleteTask,
  onRenameRoom,
  onDeleteRoom,
  onAddTask,
}: RoomCardProps) {
  const [expanded, setExpanded] = useState(false);
  const overdue = items.filter((item) => item.isOverdue).length;
  const dueToday = items.filter((item) => item.isDueToday).length;
  const panelId = `room-panel-${room.id}`;

  return (
    <section className="card" aria-labelledby={`room-title-${room.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="text-xl" aria-hidden="true">
            {room.emoji ?? "🏠"}
          </span>
          <div className="min-w-0">
            <h3 id={`room-title-${room.id}`} className="truncate text-sm font-bold text-ink">
              {room.name}
            </h3>
            <p className="mt-0.5 text-[11px] font-medium text-ink-soft">
              {items.length} مهمة تنظيف
              {dueToday > 0 ? ` • ${dueToday} النهاردة` : ""}
              {overdue > 0 ? ` • ${overdue} متأخر` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="icon-btn h-8 w-8"
            onClick={() => onAddTask(room)}
            aria-label={`إضافة مهمة تنظيف لـ ${room.name}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn h-8 w-8"
            onClick={() => onRenameRoom(room)}
            aria-label={`تغيير اسم ${room.name}`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn h-8 w-8 text-[#9C4451] hover:bg-[#FDF3F4]"
            onClick={() => onDeleteRoom(room)}
            aria-label={`حذف غرفة ${room.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <ol className="mt-3 flex flex-wrap gap-1.5" aria-label={`ملخص مهام ${room.name}`}>
        {items.slice(0, 4).map((item) => (
          <li key={item.task.id} className="chip max-w-full truncate">
            {item.task.title}
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="btn-ghost btn-sm mt-2 w-full justify-between"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        aria-controls={panelId}
      >
        {expanded ? "اقفلي القائمة" : "افتحي مهام الغرفة"}
        <ChevronDown
          className={`h-4 w-4 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <div id={panelId} hidden={!expanded}>
        {expanded ? (
          items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-sage-200 p-3 text-center text-xs text-ink-soft">
              مفيش مهام تنظيف للغرفة دي. ضيفي واحدة من زر +.
            </p>
          ) : (
            <div className="pt-2">
              <CleaningChecklist
                items={items}
                today={today}
                onToggle={onToggle}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            </div>
          )
        ) : null}
      </div>
    </section>
  );
}
