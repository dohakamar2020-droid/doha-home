"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useToday } from "@/hooks/useToday";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { buildAdhkarStates, adhkarSummary } from "@/lib/adhkar";
import { ADHKAR_PERIODS } from "@/data/adhkar";
import { incrementAdhkar, resetAdhkar, setAdhkarCount } from "@/lib/operations";
import { addDays, formatDayLabel, relativeDayLabel } from "@/lib/date";
import type { AdhkarPeriod, IsoDate } from "@/types/domain";

export function AdhkarView() {
  const { data, update, notify } = useStore();
  const today = useToday();
  const [date, setDate] = useState<IsoDate>(today);
  const [period, setPeriod] = useState<AdhkarPeriod>(() =>
    new Date().getHours() >= 15 ? "evening" : "morning",
  );

  const states = useMemo(
    () => (data ? buildAdhkarStates(data.adhkarProgress, period, date) : []),
    [data, period, date],
  );
  const summary = useMemo(
    () => (data ? adhkarSummary(data.adhkarProgress, period, date) : null),
    [data, period, date],
  );

  if (!data || !summary) return null;

  const periodMeta = ADHKAR_PERIODS.find((item) => item.value === period) ?? ADHKAR_PERIODS[0];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="أذكاري"
        title="أذكار الصباح والمساء"
        subtitle="عدّاد بسيط لكل ذكر، وبيتحفظ كل يوم لوحده — كمّلي اللي قدرتِ عليه."
        actions={
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="icon-btn h-10 w-10 border border-sage-200"
              onClick={() => setDate((current) => addDays(current, -1))}
              aria-label="اليوم السابق"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="icon-btn h-10 w-10 border border-sage-200"
              onClick={() => setDate((current) => addDays(current, 1))}
              aria-label="اليوم التالي"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            {date !== today ? (
              <button type="button" className="btn-ghost btn-sm" onClick={() => setDate(today)}>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                النهاردة
              </button>
            ) : null}
          </div>
        }
      />

      <div className="card" aria-label="تاريخ الأذكار">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-ink">{formatDayLabel(date)}</p>
            <p className="text-[11px] text-ink-soft">{relativeDayLabel(date, today)}</p>
          </div>
          <p className="text-xs font-semibold text-ink-soft">
            خلّصتي {summary.completed} من {summary.total}
          </p>
        </div>
        <div className="mt-3">
          <ProgressBar
            value={summary.percentage}
            label={periodMeta ? periodMeta.label : "تقدّم الأذكار"}
            showValue
          />
        </div>
      </div>

      <div
        className="grid grid-cols-2 gap-2"
        role="tablist"
        aria-label="نوع الأذكار"
      >
        {ADHKAR_PERIODS.map((item) => {
          const active = item.value === period;
          const itemSummary = adhkarSummary(data.adhkarProgress, item.value, date);
          const Icon = item.value === "morning" ? Sun : Moon;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              id={`adhkar-tab-${item.value}`}
              aria-selected={active}
              aria-controls={`adhkar-panel-${item.value}`}
              onClick={() => setPeriod(item.value)}
              className={`flex min-h-[64px] flex-col items-start justify-center gap-0.5 rounded-2xl border px-3 py-2 text-right transition-colors ${
                active
                  ? "border-sage-500 bg-sage-500 text-white"
                  : "border-sage-200 bg-white text-ink hover:bg-sage-50"
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs font-bold">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </span>
              <span className={`text-[10px] ${active ? "text-white/85" : "text-ink-soft"}`}>
                {itemSummary.completed} من {itemSummary.total} • {item.hint}
              </span>
            </button>
          );
        })}
      </div>

      <section
        id={`adhkar-panel-${period}`}
        role="tabpanel"
        aria-labelledby={`adhkar-tab-${period}`}
        className="space-y-3"
      >
        {states.map(({ item, count, done, percentage }) => (
          <article key={item.id} className="card">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-bold text-ink">{item.title}</h2>
              <span
                className={`chip shrink-0 ${done ? "border-sage-500 bg-sage-50 text-sage-800" : ""}`}
              >
                {count} / {item.repeat}
              </span>
            </div>

            <p className="mt-2 whitespace-pre-line rounded-xl bg-cream/70 px-3 py-2 text-[13px] leading-7 text-ink">
              {item.text}
            </p>

            {item.hint ? (
              <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-5 text-ink-soft">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-500" aria-hidden="true" />
                {item.hint}
              </p>
            ) : null}

            <div className="mt-3">
              <ProgressBar value={percentage} label={`${count} من ${item.repeat}`} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={done ? "btn-secondary btn-sm" : "btn-primary btn-sm"}
                onClick={() =>
                  update((current) =>
                    incrementAdhkar(current, {
                      itemId: item.id,
                      period,
                      date,
                      step: 1,
                      target: item.repeat,
                    }),
                  )
                }
                disabled={done}
                aria-label={`زيادة عدّاد ${item.title} واحد`}
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {done ? "خلصت" : "+١"}
              </button>
              {item.repeat > 10 ? (
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() =>
                    update((current) =>
                      incrementAdhkar(current, {
                        itemId: item.id,
                        period,
                        date,
                        step: 10,
                        target: item.repeat,
                      }),
                    )
                  }
                  disabled={done}
                >
                  +١٠
                </button>
              ) : null}
              {!done ? (
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() =>
                    update((current) =>
                      setAdhkarCount(current, { itemId: item.id, period, date }, item.repeat),
                    )
                  }
                >
                  تمّيت العدد
                </button>
              ) : null}
              {count > 0 ? (
                <button
                  type="button"
                  className="btn-ghost btn-sm text-ink-soft"
                  onClick={() => {
                    update((current) => resetAdhkar(current, { itemId: item.id, period, date }));
                    notify("تصفير عدّاد الذكر", "info");
                  }}
                  aria-label={`تصفير عدّاد ${item.title}`}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  تصفير
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      <p className="rounded-2xl bg-white/70 p-3 text-[11px] leading-6 text-ink-soft">
        الأذكار محفوظة على جهازك بس، والعدّاد بيتسجّل بتاريخ اليوم اللي اختارتيه. الأيام اللي
        فاتت مش بتتحسب عليكي — تقدرِ ترجعي وتشوفي عدّاد أي يوم.
      </p>
    </div>
  );
}
