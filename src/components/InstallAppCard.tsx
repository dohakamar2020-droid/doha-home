"use client";

import { Download, Smartphone } from "lucide-react";
import { useInstallPrompt } from "@/components/ServiceWorkerRegistrar";
import { useStore } from "@/context/StoreContext";

/**
 * كارت تثبيت التطبيق: على أندرويد/كروم فيه زر تثبيت مباشر،
 * وعلى iOS بتظهر خطوات الإضافة للشاشة الرئيسية.
 */
export function InstallAppCard() {
  const { notify } = useStore();
  const { canInstall, installed, install } = useInstallPrompt();

  return (
    <section className="card space-y-3" aria-labelledby="install-title">
      <h2 id="install-title" className="flex items-center gap-2 text-sm font-bold text-ink">
        <Smartphone className="h-4 w-4 text-sage-600" aria-hidden="true" />
        تطبيق على جهازك
      </h2>

      {installed ? (
        <p className="text-xs leading-6 text-ink-soft">
          التطبيق متثبّت على جهازك بالفعل 🎉 وبيشتغل من غير نت، وبياناتك محفوظة على الجهاز.
        </p>
      ) : (
        <>
          <p className="text-xs leading-6 text-ink-soft">
            نزّلي «بيتي منظم» كأيقونة على شاشة موبايلك، هيفتح من غير شريط المتصفح
            وبيشتغل حتى لو النت مقطوع.
          </p>

          {canInstall ? (
            <button
              type="button"
              className="btn-primary btn-sm self-start"
              onClick={async () => {
                const outcome = await install();
                if (outcome === "accepted") notify("التطبيق اتنزّل على جهازك 📱🎉");
              }}
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              نزّلي التطبيق
            </button>
          ) : (
            <div className="space-y-2 rounded-xl bg-cream/70 p-3 text-[11px] leading-6 text-ink-soft">
              <p className="font-bold text-ink">على الآيفون (سفاري):</p>
              <p>زر المشاركة ▲ من تحت ← «إضافة إلى الشاشة الرئيسية» ← «إضافة».</p>
              <p className="font-bold text-ink">على أندرويد (كروم):</p>
              <p>قائمة النقط الثلاثة ⋮ فوق ← «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
