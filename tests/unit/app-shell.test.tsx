import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "@/components/AppShell";
import { StoreProvider } from "@/context/StoreContext";
import { createEmptyData } from "@/lib/defaults";
import { STORAGE_KEY } from "@/lib/storage";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
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

function renderShell() {
  return render(
    <StoreProvider>
      <AppShell>
        <h1>محتوى الصفحة</h1>
      </AppShell>
    </StoreProvider>,
  );
}

describe("هيكل التطبيق", () => {
  it("بيوجّه للإعداد الأول لو لسه ما اتعملش", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(createEmptyData()));
    renderShell();
    await screen.findByRole("heading", { name: "محتوى الصفحة" });
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/welcome");
    });
  });

  it("بيعرض التنقل الكامل لما الإعداد يخلص", async () => {
    const data = createEmptyData();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...data, settings: { ...data.settings, onboardingCompleted: true } }),
    );
    renderShell();

    await screen.findByRole("heading", { name: "محتوى الصفحة" });
    const navs = screen.getAllByRole("navigation");
    expect(navs.length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "يومي" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "عاداتي" }).length).toBeGreaterThan(0);
    expect(replace).not.toHaveBeenCalledWith("/welcome");
  });

  it("بيخفي الأقسام غير الظاهرة من التنقل", async () => {
    const data = createEmptyData();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...data,
        settings: {
          ...data.settings,
          onboardingCompleted: true,
          visibleSections: ["dashboard", "today"],
        },
      }),
    );
    renderShell();

    await screen.findByRole("heading", { name: "محتوى الصفحة" });
    expect(screen.queryAllByRole("link", { name: "التنظيف" })).toHaveLength(0);
    expect(screen.getAllByRole("link", { name: "يومي" }).length).toBeGreaterThan(0);
  });

  it("بيعرض خطأ وبيسمح بالبدء من جديد لو البيانات تالفة", async () => {
    window.localStorage.setItem(STORAGE_KEY, "{broken");
    const user = userEvent.setup();
    renderShell();

    await screen.findByText("معرفناش نقرا بياناتك المحفوظة");
    await user.click(screen.getByRole("button", { name: "ابدئي ببيانات جديدة" }));
    await screen.findByRole("heading", { name: "محتوى الصفحة" });
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/welcome");
    });
  });
});
