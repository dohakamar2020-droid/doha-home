"use client";

import { useEffect, useId, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { WeekdaySelector } from "@/components/ui/WeekdaySelector";
import type { Habit, HabitInput, Weekday } from "@/types/domain";
import { validateHabitForm, type FieldErrors } from "@/lib/form-validation";

interface HabitFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: HabitInput) => void;
  initialHabit?: Habit | null;
  weekStartsOn?: Weekday;
}

const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export function HabitForm({
  open,
  onClose,
  onSubmit,
  initialHabit = null,
  weekStartsOn = 6,
}: HabitFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [weekdays, setWeekdays] = useState<Weekday[]>(ALL_DAYS);
  const [errors, setErrors] = useState<FieldErrors>({});
  const formId = useId();

  useEffect(() => {
    if (!open) return;
    setName(initialHabit?.name ?? "");
    setDescription(initialHabit?.description ?? "");
    setWeekdays(initialHabit?.weekdays ?? ALL_DAYS);
    setErrors({});
  }, [open, initialHabit]);

  const errorId = (field: string) => `${formId}-${field}-error`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialHabit ? "تعديل العادة" : "عادة جديدة"}
      description="اختاري الأيام اللي تحبي تلتزمي فيها، والباقي مش بيتحسب عليكي."
      size="sm"
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const result = validateHabitForm({ name, description, weekdays });
          if (!result.ok) {
            setErrors(result.errors);
            return;
          }
          onSubmit(result.input);
          onClose();
        }}
      >
        <div>
          <label htmlFor={`${formId}-name`} className="field-label">
            اسم العادة
          </label>
          <input
            id={`${formId}-name`}
            data-autofocus
            className="field-input"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setErrors((current) => ({ ...current, name: "" }));
            }}
            placeholder="مثال: شرب 8 كوبايات ميه"
            maxLength={90}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? errorId("name") : undefined}
          />
          {errors.name ? (
            <p id={errorId("name")} className="field-error">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={`${formId}-desc`} className="field-label">
            وصف قصير <span className="font-normal text-ink-soft">(اختياري)</span>
          </label>
          <input
            id={`${formId}-desc`}
            className="field-input"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={300}
            placeholder="ليه العادة دي مهمة ليكي؟"
          />
        </div>

        <fieldset>
          <legend className="field-label">أيام العادة</legend>
          <WeekdaySelector
            value={weekdays}
            onChange={(next) => {
              setWeekdays(next);
              setErrors((current) => ({ ...current, weekdays: "" }));
            }}
            weekStartsOn={weekStartsOn}
            describedBy={errors.weekdays ? errorId("weekdays") : undefined}
            compact
          />
          {errors.weekdays ? (
            <p id={errorId("weekdays")} className="field-error">
              {errors.weekdays}
            </p>
          ) : null}
        </fieldset>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>
            إلغاء
          </button>
          <button type="submit" className="btn-primary">
            {initialHabit ? "حفظ التعديلات" : "إضافة العادة"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
