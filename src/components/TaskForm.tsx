"use client";

import { useEffect, useId, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { WeekdaySelector } from "@/components/ui/WeekdaySelector";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  TASK_CATEGORIES,
  WEEKDAY_LABELS,
} from "@/types/domain";
import type { IsoDate, Priority, RecurrenceType, Task, TaskCategory, TaskInput, Weekday } from "@/types/domain";
import { validateTaskForm, type FieldErrors, type TaskFormValues } from "@/lib/form-validation";
import { weekdayOf } from "@/lib/date";

const RECURRENCE_OPTIONS: Array<{ value: RecurrenceType; label: string; hint: string }> = [
  { value: "once", label: "مرة واحدة", hint: "بتظهر في اليوم المحدد بس" },
  { value: "daily", label: "كل يوم", hint: "بتتكرر يوميًا من غير نسخ" },
  { value: "weekly", label: "كل أسبوع", hint: "اختاري أيام الأسبوع" },
  { value: "monthly", label: "كل شهر", hint: "يوم محدد من الشهر" },
];

export function buildInitialValues(
  task: Task | null | undefined,
  defaultDate: IsoDate,
): TaskFormValues {
  if (!task) {
    return {
      title: "",
      notes: "",
      category: "home",
      priority: "medium",
      date: defaultDate,
      startTime: "",
      durationMinutes: "",
      recurrenceType: "once",
      weekdays: [],
      dayOfMonth: "",
    };
  }
  const recurrence = task.recurrence;
  return {
    title: task.title,
    notes: task.notes ?? "",
    category: task.category,
    priority: task.priority,
    date: recurrence.type === "once" ? recurrence.date : recurrence.startDate,
    startTime: task.startTime ?? "",
    durationMinutes: task.durationMinutes ? String(task.durationMinutes) : "",
    recurrenceType: recurrence.type,
    weekdays: recurrence.type === "weekly" ? recurrence.weekdays : [],
    dayOfMonth: recurrence.type === "monthly" ? String(recurrence.dayOfMonth) : "",
  };
}

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: TaskInput) => void;
  initialTask?: Task | null;
  defaultDate: IsoDate;
  weekStartsOn?: Weekday;
}

