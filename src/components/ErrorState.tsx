"use client";

import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string | null;
  onRetry?: () => void;
  onReset?: () => void;
  resetLabel?: string;
}

export function ErrorState({
  title = "حصلت مشكلة",
  message,
  onRetry,
  onReset,
  resetLabel = "ابدئي من جديد",
}: ErrorStateProps) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100 text-[#8C333A]">
        <AlertTriangle className="h-7 w-7" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm leading-6 text-ink-soft" role="alert">
        {message ?? "جرّبي تحديث الصفحة أو المحاولة تاني."}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {onRetry ? (
          <button type="button" className="btn-primary" onClick={onRetry}>
            حاولي تاني
          </button>
        ) : null}
        {onReset ? (
          <button type="button" className="btn-secondary" onClick={onReset}>
            {resetLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
