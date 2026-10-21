import { expect, test } from "@playwright/test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dailyTask, readStored, seed } from "./helpers";

test.describe("النسخ الاحتياطي", () => {
  test("تصدير البيانات ثم استيرادها من جديد", async ({ page }) => {
    await seed(page, { tasks: [dailyTask()] });
    await page.goto("/settings");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "تصدير نسخة JSON" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(
      /^bayti-monazam-backup-\d{4}-\d{2}-\d{2}\.json$/,
    );
    const filePath = await download.path();
    expect(filePath).toBeTruthy();

    await expect.poll(async () => (await readStored(page))?.tasks.length ?? 0).toBe(1);

    await page.locator('input[type="file"]').setInputFiles(filePath!);
    const preview = page.getByRole("dialog");
    await expect(preview.getByRole("heading", { name: "مراجعة النسخة الاحتياطية" })).toBeVisible();
    await preview.getByRole("button", { name: "استبدال البيانات" }).click();

    await expect(page.getByText("البيانات اتنقلت من النسخة الاحتياطية")).toBeVisible();
    await expect
      .poll(async () => (await readStored(page))?.tasks.some((task) => task.title === "تجهيز الغدا"))
      .toBe(true);
  });

  test("ملف غير صالح بيترفض برسالة واضحة", async ({ page }) => {
    await seed(page, { tasks: [dailyTask()] });
    await page.goto("/settings");

    const dir = await mkdtemp(join(tmpdir(), "bayti-"));
    const invalidPath = join(dir, "broken.json");
    await writeFile(invalidPath, JSON.stringify({ app: "bayti-monazam", hello: "world" }), "utf8");

    await page.locator('input[type="file"]').setInputFiles(invalidPath);
    await expect(page.getByRole("alert").filter({ hasText: "غير صالحة" })).toBeVisible();
    const stored = await readStored(page);
    expect(stored?.tasks.length).toBe(1);
  });

  test("تصفير التطبيق بعد تأكيد صريح", async ({ page }) => {
    await seed(page, { tasks: [dailyTask()] });
    await page.goto("/settings");

    await page.getByRole("button", { name: "تصفير التطبيق" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "تصفير كل البيانات؟" })).toBeVisible();
    await dialog.getByRole("button", { name: "أيوه، امسحي كل حاجة" }).click();

    await page.waitForURL(/\/welcome$/);
    await expect.poll(async () => (await readStored(page))?.tasks.length ?? -1).toBe(0);
  });
});
