import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskList } from "@/components/TaskList";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ProgressBar } from "@/components/ProgressBar";
import type { Task, TaskCompletion } from "@/types/domain";

const tasks: Task[] = [
  {
    id: "t1",
    title: "تجهيز الفطار",
    category: "kitchen",
    priority: "high",
    startTime: "08:00",
    durationMinutes: 30,
    recurrence: { type: "daily", startDate: "2026-10-01" },
    createdAt: "2026-10-01T08:00:00.000Z",
  },
  {
    id: "t2",
    title: "ترتيب الصالة",
    category: "home",
    priority: "medium",
    startTime: null,
    durationMinutes: null,
    recurrence: { type: "once", date: "2026-10-21" },
    createdAt: "2026-10-01T08:00:00.000Z",
  },
];

const completions: TaskCompletion[] = [
  {
    id: "c1",
    taskId: "t1",
    date: "2026-10-21",
    completedAt: "2026-10-21T08:30:00.000Z",
  },
];

describe("عرض المهام والإكمال", () => {
  it("يعرض حالة الإكمال من سجلات اليوم", () => {
    render(
      <TaskList
        tasks={tasks}
        date="2026-10-21"
        completions={completions}
        onToggle={vi.fn()}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
    expect(screen.getByRole("checkbox", { name: "تجهيز الفطار" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("checkbox", { name: "ترتيب الصالة" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("بينادي onToggle بمعرّف المهمة", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <TaskList
        tasks={tasks}
        date="2026-10-21"
        completions={completions}
        onToggle={onToggle}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "ترتيب الصالة" }));
    expect(onToggle).toHaveBeenCalledWith("t2");
  });

  it("يعرض الأوقات والتكرار والملاحظات والتفاصيل", () => {
    render(
      <TaskList tasks={tasks} date="2026-10-21" completions={[]} onToggle={vi.fn()} />,
    );
    expect(screen.getByText("8:00 ص")).toBeInTheDocument();
    expect(screen.getByText("30 دقيقة")).toBeInTheDocument();
    expect(screen.getByText("كل يوم")).toBeInTheDocument();
    expect(screen.getByText("من غير وقت محدد")).toBeInTheDocument();
    expect(screen.getAllByText("المطبخ").length).toBeGreaterThan(0);
  });

  it("يعرض الحالة الفاضية لو مفيش مهام", () => {
    render(
      <TaskList
        tasks={[]}
        date="2026-10-21"
        completions={[]}
        onToggle={vi.fn()}
        emptyState={<p>مفيش مهام</p>}
      />,
    );
    expect(screen.getByText("مفيش مهام")).toBeInTheDocument();
  });
});

describe("نافذة التأكيد", () => {
  it("بتأكد وبعدين بتنفّذ", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="تحذفي المهمة؟"
        description="مش هترجع"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    await user.click(screen.getByRole("button", { name: "أيوه، أكيد" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("بتلغي من غير تنفيذ", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="تحذفي المهمة؟"
        description="مش هترجع"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "لا، خلاص" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("بتقفل بمفتاح Escape", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog open title="تأكيد" description="..." onConfirm={vi.fn()} onCancel={onCancel} />,
    );
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe("شريط التقدّم", () => {
  it("بيعرض النسبة بشكل صحيح ومقصوص", () => {
    const { rerender } = render(<ProgressBar value={42} label="التقدّم" showValue />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "42");
    expect(screen.getByText("42%")).toBeInTheDocument();

    rerender(<ProgressBar value={130} label="التقدّم" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });
});
