import { expect, test } from "@playwright/test";
import { readStored } from "./helpers";

test.describe("الإعداد الأول", () => {
  test("يمشي في الويزارد ويوصل للرئيسية ويحفظ الإعداد", async ({ page }) => {
    await page.goto("/welcome");
    await expect(page.getByRole("heading", { name: "بيتي منظم" })).toBeVisible();

    await page.getByLabel(/اسمك أو لقبك/).fill("منى");
    await page.getByRole("button", { name: "اللي بعده" }).click();

    // اختيار بداية الأسبوع (الجمعة)
    await page.getByRole("radio", { name: "الجمعة" }).check();
    await page.getByRole("button", { name: "اللي بعده" }).click();

    // اختيار قالب البداية
    await page.getByRole("radio", { name: /يوم بيت متوازن/ }).check();
    await page.getByRole("button", { name: "اللي بعده" }).click();

    await expect(page.getByText("أهلًا منى!")).toBeVisible();
    await page.getByRole("button", { name: "يلا نبدأ" }).click();

    await page.waitForURL((url) => url.pathname === "/");
    await expect(page.getByRole("heading", { name: /منى/ })).toBeVisible();

    // إعادة التحميل لازم تفضل على الرئيسية مش الويزارد
    await page.reload();
    await expect(page.getByRole("heading", { name: /منى/ })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);

    await expect
      .poll(async () => {
        const stored = await readStored(page);
        return stored ? stored.tasks.length : 0;
      })
      .toBeGreaterThan(0);

    const parsed = await readStored(page);
    expect(parsed?.settings.onboardingCompleted).toBe(true);
    expect(parsed?.settings.displayName).toBe("منى");
    expect(parsed?.settings.weekStartsOn).toBe(5);
  });

  test("الرجوع للويزارد بعد الإعداد مايمسحش البيانات", async ({ page }) => {
    await page.goto("/welcome");
    await page.getByLabel(/اسمك أو لقبك/).fill("سلمى");
    for (let step = 0; step < 3; step += 1) {
      await page.getByRole("button", { name: "اللي بعده" }).click();
    }
    await page.getByRole("button", { name: "يلا نبدأ" }).click();
    await page.waitForURL((url) => url.pathname === "/");

    const before = await readStored(page);

    await page.goto("/welcome");
    await expect(page).toHaveURL(/\/$/);

    const after = await readStored(page);
    expect(after?.tasks.length).toBe(before?.tasks.length);
  });
});
