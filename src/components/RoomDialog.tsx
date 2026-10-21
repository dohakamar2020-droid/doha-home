"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Room } from "@/types/domain";

const EMOJI_CHOICES = ["🏠", "🍳", "🚿", "🛏️", "🛋️", "🧺", "🪴", "🧸", "🚪", "🪟"];

interface RoomDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, emoji: string) => void;
  initialRoom?: Room | null;
}

export function RoomDialog({ open, onClose, onSubmit, initialRoom = null }: RoomDialogProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏠");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initialRoom?.name ?? "");
    setEmoji(initialRoom?.emoji ?? "🏠");
    setError(null);
  }, [open, initialRoom]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialRoom ? "تغيير اسم الغرفة" : "غرفة جديدة"}
      description="الغرف بتساعدك تقسّمي التنظيف بشكل أسهل."
      size="sm"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) {
            setError("اكتبي اسم الغرفة");
            return;
          }
          onSubmit(name.trim(), emoji);
          onClose();
        }}
        className="space-y-3"
      >
        <div>
          <label htmlFor="room-name" className="field-label">
            اسم الغرفة
          </label>
          <input
            id="room-name"
            data-autofocus
            className="field-input"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            maxLength={60}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "room-name-error" : undefined}
            placeholder="مثال: أوضة الأطفال"
          />
          {error ? (
            <p id="room-name-error" className="field-error">
              {error}
            </p>
          ) : null}
        </div>
        <fieldset>
          <legend className="field-label">رمز الغرفة</legend>
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_CHOICES.map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => setEmoji(choice)}
                aria-pressed={emoji === choice}
                aria-label={`اختيار ${choice}`}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${
                  emoji === choice
                    ? "border-sage-500 bg-sage-50"
                    : "border-sage-200 hover:bg-sage-50"
                }`}
              >
                {choice}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>
            إلغاء
          </button>
          <button type="submit" className="btn-primary">
            {initialRoom ? "حفظ" : "إضافة الغرفة"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
