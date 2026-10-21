import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-sage-200 bg-white/60 text-center ${
        compact ? "gap-2 px-4 py-6" : "gap-3 px-5 py-10"
      }`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-50 text-sage-600">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      {description ? (
        <p className="max-w-sm text-xs leading-6 text-ink-soft sm:text-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
