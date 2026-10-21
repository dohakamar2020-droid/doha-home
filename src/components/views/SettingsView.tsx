"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Database,
  Download,
  HardDrive,
  Info,
  Moon,
  RotateCcw,
  Save,
  Sun,
  Upload,
  User,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { PageHeader } from "@/components/PageHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import {
  backupFileName,
  downloadJsonFile,
  parseBackup,
  serializeBackup,
  summarizeBackup,
} from "@/lib/backup";
import type { BackupFile, BackupSummary } from "@/lib/backup";
import { APP_SECTIONS, SECTION_LABELS, WEEKDAY_LABELS } from "@/types/domain";
import type { SectionId, Weekday } from "@/types/domain";
import { orderedWeekdays } from "@/lib/date";
import { updateSettings } from "@/lib/operations";
import { APP_VERSION } from "@/lib/defaults";

interface PendingImport {
  backup: BackupFile;
  summary: BackupSummary;
}

export function SettingsView() {
  const { data, update, replaceData, resetApp, notify } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(data?.settings.displayName ?? "");
  const [wakeUpTime, setWakeUpTime] = useState(data?.settings.wakeUpTime ?? "06:30");
  const [bedTime, setBedTime] = useState(data?.settings.bedTime ?? "22:30");
  const [weekStartsOn, setWeekStartsOn] = useState<Weekday>(data?.settings.weekStartsOn ?? 6);
  const [visibleSections, setVisibleSections] = useState<SectionId[]>(
    data?.settings.visibleSections ?? [...APP_SECTIONS],
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    setDisplayName(data.settings.displayName);
    setWakeUpTime(data.settings.wakeUpTime);
    setBedTime(data.settings.bedTime);
    setWeekStartsOn(data.settings.weekStartsOn);
    setVisibleSections(data.settings.visibleSections);
  }, [data]);

  if (!data) return null;

  const storageSizeKb = (() => {
    try {
      return Math.max(1, Math.round(JSON.stringify(data).length / 1024));
    } catch {
      return 0;
    }
  })();

  const saveSettings = (event: React.FormEvent) => {
    event.preventDefault();
    update((current) =>
      updateSettings(current, {
        displayName: displayName.trim(),
        wakeUpTime,
        bedTime,
        weekStartsOn,
        visibleSections: visibleSections.length > 0 ? visibleSections : ["dashboard"],
      }),
    );
    setSaved(true);
    notify("الإعدادات اتحفظت ✅");
    window.setTimeout(() => setSaved(false), 2500);
  };

  const toggleSection = (section: SectionId) => {
    setVisibleSections((current) =>
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section],
    );
  };

  const handleExport = () => {
    const content = serializeBackup(data);
    downloadJsonFile(content, backupFileName());
    notify("النسخة الاحتياطية جاهزة في التنزيلات 💾");
  };

  const handleFile = async (file: File) => {
    setImportError(null);
    try {
      const text = await file.text();
      const result = parseBackup(text);
      if (!result.ok) {
        setImportError(result.message);
        return;
      }
      setPendingImport({ backup: result.backup, summary: summarizeBackup(result.backup) });
    } catch {
      setImportError("معرفناش نقرا الملف. جرّبي ملف تاني.");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="الإعدادات"
        title="إعداداتك وبياناتك"
        subtitle="كل حاجة هنا محفوظة على المتصفح ده بس، من غير أي سيرفر."
      />

      <form onSubmit={saveSettings} className="card space-y-4" aria-labelledby="personal-title">
        <h2 id="personal-title" className="flex items-center gap-2 text-sm font-bold text-ink">
          <User className="h-4 w-4 text-sage-600" aria-hidden="true" />
          بياناتك الشخصية
        </h2>

        <div>
          <label htmlFor="settings-name" className="field-label">
            الاسم أو اللقب <span className="font-normal text-ink-soft">(اختياري)</span>
          </label>
          <input
            id="settings-name"
            className="field-input max-w-sm"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={60}
            placeholder="الاسم اللي تحبي نناديكي بيه"
            autoComplete="given-name"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="settings-wake" className="field-label">
              <Sun className="mb-0.5 inline h-4 w-4 text-sage-500" aria-hidden="true" /> وقت الصحيان
            </label>
            <input
              id="settings-wake"
              type="time"
              className="field-input"
              value={wakeUpTime}
              onChange={(event) => setWakeUpTime(event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="settings-bed" className="field-label">
              <Moon className="mb-0.5 inline h-4 w-4 text-sage-500" aria-hidden="true" /> وقت النوم
            </label>
            <input
              id="settings-bed"
              type="time"
              className="field-input"
              value={bedTime}
              onChange={(event) => setBedTime(event.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="settings-week-start" className="field-label">
            بداية الأسبوع
          </label>
          <select
            id="settings-week-start"
            className="field-input max-w-sm"
            value={weekStartsOn}
            onChange={(event) => setWeekStartsOn(Number(event.target.value) as Weekday)}
          >
            {orderedWeekdays(0).map((day) => (
              <option key={day} value={day}>
                {WEEKDAY_LABELS[day]}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="field-label">الأقسام الظاهرة في التنقل</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {APP_SECTIONS.map((section) => {
              const locked = section === "dashboard";
              return (
                <label
                  key={section}
                  className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3 text-xs font-semibold ${
                    visibleSections.includes(section)
                      ? "border-sage-300 bg-sage-50 text-sage-800"
                      : "border-sage-200 bg-white text-ink-soft"
                  } ${locked ? "opacity-70" : ""}`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-sage-600"
                    checked={visibleSections.includes(section) || locked}
                    disabled={locked}
                    onChange={() => toggleSection(section)}
                  />
                  {SECTION_LABELS[section]}
                  {locked ? <span className="text-[10px]">(أساسي)</span> : null}
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-[11px] leading-5 text-ink-soft">
            إخفاء القسم بيشيله من القوائم بس؛ بياناته بتفضل محفوظة وتقدري تفتحيه من الرابط.
          </p>
        </fieldset>

        <div className="flex items-center gap-2">
          <button type="submit" className="btn-primary">
            <Save className="h-4 w-4" aria-hidden="true" />
            حفظ الإعدادات
          </button>
          {saved ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-sage-700" role="status">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              اتحفظ
            </span>
          ) : null}
        </div>
      </form>

      <section className="card space-y-4" aria-labelledby="data-title">
        <h2 id="data-title" className="flex items-center gap-2 text-sm font-bold text-ink">
          <Database className="h-4 w-4 text-sage-600" aria-hidden="true" />
          النسخ الاحتياطي والبيانات
        </h2>

        <div className="flex items-start gap-2 rounded-xl bg-sage-50 p-3 text-[11px] leading-6 text-sage-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            بياناتك محفوظة في المتصفح ده بس (تخزين محلي)، ومش بتتزامن مع أجهزة تانية.
            لو مسحتي بيانات المتصفح أو استخدمتي وضع التصفح الخاص، ممكن البيانات تضيع — عشان
            كده اعملي نسخة احتياطية كل فترة.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={handleExport}>
            <Download className="h-4 w-4" aria-hidden="true" />
            تصدير نسخة JSON
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setImportError(null);
              fileInputRef.current?.click();
            }}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            استيراد من ملف
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="اختاري ملف النسخة الاحتياطية"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
        </div>

        {importError ? (
          <p className="rounded-xl border border-[#E7C3C6] bg-[#FDF3F4] px-3 py-2 text-xs font-medium leading-6 text-[#8C333A]" role="alert">
            {importError}
          </p>
        ) : null}

        <dl className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
          <div className="rounded-xl bg-cream/70 p-2.5">
            <dt className="text-ink-soft">المهام</dt>
            <dd className="text-base font-bold text-ink">{data.tasks.length}</dd>
          </div>
          <div className="rounded-xl bg-cream/70 p-2.5">
            <dt className="text-ink-soft">العادات</dt>
            <dd className="text-base font-bold text-ink">{data.habits.length}</dd>
          </div>
          <div className="rounded-xl bg-cream/70 p-2.5">
            <dt className="text-ink-soft">مهام التنظيف</dt>
            <dd className="text-base font-bold text-ink">{data.cleaningTasks.length}</dd>
          </div>
          <div className="rounded-xl bg-cream/70 p-2.5">
            <dt className="text-ink-soft">حجم البيانات</dt>
            <dd className="text-base font-bold text-ink">{storageSizeKb} ك.ب</dd>
          </div>
        </dl>
      </section>

      <section className="card space-y-3" aria-labelledby="danger-title">
        <h2 id="danger-title" className="flex items-center gap-2 text-sm font-bold text-[#9C4451]">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          منطقة الخطر
        </h2>
        <p className="text-xs leading-6 text-ink-soft">
          تصفير التطبيق بيمسح كل المهام والعادات والتنظيف من المتصفح، ويرجعك لإعداد أول مرة.
          الخطوة دي مش بترجع، فخدي نسخة احتياطية الأول لو محتاجة.
        </p>
        <button type="button" className="btn-danger" onClick={() => setResetOpen(true)}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          تصفير التطبيق
        </button>
      </section>

      <section className="card flex items-center gap-2 text-[11px] leading-6 text-ink-soft">
        <HardDrive className="h-4 w-4 shrink-0 text-sage-600" aria-hidden="true" />
        <p>
          بيتي منظم — الإصدار {APP_VERSION} • البيانات محفوظة محليًا على جهازك ولا تُرسل لأي
          خدمة خارجية.
        </p>
      </section>

      <Modal
        open={Boolean(pendingImport)}
        onClose={() => setPendingImport(null)}
        title="مراجعة النسخة الاحتياطية"
        description="راجعي محتوى الملف قبل ما تستبدلي بياناتك الحالية."
      >
        {pendingImport ? (
          <div className="space-y-3">
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-cream/70 p-2.5">
                <dt className="text-ink-soft">الاسم</dt>
                <dd className="font-bold text-ink">
                  {pendingImport.summary.displayName || "من غير اسم"}
                </dd>
              </div>
              <div className="rounded-xl bg-cream/70 p-2.5">
                <dt className="text-ink-soft">تاريخ التصدير</dt>
                <dd className="font-bold text-ink">{pendingImport.summary.exportedAt.slice(0, 10)}</dd>
              </div>
              <div className="rounded-xl bg-cream/70 p-2.5">
                <dt className="text-ink-soft">المهام + سجلات الإكمال</dt>
                <dd className="font-bold text-ink">
                  {pendingImport.summary.tasks} / {pendingImport.summary.taskCompletions}
                </dd>
              </div>
              <div className="rounded-xl bg-cream/70 p-2.5">
                <dt className="text-ink-soft">الغرف + مهام التنظيف</dt>
                <dd className="font-bold text-ink">
                  {pendingImport.summary.rooms} / {pendingImport.summary.cleaningTasks}
                </dd>
              </div>
              <div className="rounded-xl bg-cream/70 p-2.5">
                <dt className="text-ink-soft">العادات + سجلاتها</dt>
                <dd className="font-bold text-ink">
                  {pendingImport.summary.habits} / {pendingImport.summary.habitCompletions}
                </dd>
              </div>
              <div className="rounded-xl bg-cream/70 p-2.5">
                <dt className="text-ink-soft">سجل تنظيف</dt>
                <dd className="font-bold text-ink">{pendingImport.summary.cleaningCompletions}</dd>
              </div>
            </dl>
            <p className="rounded-xl border border-[#E7C3C6] bg-[#FDF3F4] px-3 py-2 text-[11px] leading-6 text-[#8C333A]">
              لو أكّدتي، كل بياناتك الحالية هتتبدّل ببيانات الملف. مش ممكن نرجّعها.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="btn-secondary" onClick={() => setPendingImport(null)}>
                إلغاء
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  replaceData(pendingImport.backup.data);
                  setPendingImport(null);
                  setImportError(null);
                  notify("البيانات اتنقلت من النسخة الاحتياطية ✅");
                }}
              >
                استبدال البيانات
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={resetOpen}
        title="تصفير كل البيانات؟"
        description="كل المهام والعادات وسجلات الإكمال هتتمسح من المتصفح، وهترجعي لإعداد أول مرة."
        confirmLabel="أيوه، امسحي كل حاجة"
        cancelLabel="لا، استني"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          resetApp();
          setResetOpen(false);
          notify("التطبيق اتصفّر. نبدأ من جديد 🌿", "info");
        }}
      />
    </div>
  );
}
