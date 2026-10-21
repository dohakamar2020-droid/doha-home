"use client";

import { useEffect, useId, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { WeekdaySelector } from "@/components/ui/WeekdaySelector";
import { CLEANING_FREQUENCIES, CLEANING_FREQUENCY_LABELS } from "@/types/domain";
import type { CleaningFrequency, CleaningTask, CleaningTaskInput, IsoDate, Room, Weekday } from "@/types/domain";
import { validateCleaningForm, type FieldErrors } from "@/lib/form-validation";
import { weekdayOf } from "@/lib/date";

interface CleaningFormValues {
  roomId: string;
  title: string;
  notes: string;
  frequency: CleaningFrequency;
  weekday: number;
  dayOfMonth: string;
}

function buildValues(
  task: CleaningTask | null | undefined,
  rooms: readonly Room[],
  defaultRoomId: string | undefined,
  today: IsoDate,
): CleaningFormValues {
  if (!task) {
    return {
      roomId: defaultRoomId ?? rooms[0]?.id ?? "",
      title: "",
      notes: "",
      frequency: "weekly",
      weekday: weekdayOf(today),
      dayOfMonth: String(Number(today.slice(8, 10))),
    };
  }
  return {
    roomId: task.roomId,
    title: task.title,
    notes: task.notes ?? "",
    frequency: task.frequency,
    weekday: task.weekday ?? weekdayOf(task.startDate),
    dayOfMonth: String(task.dayOfMonth ?? Number(task.startDate.slice(8, 10))),
  };
}

interface CleaningTaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CleaningTaskInput) => void;
  rooms: readonly Room[];
  initialTask?: CleaningTask | null;
  defaultRoomId?: string;
  today: IsoDate;
  weekStartsOn?: Weekday;
}

export function CleaningTaskForm({
  open,
  onClose,
  onSubmit,
  rooms,
  initialTask = null,
  defaultRoomId,
  today,
  weekStartsOn = 6,
}: CleaningTaskFormProps) {
  const [values, setValues] = useState<CleaningFormValues>(() =>
    buildValues(initialTask, rooms, defaultRoomId, today),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const formId = useId();

  useEffect(() => {
    if (!open) return;
    setValues(buildValues(initialTask, rooms, defaultRoomId, today));
    setErrors({});
  }, [open, initialTask, rooms, defaultRoomId, today]);

  const setField = <K extends keyof CleaningFormValues>(key: K, value: CleaningFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  };

  const errorId = (field: string) => `${formId}-${field}-error`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialTask ? "تعديل مهمة التنظيف" : "مهمة تنظيف جديدة"}
      description="حددي الغرفة ومواعيد التنظيف، وهنفكّرك في الميعاد."
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const result = validateCleaningForm(
            {
              roomId: values.roomId,
              title: values.title,
              notes: values.notes,
              frequency: values.frequency,
              weekday: values.weekday,
              dayOfMonth: values.dayOfMonth,
            },
            initialTask?.startDate ?? today,
          );
          if (!result.ok) {
            setErrors(result.errors);
            return;
          }
          onSubmit(result.input);
          onClose();
        }}
      >
        <div>
          <label htmlFor={`${formId}-title`} className="field-label">
            اسم مهمة التنظيف
          </label>
          <input
            id={`${formId}-title`}
            data-autofocus
            className="field-input"
            value={values.title}
            onChange={(event) => setField("title", event.target.value)}
            placeholder="مثال: مسح أسطح المطبخ"
            maxLength={140}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? errorId("title") : undefined}
          />
          {errors.title ? (
            <p id={errorId("title")} className="field-error">
              {errors.title}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`${formId}-room`} className="field-label">
              الغرفة
            </label>
            <select
              id={`${formId}-room`}
              className="field-input"
              value={values.roomId}
              onChange={(event) => setField("roomId", event.target.value)}
              aria-invalid={Boolean(errors.roomId)}
              aria-describedby={errors.roomId ? errorId("roomId") : undefined}
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.emoji ? `${room.emoji} ` : ""}
                  {room.name}
                </option>
              ))}
            </select>
            {errors.roomId ? (
              <p id={errorId("roomId")} className="field-error">
                {errors.roomId}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor={`${formId}-frequency`} className="field-label">
              التكرار
            </label>
            <select
              id={`${formId}-frequency`}
              className="field-input"
              value={values.frequency}
              onChange={(event) =>
                setField("frequency", event.target.value as CleaningFrequency)
              }
            >
              {CLEANING_FREQUENCIES.map((frequency) => (
                <option key={frequency} value={frequency}>
                  {CLEANING_FREQUENCY_LABELS[frequency]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {values.frequency === "weekly" ? (
          <div>
            <span className="field-label">يوم الأسبوع</span>
            <WeekdaySelector
              value={[values.weekday as Weekday]}
              onChange={(next) => {
                if (next.length > 0) setField("weekday", next[next.length - 1] ?? values.weekday);
              }}
              weekStartsOn={weekStartsOn}
            />
          </div>
        ) : null}

        {values.frequency === "monthly" ? (
          <div>
            <label htmlFor={`${formId}-day`} className="field-label">
              يوم الشهر
            </label>
            <input
              id={`${formId}-day`}
              type="number"
              min={1}
              max={31}
              inputMode="numeric"
              className="field-input max-w-[120px]"
              value={values.dayOfMonth}
              onChange={(event) => setField("dayOfMonth", event.target.value)}
              aria-invalid={Boolean(errors.dayOfMonth)}
              aria-describedby={errors.dayOfMonth ? errorId("dayOfMonth") : undefined}
            />
            <p className="mt-1 text-[11px] leading-5 text-ink-soft">
              لو الشهر أقصر، بنحسبها على آخر يوم فيه.
            </p>
            {errors.dayOfMonth ? (
              <p id={errorId("dayOfMonth")} className="field-error">
                {errors.dayOfMonth}
              </p>
            ) : null}
          </div>
        ) : null}

        <div>
          <label htmlFor={`${formId}-notes`} className="field-label">
            ملاحظات <span className="font-normal text-ink-soft">(اختياري)</span>
          </label>
          <textarea
            id={`${formId}-notes`}
            rows={2}
            className="field-input resize-none"
            value={values.notes}
            onChange={(event) => setField("notes", event.target.value)}
            placeholder="أدوات معينة أو تفاصيل تحبي تفتكريها"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>
            إلغاء
          </button>
          <button type="submit" className="btn-primary">
            {initialTask ? "حفظ التعديلات" : "إضافة المهمة"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
