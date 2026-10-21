"use client";

import { useEffect, useId, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { WEEKDAY_LABELS } from "@/types/domain";
import type { MealIdea, Weekday } from "@/types/domain";
import { orderedWeekdays } from "@/lib/date";

interface MealFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { weekday: Weekday; title: string; notes?: string }) => void;
  initialMeal?: MealIdea | null;
  defaultWeekday: Weekday;
  weekStartsOn?: Weekday;
}

export function MealForm({
  open,
  onClose,
  onSubmit,
  initialMeal = null,
  defaultWeekday,
  weekStartsOn = 6,
}: MealFormProps) {
  const [weekday, setWeekday] = useState<Weekday>(defaultWeekday);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const formId = useId();

  useEffect(() => {
    if (!open) return;
    setWeekday(initialMeal?.weekday ?? defaultWeekday);
    setTitle(initialMeal?.title ?? "");
    setNotes(initialMeal?.notes ?? "");
    setError(null);
  }, [open, initialMeal, defaultWeekday]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialMeal ? "تعديل اقتراح الغدا" : "اقتراح غدا جديد"}
      description="كل يوم ليه اقتراح أساسي وبدائل، وكلهم بيتحفظوا على جهازك."
      size="sm"
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) {
            setError("اكتبي اسم الأكلة");
            return;
          }
          onSubmit({
            weekday,
            title: title.trim(),
            notes: notes.trim() || undefined,
          });
          onClose();
        }}
      >
        <div>
          <label htmlFor={`${formId}-title`} className="field-label">
            اسم الأكلة
          </label>
          <input
            id={`${formId}-title`}
            data-autofocus
            className="field-input"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setError(null);
            }}
            placeholder="مثال: ملوخية وفراخ"
            maxLength={120}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${formId}-title-error` : undefined}
          />
          {error ? (
            <p id={`${formId}-title-error`} className="field-error">
              {error}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={`${formId}-weekday`} className="field-label">
            اليوم
          </label>
          <select
            id={`${formId}-weekday`}
            className="field-input"
            value={weekday}
            onChange={(event) => setWeekday(Number(event.target.value) as Weekday)}
          >
            {orderedWeekdays(weekStartsOn).map((day) => (
              <option key={day} value={day}>
                {WEEKDAY_LABELS[day]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${formId}-notes`} className="field-label">
            ملاحظات <span className="font-normal text-ink-soft">(اختياري)</span>
          </label>
          <input
            id={`${formId}-notes`}
            className="field-input"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="مع رز وسلطة…"
            maxLength={300}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>
            إلغاء
          </button>
          <button type="submit" className="btn-primary">
            {initialMeal ? "حفظ التعديلات" : "إضافة الاقتراح"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
