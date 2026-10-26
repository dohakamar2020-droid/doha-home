import { expect, test } from "@playwright/test";

/**
 * اختبار PWA حقيقي: تسجيل الـ Service Worker، التخزين المسبق،
 * والشغل من غير نت بعد أول زيارة (البيانات كلها من localStorage).
 */
test.describe("التطبيق أوفلاين (PWA)", () => {
  test("الـ Service Worker يتسجل والصفحات تتخزن، وبعدها التطبيق يشتغل من غير نت", async ({
    page,
    context,
  }) => {
    await page.goto("/");

    // 1) الـ SW يتسجل ويبقى active
    await page.waitForFunction(
      () => navigator.serviceWorker.ready.then(() => true).catch(() => false),
      undefined,
      { timeout: 20000 },
    );

    // 2) الصفحات الأساسية تكون اتخزنت مسبقًا في الكاش
    await page.waitForFunction(
      async () => {
        const keys = await caches.keys();
        const shellKey = keys.find((key) => key.includes("shell"));
        if (!shellKey) return false;
        const shell = await caches.open(shellKey);
        const root = await shell.match("/");
        const today = await shell.match("/today");
        return Boolean(root && today);
      },
      undefined,
      { timeout: 20000 },
    );

    // 3) المانيفست والأيقونات متاحين
    expect((await page.request.get("/manifest.webmanifest")).status()).toBe(200);
    expect((await page.request.get("/icons/icon-192.png")).status()).toBe(200);
    const manifestJson = await (await page.request.get("/manifest.webmanifest")).json();
    expect(manifestJson.display).toBe("standalone");
    expect(manifestJson.name).toContain("بيتي منظم");

    // 4) نقفل النت ونعيد تحميل نفس الصفحة — لازم يشتغل من الكاش
    await context.setOffline(true);
    await page.reload();
    await expect(page).toHaveTitle(/بيتي منظم/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    // 5) نتنقل لصفحة تانية أوفلاين — برضه من الكاش
    await page.goto("/adhkar");
    await expect(page.getByRole("heading", { name: /أذكار الصباح والمساء/ })).toBeVisible();

    await context.setOffline(false);
  });

  test("الصفحة فيها لينك المانيفست وأيقونة apple-touch", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      "href",
      "/manifest.webmanifest",
    );
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  });
});
