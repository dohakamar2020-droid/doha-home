import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskForm } from "@/components/TaskForm";
import type { Task } from "@/types/domain";

const existingTask: Task = {
  id: "task-1",
  title: "تجهيز الغدا",
  notes: "خضار",
  category: "kitchen",
  priority: "high",
  startTime: "13:00",
  durationMinutes: 45,
  recurrence: { type: "weekly", startDate: "2026-10-21", weekdays: [1, 3] },
  createdAt: "2026-10-21T08:00:00.000Z",
};

describe("نموذج المهمة", () => {
  it("يعرض خطأ لما الاسم فاضي ومش بيبعت", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <TaskForm open onClose={vi.fn()} onSubmit={onSubmit} defaultDate="2026-10-21" />,
    );

    await user.click(screen.getByRole("button", { name: "إضافة المهمة" }));
    expect(await screen.findByText("اكتبي اسم المهمة")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("ينشئ مهمة جديدة بالبيانات المطلوبة", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(
      <TaskForm open onClose={onClose} onSubmit={onSubmit} defaultDate="2026-10-21" />,
    );

    await user.type(screen.getByLabelText(/اسم المهمة/), "غسل المواعين");
    await user.type(screen.getByLabelText(/وقت البداية/), "09:30");
    await user.type(screen.getByLabelText(/المدة بالدقايق/), "20");
    await user.click(screen.getByRole("button", { name: "إضافة المهمة" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      title: "غسل المواعين",
      notes: undefined,
      category: "home",
      priority: "medium",
      startTime: "09:30",
      durationMinutes: 20,
      recurrence: { type: "once", date: "2026-10-21" },
    });
  });

  it("يحمّل بيانات المهمة عند التعديل ويحفظ التعديلات", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <TaskForm
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        initialTask={existingTask}
        defaultDate="2026-10-21"
      />,
    );

    expect(screen.getByText("تعديل المهمة")).toBeInTheDocument();
    const titleInput = screen.getByLabelText(/اسم المهمة/);
    expect(titleInput).toHaveValue("تجهيز الغدا");

    await user.clear(titleInput);
    await user.type(titleInput, "غدا العيلة");
    await user.click(screen.getByRole("button", { name: "حفظ التعديلات" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      title: "غدا العيلة",
      category: "kitchen",
      priority: "high",
      startTime: "13:00",
      durationMinutes: 45,
      recurrence: { type: "weekly", startDate: "2026-10-21", weekdays: [1, 3] },
    });
  });

  it("يتحقق من يوم الشهر في التكرار الشهري", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <TaskForm open onClose={vi.fn()} onSubmit={onSubmit} defaultDate="2026-10-21" />,
    );

    await user.type(screen.getByLabelText(/اسم المهمة/), "تنظيف الشبابيك");
    await user.click(screen.getByRole("radio", { name: /كل شهر/ }));
    const dayInput = screen.getByLabelText("يوم الشهر");
    await user.clear(dayInput);
    await user.click(screen.getByRole("button", { name: "إضافة المهمة" }));

    expect(await screen.findByText("اكتبي يوم الشهر")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("يتحقق من أيام الأسبوع في التكرار الأسبوعي", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <TaskForm open onClose={vi.fn()} onSubmit={onSubmit} defaultDate="2026-10-21" />,
    );

    await user.type(screen.getByLabelText(/اسم المهمة/), "غسيل");
    await user.click(screen.getByRole("radio", { name: /كل أسبوع/ }));
    // في تاريخ 2026-10-21 (الأربع) بيختار اليوم تلقائيًا
    const wednesday = screen.getByRole("button", { name: "الأربع" });
    expect(wednesday).toHaveAttribute("aria-pressed", "true");
    await user.click(wednesday);
    await user.click(screen.getByRole("button", { name: "إضافة المهمة" }));

    expect(await screen.findByText("اختاري يوم واحد على الأقل للأسبوع")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
