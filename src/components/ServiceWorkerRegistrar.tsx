"use client";

import { useEffect, useState } from "react";

/**
 * تسجيل الـ Service Worker عشان التطبيق يشتغل أوفلاين.
 * التسجيل في production فقط — في التطوير مفيش SW عشان الهوت ريلود ميتلخبطش.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // التسجيل الفاشل مش بيكسر التطبيق — بيشغل عادي أونلاين
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * حدث التثبيت من المتصفح (أندرويد/كروم): بيظهر لما المتصفح يسمح بتثبيت التطبيق.
 * iOS مفيهوش الحدث ده — المستخدمة بتثبّت من قائمة المشاركة، وده بنوضحه في الإعدادات.
 */
export function useInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const installedStandalone =
    typeof window !== "undefined" &&
    window.matchMedia("(display-mode: standalone)").matches;

  return {
    canInstall: Boolean(installEvent) && !installed,
    installed: installed || installedStandalone,
    install: async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
      if (!installEvent) return "unavailable";
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setInstallEvent(null);
      }
      return choice.outcome;
    },
  };
}
