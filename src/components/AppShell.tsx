"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { AppHeader } from "@/components/AppHeader";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { status, data, loadError, retryLoad, startFresh, storageError, clearStorageError } =
    useStore();
  const pathname = usePathname();
  const router = useRouter();
  const isWelcome = pathname === "/welcome";

  useEffect(() => {
    if (status !== "ready" || !data) return;
    if (!data.settings.onboardingCompleted && !isWelcome) {
      router.replace("/welcome");
    } else if (data.settings.onboardingCompleted && isWelcome) {
      router.replace("/");
    }
  }, [status, data, isWelcome, router]);

  if (status === "loading") {
    return (
      <div className="mx-auto min-h-dvh max-w-md">
        <LoadingState />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto min-h-dvh max-w-md">
        <ErrorState
          title="معرفناش نقرا بياناتك المحفوظة"
          message={loadError}
          onRetry={retryLoad}
          onReset={startFresh}
          resetLabel="ابدئي ببيانات جديدة"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh">
      <DesktopSidebar
        displayName={data?.settings.displayName ?? ""}
        visibleSections={data?.settings.visibleSections ?? []}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        {storageError ? (
          <div
            className="mx-auto mt-3 flex w-full max-w-3xl items-start gap-2 rounded-2xl border border-[#E7C3C6] bg-[#FDF3F4] px-4 py-3 text-xs font-medium text-[#8C333A] lg:max-w-5xl"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="flex-1 leading-6">{storageError}</p>
            <button
              type="button"
              onClick={clearStorageError}
              className="rounded-lg p-1 hover:bg-black/5"
              aria-label="إخفاء تحذير التخزين"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
        <main
          id="main-content"
          className={`mx-auto w-full max-w-3xl flex-1 px-4 pb-6 pt-4 sm:px-6 lg:max-w-5xl lg:px-8 lg:pt-8 ${
            data?.settings.onboardingCompleted ? "pb-safe-nav lg:pb-10" : "pb-10"
          }`}
        >
          {children}
        </main>
        {data?.settings.onboardingCompleted ? (
          <MobileBottomNav visibleSections={data.settings.visibleSections} />
        ) : null}
      </div>
    </div>
  );
}
