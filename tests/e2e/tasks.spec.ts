import { expect, test } from "@playwright/test";
import { dailyTask, seed, todayInCairo, weekdayIndex } from "./helpers";

test.describe("المهام اليومية", () => {
  test("إضافة مهمة ثم إكمالها والحفاظ عليها بعد إعادة التحميل", async ({ page }) => {
    await seed(page);
    await page.goto("/today");
    await expect(page.getByRole("heading", { name: "يومي" })).toBeVisible();

    await page.getByRole("button", { name: "مهمة جديدة" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/اسم المهمة/).fill("مكالمة مع ماما");
    await dialog.getByLabel(/وقت البداية/).fill("18:00");
    await dialog.getByRole("button", { name: "إضافة المهمة" }).click();

    const checkbox = page.getByRole("checkbox", { name: "مكالمة مع ماما" });
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toHaveAttribute("aria-checked", "false");
    await expect(page.getByText("6:00 م")).toBeVisible();

    await checkbox.click();
    await expect(checkbox).toHaveAttribute("aria-checked", "true");

    await page.reload();
    const afterReload = page.getByRole("checkbox", { name: "مكالمة مع ماما" });
    await expect(afterReload).toHaveAttribute("aria-checked", "true");
  });

  test("تعديل مهمة وحذفها بتأكيد", async ({ page }) => {
    await seed(page, { tasks: [dailyTask()] });
    await page.goto("/today");

    await page.getByRole("button", { name: "تعديل تجهيز الغدا" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/اسم المهمة/).fill("تجهيز الغدا للعيلة");
    await dialog.getByRole("button", { name: "حفظ التعديلات" }).click();
    await expect(page.getByRole("checkbox", { name: "تجهيز الغدا للعيلة" })).toBeVisible();

    await page.getByRole("button", { name: "حذف تجهيز الغدا للعيلة" }).click();
    const confirm = page.getByRole("dialog");
    await expect(confirm.getByRole("heading", { name: "تحذفي المهمة؟" })).toBeVisible();
    await confirm.getByRole("button", { name: "احذفي" }).click();
    await expect(page.getByRole("checkbox", { name: "تجهيز الغدا للعيلة" })).toHaveCount(0);
  });

  test("التنقل بين الأيام يعرض مهام اليوم المناسب", async ({ page }) => {
    await seed(page, { tasks: [dailyTask()] });
    await page.goto("/today");
    await expect(page.getByRole("checkbox", { name: "تجهيز الغدا" })).toBeVisible();

    const dateInput = page.getByLabel("اختاري تاريخ");
    const today = todayInCairo();
    await expect(dateInput).toHaveValue(today);

    await page.getByRole("button", { name: "اليوم التالي" }).click();
    const tomorrow = new Date(`${today}T00:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrowIso = tomorrow.toISOString().slice(0, 10);
    await expect(dateInput).toHaveValue(tomorrowIso);
    // المهمة اليومية ظاهرة برضه بكرة
    await expect(page.getByRole("checkbox", { name: "تجهيز الغدا" })).toBeVisible();

    await page.getByRole("button", { name: "النهاردة" }).click();
    await expect(dateInput).toHaveValue(today);
  });

  test("المهمة لمرة واحدة مش بتظهر في يوم تاني", async ({ page }) => {
    const today = todayInCairo();
    await seed(page, {
      tasks: [
        {
          id: "once-1",
          title: "زيارة الدكتور",
          category: "health",
          priority: "high",
          startTime: null,
          durationMinutes: null,
          recurrence: { type: "once", date: today },
          createdAt: new Date().toISOString(),
        },
      ],
    });
    await page.goto("/today");
    await expect(page.getByRole("checkbox", { name: "زيارة الدكتور" })).toBeVisible();

    await page.getByRole("button", { name: "اليوم التالي" }).click();
    await expect(page.getByText("مفيش مهام في اليوم ده")).toBeVisible();
    await page.getByRole("button", { name: "اليوم السابق" }).click();
    await expect(page.getByRole("checkbox", { name: "زيارة الدكتور" })).toBeVisible();
  });

  test("المهمة الأسبوعية بتظهر في الأيام المختارة بس", async ({ page }) => {
    const today = todayInCairo();
    const weekdayToday = weekdayIndex(today);
    await seed(page, {
      tasks: [
        {
          id: "weekly-1",
          title: "غسيل المفارش",
          category: "home",
          priority: "low",
          startTime: "10:00",
          durationMinutes: 30,
          recurrence: { type: "weekly", startDate: today, weekdays: [weekdayToday] },
          createdAt: new Date().toISOString(),
        },
      ],
    });

    await page.goto("/today");
    await expect(page.getByRole("checkbox", { name: "غسيل المفارش" })).toBeVisible();

    // بكرة يوم مختلف → المهمة مش موجودة
    await page.getByRole("button", { name: "اليوم التالي" }).click();
    await expect(page.getByRole("checkbox", { name: "غسيل المفارش" })).toHaveCount(0);

    // نفس اليوم الأسبوع الجاي → المهمة رجعت
    const nextWeek = new Date(`${today}T00:00:00Z`);
    nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
    await page.getByLabel("اختاري تاريخ").fill(nextWeek.toISOString().slice(0, 10));
    await expect(page.getByRole("checkbox", { name: "غسيل المفارش" })).toBeVisible();
  });
});
