import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StoreProvider } from "@/context/StoreContext";
import { DashboardView } from "@/components/views/DashboardView";
import { TodayView } from "@/components/views/TodayView";
import { WeekView } from "@/components/views/WeekView";
import { CleaningView } from "@/components/views/CleaningView";
import { HabitsView } from "@/components/views/HabitsView";
import { SettingsView } from "@/components/views/SettingsView";
import { createEmptyData } from "@/lib/defaults";
import { addHabit, addTask, toggleTaskCompletion } from "@/lib/operations";
import { todayIso, weekdayOf } from "@/lib/date";
import { STORAGE_KEY } from "@/lib/storage";
import type { AppData } from "@/types/domain";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: ({
      href,
      children,
      ...rest
    }: {
      href: string;
      children: React.ReactNode;
    } & React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
      React.createElement("a", { href, ...rest }, children),
  };
});

function seedOnboarded(mutator?: (data: AppData) => AppData): AppData {
  const base = createEmptyData();
  const withSettings: AppData = {
    ...base,
    settings: {
      ...base.settings,
      displayName: "دعاء",
      onboardingCompleted: true,
      weekStartsOn: 6,
    },
    tasks: [],
    habits: [],
  };
  const data = mutator ? mutator(withSettings) : withSettings;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

function addDailyTask(data: AppData, title = "تجهيز الغدا", time = "13:00"): AppData {
  return addTask(data, {
    title,
    category: "kitchen",
    priority: "high",
    startTime: time,
    durationMinutes: 45,
    recurrence: { type: "daily", startDate: todayIso() },
  }).data;
}

describe("صفحات التطبيق", () => {
  it("الرئيسية بتحيّي بالاسم وبتعرض مهام وتقدّم اليوم", async () => {
    seedOnboarded((data) => addDailyTask(data));
    render(
      <StoreProvider>
        <DashboardView />
      </StoreProvider>,
    );

    expect(await screen.findByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/دعاء/)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "تجهيز الغدا" })).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("الرئيسية بتعرض حالة فاضية لو مفيش مهام", async () => {
    seedOnboarded();
    render(
      <StoreProvider>
        <DashboardView />
      </StoreProvider>,
    );
    expect(await screen.findByText("يومك لسه فاضي")).toBeInTheDocument();
  });

  it("صفحة اليوم بتضيف مهمة وتكمّلها", async () => {
    seedOnboarded();
    const user = userEvent.setup();
    render(
      <StoreProvider>
        <TodayView />
      </StoreProvider>,
    );

    await screen.findByRole("heading", { name: "يومي" });
    await user.click(screen.getByRole("button", { name: "مهمة جديدة" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(
      Array.from(dialog.querySelectorAll("input")).find((input) => input.id.endsWith("-title"))!,
      "ترتيب الصالة",
    );
    await user.click(screen.getByRole("button", { name: "إضافة المهمة" }));

    const checkbox = await screen.findByRole("checkbox", { name: "ترتيب الصالة" });
    expect(checkbox).toHaveAttribute("aria-checked", "false");
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(/خلصتي 1 من 1 مهمة/)).toBeInTheDocument();
  });

  it("صفحة اليوم بتتنقل بين الأيام", async () => {
    seedOnboarded((data) => addDailyTask(data));
    const user = userEvent.setup();
    render(
      <StoreProvider>
        <TodayView />
      </StoreProvider>,
    );

    const dateInput = await screen.findByLabelText("اختاري تاريخ");
    const initial = (dateInput as HTMLInputElement).value;
    await user.click(screen.getByRole("button", { name: "اليوم التالي" }));
    expect((dateInput as HTMLInputElement).value).not.toBe(initial);
    await user.click(screen.getByRole("button", { name: "النهاردة" }));
    expect((dateInput as HTMLInputElement).value).toBe(initial);
  });

  it("صفحة الأسبوع بتعرض التقويم والتقدّم", async () => {
    seedOnboarded((data) => addDailyTask(data));
    render(
      <StoreProvider>
        <WeekView />
      </StoreProvider>,
    );
    expect(await screen.findByText("تقدّم الأسبوع")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /مهمة/ }).length).toBeGreaterThan(6);
    expect(screen.getByText(/^0 من \d+ مهمة$/)).toBeInTheDocument();
  });

  it("صفحة التنظيف بتحسب المستحق النهاردة", async () => {
    seedOnboarded();
    render(
      <StoreProvider>
        <CleaningView />
      </StoreProvider>,
    );
    expect(await screen.findByRole("heading", { name: "خطة تنظيف بيتك" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /مستحق النهاردة/ })).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);
  });

  it("صفحة العادات بتعرض العادة وتقبل التسجيل", async () => {
    seedOnboarded((data) =>
      addHabit(data, {
        name: "شرب ميه",
        weekdays: [weekdayOf(todayIso())],
      }).data,
    );
    const user = userEvent.setup();
    render(
      <StoreProvider>
        <HabitsView />
      </StoreProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "علّميها كاملة" }));
    expect(await screen.findByRole("button", { name: "اتعملت النهاردة" })).toBeInTheDocument();
    expect(screen.getByText("1 يوم متتالية")).toBeInTheDocument();
  });

  it("صفحة الإعدادات بتحفظ الاسم وتصدّر البيانات", async () => {
    const data = seedOnboarded();
    const createObjectURL = vi.fn(() => "blob:mock");
    Object.defineProperty(URL, "createObjectURL", { writable: true, value: createObjectURL });
    const user = userEvent.setup();
    render(
      <StoreProvider>
        <SettingsView />
      </StoreProvider>,
    );

    const nameInput = await screen.findByLabelText(/الاسم أو اللقب/);
    await user.clear(nameInput);
    await user.type(nameInput, "منى");
    await user.click(screen.getByRole("button", { name: "حفظ الإعدادات" }));

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as AppData;
    expect(stored.settings.displayName).toBe("منى");

    await user.click(screen.getByRole("button", { name: "تصدير نسخة JSON" }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(data.rooms.length).toBe(6);
  });

  it("إكمال مهمة في صفحة اليوم بيفضل محفوظ بعد إعادة التحميل", async () => {
    const data = seedOnboarded((current) => addDailyTask(current));
    const task = data.tasks[0];
    expect(task).toBeDefined();
    if (!task) return;
    const completed = toggleTaskCompletion(data, task.id, todayIso());
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));

    render(
      <StoreProvider>
        <TodayView />
      </StoreProvider>,
    );
    const checkbox = await screen.findByRole("checkbox", { name: "تجهيز الغدا" });
    expect(checkbox).toHaveAttribute("aria-checked", "true");
  });
});
