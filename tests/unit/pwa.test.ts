import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import manifest from "@/app/manifest";
import {
  PWA_CACHE_VERSION_PREFIX,
  PWA_PRECACHE_ROUTES,
  isPrecacheRoute,
} from "@/lib/pwa";

describe("manifest تطبيق PWA", () => {
  const appManifest = manifest();

  it("standalone بأيقونات PNG حقيقية ونسخة maskable", () => {
    expect(appManifest.display).toBe("standalone");
    expect(appManifest.start_url).toBe("/");
    expect(appManifest.scope).toBe("/");
    expect(appManifest.theme_color).toBe("#719B83");
    expect(appManifest.background_color).toBe("#FAF7F2");
    expect(appManifest.lang).toBe("ar");
    expect(appManifest.dir).toBe("rtl");

    const icons = appManifest.icons ?? [];
    expect(icons.some((icon) => "src" in icon && icon.src === "/icons/icon-192.png")).toBe(true);
    expect(icons.some((icon) => "src" in icon && icon.src === "/icons/icon-512.png")).toBe(true);
    expect(
      icons.some(
        (icon) => "purpose" in icon && icon.purpose === "maskable" && icon.sizes === "512x512",
      ),
    ).toBe(true);
  });

  it("فيه اختصارات سريعة لليومي والتنظيف والأذكار", () => {
    const urls = (appManifest.shortcuts ?? []).map((shortcut) => shortcut.url);
    expect(urls).toContain("/today");
    expect(urls).toContain("/cleaning");
    expect(urls).toContain("/adhkar");
  });
});

describe("Service Worker", () => {
  const swSource = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");

  it("قائمة التخزين المسبق في sw.js مطابقة لمسارات التطبيق", () => {
    // نقرأ مصفوفة PRECACHE_ROUTES من كود الـ SW نفسه ونتأكد إنها غطّت كل الصفحات
    const match = swSource.match(/PRECACHE_ROUTES\s*=\s*\[([^\]]+)\]/);
    expect(match).not.toBeNull();
    const declared = (match?.[1] ?? "")
      .split(",")
      .map((line) => line.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);
    for (const route of PWA_PRECACHE_ROUTES) {
      expect(declared).toContain(route);
    }
    expect(declared).toHaveLength(PWA_PRECACHE_ROUTES.length);
  });

  it("بيستخدم اسم كاش بإصدار وبيفضّل الكاشات القديمة عند التفعيل", () => {
    expect(swSource).toContain(`const VERSION = "${PWA_CACHE_VERSION_PREFIX}1"`);
    expect(swSource).toContain("skipWaiting");
    expect(swSource).toContain("clients.claim");
    expect(swSource).toContain("caches.delete");
  });

  it("بيخزن أصول JS/CSS والخطوط بتاعة كل صفحة عشان الهيدريشن أوفلاين", () => {
    // بنستخرج دالتي الاستخراج من كود الـ SW نفسه ونختبرهم سلوكيًا
    const load = (name: string): ((input: string) => string[]) => {
      const source = swSource.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n}`))?.[0];
      expect(source, `دالة ${name} موجودة في sw.js`).toBeTruthy();
      // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
      return new Function(`return (${source})`)() as (input: string) => string[];
    };

    const extractAssetUrls = load("extractAssetUrls");
    const extractFontUrls = load("extractFontUrls");

    const html = `<!doctype html><script src="/_next/static/chunks/main-app-abc.js"></script>
      <script src="https://cdn.example.com/other.js"></script>
      <link rel="stylesheet" href="/_next/static/css/styles-abc.css"/>
      <script>self.__next_f(["/_next/static/chunks/app/(app)/adhkar/page-def.js"])</script>`;
    const urls = extractAssetUrls(html);
    expect(urls).toContain("/_next/static/chunks/main-app-abc.js");
    expect(urls).toContain("/_next/static/css/styles-abc.css");
    expect(urls).toContain("/_next/static/chunks/app/(app)/adhkar/page-def.js");
    expect(urls.every((url) => url.startsWith("/_next/static/"))).toBe(true);

    const css = `@font-face{src:url(/_next/static/media/cairo-abc.woff2) format("woff2");}
      @font-face{src:url(/_next/static/media/cairo-def.woff2) format("woff2");}`;
    const fonts = extractFontUrls(css);
    expect(fonts).toContain("/_next/static/media/cairo-abc.woff2");
    expect(fonts).toHaveLength(2);
  });

  it("مش بيكاشش غير GET من نفس الدومين", () => {
    expect(swSource).toContain('request.method !== "GET"');
    expect(swSource).toContain("url.origin !== self.location.origin");
  });

  it("طلبات التنقل ليها fallback للرئيسية لما مفيش كاش", () => {
    expect(swSource).toContain('request.mode === "navigate"');
    expect(swSource).toContain('shell.match("/")');
  });
});

describe("مسارات PWA", () => {
  it("الصفحات الأساسية كلها متسجلة كـ precache", () => {
    for (const route of ["/", "/today", "/settings", "/adhkar", "/meals"]) {
      expect(isPrecacheRoute(route)).toBe(true);
    }
    expect(isPrecacheRoute("/not-a-page")).toBe(false);
  });
});
