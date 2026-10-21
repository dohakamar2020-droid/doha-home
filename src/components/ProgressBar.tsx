interface ProgressBarProps {
  value: number;
  label?: string;
  tone?: "sage" | "pink";
  showValue?: boolean;
}

export function ProgressBar({ value, label, tone = "sage", showValue = false }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const barColor = tone === "pink" ? "bg-pink-300" : "bg-sage-500";

  return (
    <div>
      {label || showValue ? (
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-soft">
          <span>{label}</span>
          {showValue ? <span>{`${clamped}%`}</span> : null}
        </div>
      ) : null}
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-sage-100"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "نسبة الإنجاز"}
      >
        <div
          className={`h-full rounded-full ${barColor} transition-[width] duration-500 motion-reduce:transition-none`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
