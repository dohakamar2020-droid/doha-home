import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WelcomeWizard } from "@/components/WelcomeWizard";
import { StoreProvider } from "@/context/StoreContext";
import { createEmptyData } from "@/lib/defaults";
import { addTask } from "@/lib/operations";
import { todayIso } from "@/lib/date";
import { STORAGE_KEY } from "@/lib/storage";
import type { AppData } from "@/types/domain";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/welcome",
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
}));

function stored(): AppData {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as AppData;
}

describe("ويزارد الإعداد الأول", () => {
  it("بيكمّل الخطوات وبيحفظ الإعداد مع قالب البداية", async () => {
    const user = userEvent.setup();
    render(
      <StoreProvider>
        <WelcomeWizard />
      </StoreProvider>,
    );

    await screen.findByText("أهلًا بيكي");
    await user.type(screen.getByLabelText(/اسمك أو لقبك/), "منى");
    await user.click(screen.getByRole("button", { name: "اللي بعده" }));

    await user.click(screen.getByRole("radio", { name: "الجمعة" }));
    await user.click(screen.getByRole("button", { name: "اللي بعده" }));

    await user.click(screen.getByRole("radio", { name: /يوم هادي وخفيف/ }));
    await user.click(screen.getByRole("button", { name: "اللي بعده" }));

    expect(await screen.findByText("أهلًا منى!")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "يلا نبدأ" }));

    expect(replace).toHaveBeenCalledWith("/");
    const data = stored();
    expect(data.settings.onboardingCompleted).toBe(true);
    expect(data.settings.displayName).toBe("منى");
    expect(data.settings.weekStartsOn).toBe(5);
    expect(data.settings.routineTemplate).toBe("calm");
    expect(data.tasks.length).toBeGreaterThan(0);
    expect(data.habits.length).toBeGreaterThan(0);
    expect(data.rooms).toHaveLength(6);
  });

  it("إعادة الإعداد ما بتمسحش المهام الموجودة", async () => {
    const base = createEmptyData();
    const existing = addTask(
      { ...base, settings: { ...base.settings, onboardingCompleted: true } },
      {
        title: "مهمة قديمة",
        category: "home",
        priority: "medium",
        recurrence: { type: "once", date: todayIso() },
      },
    ).data;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    const user = userEvent.setup();
    render(
      <StoreProvider>
        <WelcomeWizard />
      </StoreProvider>,
    );

    await screen.findByText("أهلًا بيكي");
    for (let step = 0; step < 3; step += 1) {
      await user.click(screen.getByRole("button", { name: "اللي بعده" }));
    }
    await user.click(screen.getByRole("button", { name: "يلا نبدأ" }));

    const data = stored();
    expect(data.tasks).toHaveLength(1);
    expect(data.tasks[0]?.title).toBe("مهمة قديمة");
    expect(data.settings.onboardingCompleted).toBe(true);
  });
});