export function TaskForm({
  open,
  onClose,
  onSubmit,
  initialTask = null,
  defaultDate,
  weekStartsOn = 6,
}: TaskFormProps) {
  const [values, setValues] = useState<TaskFormValues>(() => buildInitialValues(initialTask, defaultDate));
  const [errors, setErrors] = useState<FieldErrors>({});
  const formId = useId();
  const isEditing = Boolean(initialTask);

  useEffect(() => {
    if (!open) return;
    setValues(buildInitialValues(initialTask, defaultDate));
    setErrors({});
  }, [open, initialTask, defaultDate]);

  const setField = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = validateTaskForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSubmit(result.input);
  };

  const errorId = (field: string) => `${formId}-${field}-error`;
  const describedBy = (field: string) => (errors[field] ? errorId(field) : undefined);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "تعديل المهمة" : "مهمة جديدة"}
      description={isEditing ? "التعديل مش بيمسح سجل الأيام اللي خلصتيها." : "اكملي التفاصيل وسيبي الباقي علينا."}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor={`${formId}-title`} className="field-label">
            اسم المهمة <span aria-hidden="true">*</span>
          </label>
          <input
            id={`${formId}-title`}
            data-autofocus
            className="field-input"
            value={values.title}
            onChange={(event) => setField("title", event.target.value)}
            placeholder="مثال: تجهيز الغدا"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={describedBy("title")}
            maxLength={140}
          />
          {errors.title ? (
            <p id={errorId("title")} className="field-error">
              {errors.title}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`${formId}-date`} className="field-label">
              التاريخ
            </label>
            <input
              id={`${formId}-date`}
              type="date"
              className="field-input"
              value={values.date}
              onChange={(event) => setField("date", event.target.value)}
              aria-invalid={Boolean(errors.date)}
              aria-describedby={describedBy("date")}
              required
            />
            {errors.date ? (
              <p id={errorId("date")} className="field-error">
                {errors.date}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor={`${formId}-time`} className="field-label">
              وقت البداية <span className="font-normal text-ink-soft">(اختياري)</span>
            </label>
            <input
              id={`${formId}-time`}
              type="time"
              className="field-input"
              value={values.startTime}
              onChange={(event) => setField("startTime", event.target.value)}
              aria-invalid={Boolean(errors.startTime)}
              aria-describedby={describedBy("startTime")}
            />
            {errors.startTime ? (
              <p id={errorId("startTime")} className="field-error">
                {errors.startTime}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor={`${formId}-duration`} className="field-label">
              المدة بالدقايق <span className="font-normal text-ink-soft">(اختياري)</span>
            </label>
            <input
              id={`${formId}-duration`}
              type="number"
              inputMode="numeric"
              min={5}
              max={720}
              step={5}
              className="field-input"
              value={values.durationMinutes}
              onChange={(event) => setField("durationMinutes", event.target.value)}
              aria-invalid={Boolean(errors.durationMinutes)}
              aria-describedby={describedBy("durationMinutes")}
              placeholder="30"
            />
            {errors.durationMinutes ? (
              <p id={errorId("durationMinutes")} className="field-error">
                {errors.durationMinutes}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor={`${formId}-category`} className="field-label">
              الفئة
            </label>
            <select
              id={`${formId}-category`}
              className="field-input"
              value={values.category}
              onChange={(event) => setField("category", event.target.value as TaskCategory)}
            >
              {TASK_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="field-label">الأولوية</legend>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITIES.map((priority) => (
              <label
                key={priority.value}
                className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border px-2 text-xs font-semibold transition-colors ${
                  values.priority === priority.value
                    ? "border-sage-500 bg-sage-50 text-sage-800"
                    : "border-sage-200 bg-white text-ink-soft hover:bg-sage-50"
                }`}
              >
                <input
                  type="radio"
                  name={`${formId}-priority`}
                  value={priority.value}
                  checked={values.priority === priority.value}
                  onChange={() => setField("priority", priority.value as Priority)}
                  className="sr-only"
                />
                {PRIORITY_LABELS[priority.value]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="field-label">التكرار</legend>
          <div className="grid grid-cols-2 gap-2">
            {RECURRENCE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex min-h-[52px] cursor-pointer flex-col justify-center rounded-xl border px-2.5 py-1.5 text-xs transition-colors ${
                  values.recurrenceType === option.value
                    ? "border-sage-500 bg-sage-50 text-sage-800"
                    : "border-sage-200 bg-white text-ink-soft hover:bg-sage-50"
                }`}
              >
                <input
                  type="radio"
                  name={`${formId}-recurrence`}
                  value={option.value}
                  checked={values.recurrenceType === option.value}
                  onChange={() => {
                    const type = option.value;
                    setField("recurrenceType", type);
                    if (type === "weekly" && values.weekdays.length === 0) {
                      setField("weekdays", [weekdayOf(values.date)]);
                    }
                    if (type === "monthly" && !values.dayOfMonth) {
                      setField("dayOfMonth", String(Number(values.date.slice(8, 10))));
                    }
                  }}
                  className="sr-only"
                />
                <span className="font-bold">{option.label}</span>
                <span className="mt-0.5 text-[10px] leading-4">{option.hint}</span>
              </label>
            ))}
          </div>

          {values.recurrenceType === "weekly" ? (
            <div className="mt-3">
              <WeekdaySelector
                value={values.weekdays as Weekday[]}
                onChange={(next) => setField("weekdays", next)}
                weekStartsOn={weekStartsOn}
                describedBy={describedBy("weekdays")}
              />
              {errors.weekdays ? (
                <p id={errorId("weekdays")} className="field-error">
                  {errors.weekdays}
                </p>
              ) : null}
            </div>
          ) : null}

          {values.recurrenceType === "monthly" ? (
            <div className="mt-3">
              <label htmlFor={`${formId}-day`} className="mb-1 block text-xs font-semibold text-ink">
                يوم الشهر
              </label>
              <input
                id={`${formId}-day`}
                type="number"
                inputMode="numeric"
                min={1}
                max={31}
                className="field-input max-w-[120px]"
                value={values.dayOfMonth}
                onChange={(event) => setField("dayOfMonth", event.target.value)}
                aria-invalid={Boolean(errors.dayOfMonth)}
                aria-describedby={describedBy("dayOfMonth")}
              />
              <p className="mt-1 text-[11px] leading-5 text-ink-soft">
                لو الشهر أقصر من اليوم ده (زي 31 في شهر 30 يوم)، المهمة بتتحسب في آخر يوم في الشهر.
              </p>
              {errors.dayOfMonth ? (
                <p id={errorId("dayOfMonth")} className="field-error">
                  {errors.dayOfMonth}
                </p>
              ) : null}
            </div>
          ) : null}

          {values.recurrenceType !== "once" ? (
            <p className="mt-2 text-[11px] leading-5 text-ink-soft">
              {"التكرار بيبدأ من " + values.date + " " +
                (values.recurrenceType === "weekly"
                  ? "(" + "الأيام: " +
                    (values.weekdays
                      .map((day) => WEEKDAY_LABELS[day as Weekday])
                      .join("، ") || "لسه مفيش") + ") "
                  : "") +
                "— وكل يوم بيتسجّل لوحده."}
            </p>
          ) : null}
        </fieldset>

        <div>
          <label htmlFor={`${formId}-notes`} className="field-label">
            ملاحظات <span className="font-normal text-ink-soft">(اختياري)</span>
          </label>
          <textarea
            id={`${formId}-notes`}
            rows={3}
            className="field-input resize-none"
            value={values.notes}
            onChange={(event) => setField("notes", event.target.value)}
            aria-invalid={Boolean(errors.notes)}
            aria-describedby={describedBy("notes")}
            placeholder="أي تفاصيل تحبي تفتكريها"
          />
          {errors.notes ? (
            <p id={errorId("notes")} className="field-error">
              {errors.notes}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>
            إلغاء
          </button>
          <button type="submit" className="btn-primary">
            {isEditing ? "حفظ التعديلات" : "إضافة المهمة"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
