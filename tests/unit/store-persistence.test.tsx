import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StoreProvider, useStore } from "@/context/StoreContext";
import { createEmptyData } from "@/lib/defaults";
import { addTask, toggleTaskCompletion } from "@/lib/operations";
import { STORAGE_KEY } from "@/lib/storage";
import type { AppData } from "@/types/domain";

function seedStorage(): AppData {
  const base = createEmptyData();
  const withSettings: AppData = {
    ...base,
    settings: { ...base.settings, displayName: "دعاء", onboardingCompleted: true },
    tasks: [],
    habits: [],
  };
  const { data } = addTask(withSettings, {
    title: "مهمة محفوظة",
    category: "home",
    priority: "medium",
    startTime: "10:00",
    recurrence: { type: "daily", startDate: "2026-10-21" },
  });
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

function Harness() {
  const { status, data, update } = useStore();
  if (status !== "ready" || !data) return <p>بنجهّز…</p>;
  return (
    <ul>
      {data.tasks.map((task) => {
        const completed = data.taskCompletions.some(
          (completion) => completion.taskId === task.id && completion.date === "2026-10-21",
        );
        return (
          <li key={task.id}>
            <button
              type="button"
              aria-pressed={completed}
              onClick={() =>
                update((current) => toggleTaskCompletion(current, task.id, "2026-10-21"))
              }
            >
              {task.title}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

describe("متجر البيانات والحفظ المحلي", () => {
  it("بيحمّل البيانات المحفوظة عند البدء", async () => {
    seedStorage();
    render(
      <StoreProvider>
        <Harness />
      </StoreProvider>,
    );
    expect(await screen.findByRole("button", { name: "مهمة محفوظة" })).toBeInTheDocument();
  });

  it("بيحفظ الإكمال تلقائيًا ويقراه بعد إعادة التحميل", async () => {
    seedStorage();
    const user = userEvent.setup();
    const first = render(
      <StoreProvider>
        <Harness />
      </StoreProvider>,
    );

    const button = await screen.findByRole("button", { name: "مهمة محفوظة" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");

    await waitFor(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY) ?? "";
      expect(stored).toContain("taskCompletions");
      const parsed = JSON.parse(stored) as AppData;
      expect(parsed.taskCompletions).toHaveLength(1);
      expect(parsed.taskCompletions[0]?.date).toBe("2026-10-21");
    });

    first.unmount();
    render(
      <StoreProvider>
        <Harness />
      </StoreProvider>,
    );
    const reloaded = await screen.findByRole("button", { name: "مهمة محفوظة" });
    expect(reloaded).toHaveAttribute("aria-pressed", "true");
  });

  it("بيبدأ ببيانات فاضية لو مفيش تخزين", async () => {
    window.localStorage.clear();
    render(
      <StoreProvider>
        <Harness />
      </StoreProvider>,
    );
    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as AppData;
      expect(parsed.tasks).toEqual([]);
      expect(parsed.rooms.length).toBe(6);
    });
  });
});
