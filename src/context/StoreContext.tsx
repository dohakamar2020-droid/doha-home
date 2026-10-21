"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AppData } from "@/types/domain";
import { loadData, saveData, clearStoredData, STORAGE_KEY } from "@/lib/storage";
import { createEmptyData } from "@/lib/defaults";
import { resetAll } from "@/lib/operations";
import { createId } from "@/lib/id";

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

export type StoreStatus = "loading" | "ready" | "error";

interface StoreValue {
  status: StoreStatus;
  data: AppData | null;
  loadError: string | null;
  storageError: string | null;
  clearStorageError: () => void;
  update: (updater: (current: AppData) => AppData) => void;
  replaceData: (next: AppData) => void;
  resetApp: () => void;
  retryLoad: () => void;
  startFresh: () => void;
  toasts: Toast[];
  notify: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<StoreStatus>("loading");
  const [data, setData] = useState<AppData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const loadedRef = useRef(false);
  const lastSavedRef = useRef<string | null>(null);

  const bootstrap = useCallback(() => {
    const result = loadData();
    if (result.status === "ok") {
      lastSavedRef.current = JSON.stringify(result.data);
      setData(result.data);
      setStatus("ready");
      setLoadError(null);
      return;
    }
    if (result.status === "empty" || result.status === "unavailable") {
      const initial = createEmptyData();
      const saved = saveData(initial);
      if (!saved.ok) setStorageError(saved.message);
      lastSavedRef.current = JSON.stringify(initial);
      setData(initial);
      setStatus("ready");
      setLoadError(
        result.status === "unavailable"
          ? "المتصفح مش سامح بالحفظ المحلي، فالتغييرات مش هتتفضل بعد إغلاق الصفحة."
          : null,
      );
      return;
    }
    setStatus("error");
    setLoadError(result.message);
  }, []);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    bootstrap();
  }, [bootstrap]);

  // الحفظ التلقائي بعد كل تغيير — بعد التحميل الأولي فقط
  useEffect(() => {
    if (status !== "ready" || !data) return;
    const serialized = JSON.stringify(data);
    if (serialized === lastSavedRef.current) return;
    const result = saveData(data);
    if (result.ok) {
      lastSavedRef.current = serialized;
      setStorageError(null);
    } else {
      setStorageError(result.message);
    }
  }, [data, status]);

  // تزامن بين التابات: لو فيه تاب تاني عدّل البيانات، نحدّث هنا
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      if (!event.newValue) return;
      const result = loadData();
      if (result.status === "ok") {
        lastSavedRef.current = JSON.stringify(result.data);
        setData(result.data);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const update = useCallback((updater: (current: AppData) => AppData) => {
    setData((current) => (current ? updater(current) : current));
  }, []);

  const replaceData = useCallback((next: AppData) => {
    setData(next);
  }, []);

  const resetApp = useCallback(() => {
    const fresh = resetAll();
    setData(fresh);
    setStorageError(null);
    setLoadError(null);
  }, []);

  const retryLoad = useCallback(() => {
    setStatus("loading");
    setLoadError(null);
    bootstrap();
  }, [bootstrap]);

  const startFresh = useCallback(() => {
    clearStoredData();
    const fresh = createEmptyData();
    setData(fresh);
    setStatus("ready");
    setLoadError(null);
    setStorageError(null);
  }, []);

  const notify = useCallback((message: string, tone: ToastTone = "success") => {
    const toast: Toast = { id: createId(), message, tone };
    setToasts((current) => [...current.slice(-2), toast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const clearStorageError = useCallback(() => setStorageError(null), []);

  const value = useMemo<StoreValue>(
    () => ({
      status,
      data,
      loadError,
      storageError,
      clearStorageError,
      update,
      replaceData,
      resetApp,
      retryLoad,
      startFresh,
      toasts,
      notify,
      dismissToast,
    }),
    [
      status,
      data,
      loadError,
      storageError,
      clearStorageError,
      update,
      replaceData,
      resetApp,
      retryLoad,
      startFresh,
      toasts,
      notify,
      dismissToast,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore لازم تُستخدم داخل StoreProvider");
  return context;
}
