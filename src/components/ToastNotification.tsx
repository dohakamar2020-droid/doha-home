"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import type { Toast } from "@/context/StoreContext";

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), 4500);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const toneStyles =
    toast.tone === "error"
      ? "border-[#E7C3C6] bg-[#FDF3F4] text-[#8C333A]"
      : toast.tone === "info"
        ? "border-sage-200 bg-sage-50 text-sage-800"
        : "border-sage-200 bg-white text-sage-800";

  const Icon = toast.tone === "error" ? AlertTriangle : toast.tone === "info" ? Info : CheckCircle2;

  return (
    <div
      className={`pointer-events-auto flex w-full items-start gap-2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-soft ${toneStyles}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="flex-1 leading-6">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="-mr-1 -mt-1 rounded-lg p-1 hover:bg-black/5"
        aria-label="إغلاق التنبيه"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastNotification() {
  const { toasts, dismissToast } = useStore();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[60] mx-auto flex w-full max-w-sm flex-col gap-2 px-4 sm:top-6"
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
