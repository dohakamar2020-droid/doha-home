import { expect, test } from "@playwright/test";

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

    await page.waitForURL("/");
    await expect(page.getByRole("heading", { name: /منى/ })).toBeVisible();

    // إعادة التحميل لازم تفضل على الرئيسية مش الويزارد
    await page.reload();
    await expect(page.getByRole("heading", { name: /منى/ })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);

    const stored = await page.evaluate(() => window.localStorage.getItem("bayti-monazam:data"));
    expect(stored).toContain("onboardingCompleted");
    const parsed = JSON.parse(stored ?? "{}");
    expect(parsed.settings.onboardingCompleted).toBe(true);
    expect(parsed.settings.displayName).toBe("منى");
    expect(parsed.settings.weekStartsOn).toBe(5);
    expect(parsed.tasks.length).toBeGreaterThan(0);
  });

  test("الرجوع للويزارد بعد الإعداد مايمسحش البيانات", async ({ page }) => {
    await page.goto("/welcome");
    await page.getByLabel(/اسمك أو لقبك/).fill("سلمى");
    for (let step = 0; step < 3; step += 1) {
      await page.getByRole("button", { name: "اللي بعده" }).click();
    }
    await page.getByRole("button", { name: "يلا نبدأ" }).click();
    await page.waitForURL("/");

    const before = await page.evaluate(() => window.localStorage.getItem("bayti-monazam:data"));

    await page.goto("/welcome");
    await expect(page).toHaveURL(/\/$/);

    const after = await page.evaluate(() => window.localStorage.getItem("bayti-monazam:data"));
    expect(JSON.parse(after ?? "{}").tasks.length).toBe(JSON.parse(before ?? "{}").tasks.length);
  });
});
