import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.describe("التنقل", () => {
  test("التنقل بين الصفحات من القوائم", async ({ page }, testInfo) => {
    await seed(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const isMobile = (testInfo.project.use.viewport?.width ?? 1280) < 1024;
    const nav = page.getByRole("navigation", {
      name: isMobile ? "التنقل السفلي" : "التنقل الرئيسي",
    });
    await expect(nav).toBeVisible();

    const items = [
      { label: "يومي", url: "/today", heading: "يومي" },
      { label: "الأسبوع", url: "/week", heading: "الأسبوع" },
      { label: "التنظيف", url: "/cleaning", heading: "خطة تنظيف بيتك" },
      { label: "عاداتي", url: "/habits", heading: "عادات صغيرة… فرق كبير" },
      { label: "الإعدادات", url: "/settings", heading: "إعداداتك وبياناتك" },
    ];

    for (const item of items) {
      await nav.getByRole("link", { name: item.label }).click();
      await page.waitForURL(`**${item.url}`);
      await expect(page.getByRole("heading", { name: item.heading, level: 1 })).toBeVisible();
    }

    await nav.getByRole("link", { name: "الرئيسية" }).click();
    await page.waitForURL(/\/$/);
  });

  test("الصفحة مش موجودة بتعرض رسالة ودية", async ({ page }) => {
    await seed(page);
    await page.goto("/not-a-real-page");
    await expect(page.getByRole("heading", { name: "الصفحة دي مش موجودة" })).toBeVisible();
    await page.getByRole("link", { name: "رجوع للرئيسية" }).click();
    await page.waitForURL(/\/$/);
  });

  test("مافيش تمرير أفقي على الموبايل", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "اختبار خاص بالموبايل");
    await seed(page);
    for (const path of ["/", "/today", "/week", "/cleaning", "/habits", "/settings"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    }
  });
});
