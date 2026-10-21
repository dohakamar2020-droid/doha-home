"use client";

import { useEffect, useState } from "react";
import { todayIso } from "@/lib/date";
import type { IsoDate } from "@/types/domain";

/** تاريخ اليوم المحلي، بيتحدّث تلقائيًا لما اليوم يتغيّر والتطبيق مفتوح */
export function useToday(): IsoDate {
  const [today, setToday] = useState<IsoDate>(() => todayIso());

  useEffect(() => {
    const check = () => {
      setToday((previous) => {
        const next = todayIso();
        return next === previous ? previous : next;
      });
    };
    const interval = window.setInterval(check, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, []);

  return today;
}
