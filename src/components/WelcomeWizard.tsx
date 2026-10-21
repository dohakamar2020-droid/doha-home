"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Moon, Sun, Sparkles } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useToday } from "@/hooks/useToday";
import { buildStarterBundle } from "@/data/templates";
import { completeOnboarding } from "@/lib/operations";
import { orderedWeekdays } from "@/lib/date";
import { LoadingState } from "@/components/LoadingState";
import {
  ROUTINE_TEMPLATES,
  TEMPLATE_LABELS,
  WEEKDAY_LABELS,
} from "@/types/domain";
import type { RoutineTemplate, Weekday } from "@/types/domain";

const TEMPLATE_DESCRIPTIONS: Record<RoutineTemplate, string> = {
  calm: "مهام قليلة وهادیة، مساحة للراحة — مناسبة للأيام اللي محتاجة هدوء.",
  balanced: "مهام البيت والعيلة والعناية بنفسك موزّعة بشكل واقعي على اليوم.",
  busy: "يوم مليان مهام، فيه شغل وترتيب سريع — لو يومك مضغوط.",
};

const STEP_TITLES = ["أهلًا بيكي", "نظام أسبوعك", "قالب يومك", "خليها تبدأ"];

export function WelcomeWizard() {
  const { data, status, update, notify } = useStore();
  const today = useToday();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [wakeUpTime, setWakeUpTime] = useState("06:30");
  const [bedTime, setBedTime] = useState("22:30");
  const [weekStartsOn, setWeekStartsOn] = useState<Weekday>(6);
  const [template, setTemplate] = useState<RoutineTemplate>("balanced");
  const starterPreview = useMemo(() => buildStarterBundle(template, today), [template, today]);
  const alreadyOnboarded = Boolean(data?.settings.onboardingCompleted);

  // لو الإعداد خلص قبل كده، مفيش داعي نعرض الويزارد تاني
  useEffect(() => {
    if (status === "ready" && alreadyOnboarded) router.replace("/");
  }, [status, alreadyOnboarded, router]);

  if (status === "loading" || !data) return <LoadingState label="بنجهّز أول خطوة…" />;
  if (alreadyOnboarded) return <LoadingState label="رجوعك للرئيسية…" />;

  const totalSteps = STEP_TITLES.length;
  const isLast = step === totalSteps - 1;

  const finish = () => {
    update((current) => {
      const withSettings = completeOnboarding(current, {
        displayName: displayName.trim(),
        wakeUpTime,
        bedTime,
        weekStartsOn,
        routineTemplate: template,
      });
      const hasExistingContent =
        current.tasks.length > 0 ||
        current.habits.length > 0 ||
        current.taskCompletions.length > 0 ||
        current.habitCompletions.length > 0;
      if (hasExistingContent) {
        return withSettings;
      }
      const bundle = buildStarterBundle(template, today);
      return {
        ...withSettings,
        tasks: bundle.tasks,
        habits: bundle.habits,
        rooms: bundle.rooms,
        cleaningTasks: bundle.cleaningTasks,
      };
    });
    notify("تمام! يومك اتجهّز وخطتنا بدأت 🌿");
    router.replace("/");
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-sage-500 text-xl font-bold text-white shadow-soft">
          بـ
        </span>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">بيتي منظم</h1>
        <p className="mt-1 text-sm text-ink-soft">خطوات بسيطة ونبدأ ننظّم يومك سوا.</p>
      </div>

      <div className="card">
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-ink-soft">
            <span>
              الخطوة {step + 1} من {totalSteps}
            </span>
            <span>{STEP_TITLES[step]}</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-sage-100"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-valuenow={step + 1}
            aria-label="خطوات الإعداد"
          >
            <div
              className="h-full rounded-full bg-sage-500 transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (isLast) finish();
            else setStep((current) => Math.min(current + 1, totalSteps - 1));
          }}
          className="space-y-5"
        >
          {step === 0 ? (
            <div className="animate-fade-in space-y-4">
              <div>
                <label htmlFor="wizard-name" className="field-label">
                  اسمك أو لقبك <span className="font-normal text-ink-soft">(اختياري)</span>
                </label>
                <input
                  id="wizard-name"
                  data-autofocus
                  className="field-input"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="مثال: دُعاء"
                  maxLength={60}
                  autoComplete="given-name"
                />
                <p className="mt-1 text-[11px] text-ink-soft">
                  بنستخدمه في الترحيب بس، وبيتحفظ على جهازك.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="wizard-wake" className="field-label">
                    <Sun className="mb-0.5 inline h-4 w-4 text-sage-500" aria-hidden="true" /> وقت الصحيان
                  </label>
                  <input
                    id="wizard-wake"
                    type="time"
                    className="field-input"
                    value={wakeUpTime}
                    onChange={(event) => setWakeUpTime(event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="wizard-bed" className="field-label">
                    <Moon className="mb-0.5 inline h-4 w-4 text-sage-500" aria-hidden="true" /> وقت النوم
                  </label>
                  <input
                    id="wizard-bed"
                    type="time"
                    className="field-input"
                    value={bedTime}
                    onChange={(event) => setBedTime(event.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <fieldset className="animate-fade-in">
              <legend className="field-label">ابدأي الأسبوع بيوم إيه؟</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {orderedWeekdays(0).map((day) => (
                  <label
                    key={day}
                    className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border text-xs font-semibold transition-colors ${
                      weekStartsOn === day
                        ? "border-sage-500 bg-sage-50 text-sage-800"
                        : "border-sage-200 bg-white text-ink-soft hover:bg-sage-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="week-start"
                      value={day}
                      checked={weekStartsOn === day}
                      onChange={() => setWeekStartsOn(day)}
                      className="sr-only"
                    />
                    {WEEKDAY_LABELS[day]}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-5 text-ink-soft">
                ده اللي هيحدد شكل تقويم الأسبوع عندك، وتقدري تغيّريه من الإعدادات.
              </p>
            </fieldset>
          ) : null}

          {step === 2 ? (
            <fieldset className="animate-fade-in">
              <legend className="field-label">اختاري قالب البداية</legend>
              <div className="space-y-2">
                {ROUTINE_TEMPLATES.map((option) => (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors ${
                      template === option
                        ? "border-sage-500 bg-sage-50"
                        : "border-sage-200 bg-white hover:bg-sage-50/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      value={option}
                      checked={template === option}
                      onChange={() => setTemplate(option)}
                      className="mt-1 h-4 w-4 accent-sage-600"
                    />
                    <span>
                      <span className="block text-sm font-bold text-ink">{TEMPLATE_LABELS[option]}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-ink-soft">
                        {TEMPLATE_DESCRIPTIONS[option]}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-5 text-ink-soft">
                كل القوالب بتضيف مهام قابلة للتعديل والحذف، ومفيش أي حاجة ثابتة.
              </p>
            </fieldset>
          ) : null}

          {step === 3 ? (
            <div className="animate-fade-in space-y-3">
              <div className="rounded-2xl bg-sage-50 p-4 text-sm text-sage-900">
                <p className="flex items-center gap-2 font-bold">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {displayName.trim() ? `أهلًا ${displayName.trim()}!` : "أهلًا بيكي!"}
                </p>
                <ul className="mt-2 space-y-1 text-xs leading-6">
                  <li>الصحيان: {wakeUpTime} — النوم: {bedTime}</li>
                  <li>بداية الأسبوع: {WEEKDAY_LABELS[weekStartsOn]}</li>
                  <li>القالب: {TEMPLATE_LABELS[template]}</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-sage-100 p-3 text-xs leading-6 text-ink-soft">
                <p className="mb-1 font-bold text-ink">اللي هيبدأ معاكي:</p>
                <p>
                  {starterPreview.tasks.length} مهمة في روتينك، و{starterPreview.habits.length} عادات
                  يومية، و{starterPreview.rooms.length} غرف فيها {starterPreview.cleaningTasks.length}{" "}
                  مهمة تنظيف جاهزة.
                </p>
                <p className="mt-1">كل ده محفوظ على المتصفح بتاعك بس.</p>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0}
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              رجوع
            </button>
            <button type="submit" className="btn-primary">
              {isLast ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  يلا نبدأ
                </>
              ) : (
                <>
                  اللي بعده
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <p className="mt-4 text-center text-[11px] leading-5 text-ink-soft">
        بياناتك محفوظة في المتصفح ده بس، ومش بتتبعت لأي مكان.
      </p>
    </div>
  );
}
