import Link from "next/link";
import { ArrowLeft, CheckCircle2, ListTodo } from "lucide-react";
import { ProgressBar } from "@/components/ProgressBar";
import type { DayProgress } from "@/lib/progress";

interface ProgressCardProps {
  progress: DayProgress;
  title?: string;
  href?: string;
  hint?: string;
}

export function ProgressCard({
  progress,
  title = "تقدّم النهاردة",
  href = "/today",
  hint,
}: ProgressCardProps) {
  const message =
    progress.total === 0
      ? "لسه مفيش مهام لليوم ده. ابدئي بإضافة أول مهمة."
      : progress.percentage === 100
        ? "ما شاء الله! خلّصتي كل مهام اليوم 👏"
        : progress.completed === 0
          ? "خطوة واحدة كفاية للبداية."
          : "إنتي ماشية كده تمام، كمّلي!";

  return (
    <section className="card" aria-labelledby="progress-card-title">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 id="progress-card-title" className="text-sm font-bold text-ink-soft">
            {title}
          </h2>
          <p className="mt-1 text-3xl font-bold text-ink">{progress.percentage}%</p>
        </div>
        {href ? (
          <Link href={href} className="btn-ghost btn-sm" aria-label="روحي لجدول اليوم">
            التفاصيل
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      <div className="mt-3">
        <ProgressBar value={progress.percentage} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 rounded-xl bg-sage-50 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-sage-600" aria-hidden="true" />
          <span className="text-xs font-semibold text-sage-800">
            خلّصتي {progress.completed}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-pink-50 px-3 py-2">
          <ListTodo className="h-4 w-4 text-[#A65A6B]" aria-hidden="true" />
          <span className="text-xs font-semibold text-ink">فاضل {progress.remaining}</span>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-ink-soft">{hint ?? message}</p>
    </section>
  );
}
