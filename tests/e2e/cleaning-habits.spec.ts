import { expect, test } from "@playwright/test";
import { habitEveryDay, seed, todayInCairo } from "./helpers";

test.describe("تنظيف البيت", () => {
  test("إكمال مهمة تنظيف مستحقة النهاردة والحفاظ عليها", async ({ page }) => {
    await seed(page);
    await page.goto("/cleaning");
    await expect(page.getByRole("heading", { name: "خطة تنظيف بيتك" })).toBeVisible();

    const checkbox = page.getByRole("checkbox", { name: /مسح أسطح المطبخ/ }).first();
    await expect(checkbox).toHaveAttribute("aria-checked", "false");
    await checkbox.click();
    await expect(checkbox).toHaveAttribute("aria-checked", "true");

    await page.reload();
    await expect(page.getByRole("checkbox", { name: /مسح أسطح المطبخ/ }).first()).toHaveAttribute(
      "aria-checked",
      "true",
    );

    const stored = await page.evaluate(() => window.localStorage.getItem("bayti-monazam:data"));
    const parsed = JSON.parse(stored ?? "{}");
    expect(parsed.cleaningCompletions).toHaveLength(1);
    expect(parsed.cleaningCompletions[0].date).toBe(todayInCairo());
  });

  test("إضافة غرفة جديدة ومهمة تنظيف ليها", async ({ page }) => {
    await seed(page);
    await page.goto("/cleaning");

    await page.getByRole("button", { name: "غرفة", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("اسم الغرفة").fill("أوضة الأطفال");
    await dialog.getByRole("button", { name: "إضافة الغرفة" }).click();
    await expect(page.getByRole("heading", { name: "أوضة الأطفال" })).toBeVisible();

    await page.getByRole("button", { name: "إضافة مهمة تنظيف لـ أوضة الأطفال" }).click();
    const taskDialog = page.getByRole("dialog");
    await taskDialog.getByLabel("اسم مهمة التنظيف").fill("ترتيب اللعب");
    await taskDialog.getByRole("button", { name: "إضافة المهمة" }).click();

    await expect(page.getByText("ترتيب اللعب").first()).toBeVisible();
  });
});

test.describe("العادات", () => {
  test("تسجيل عادة ومتابعة السلسلة بعد إعادة التحميل", async ({ page }) => {
    await seed(page, { habits: [habitEveryDay()] });
    await page.goto("/habits");
    await expect(page.getByRole("heading", { name: "عادات صغيرة… فرق كبير" })).toBeVisible();

    await page.getByRole("button", { name: "علّميها كاملة" }).click();
    await expect(page.getByText("1 يوم متتالية")).toBeVisible();
    await expect(page.getByRole("button", { name: "اتعملت النهاردة" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: "اتعملت النهاردة" })).toBeVisible();
    await expect(page.getByText("1 يوم متتالية")).toBeVisible();
  });

  test("إنشاء عادة جديدة من الواجهة", async ({ page }) => {
    await seed(page);
    await page.goto("/habits");
    await page.getByRole("button", { name: "عادة جديدة" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("اسم العادة").fill("قراءة صفحتين");
    await dialog.getByRole("button", { name: "إضافة العادة" }).click();

    await expect(page.getByRole("heading", { name: "قراءة صفحتين" })).toBeVisible();
    const stored = await page.evaluate(() => window.localStorage.getItem("bayti-monazam:data"));
    expect(JSON.parse(stored ?? "{}").habits).toHaveLength(1);
  });
});
