/**
 * بيتي منظم — Service Worker
 *
 * الاستراتيجية:
 * - Shell الصفحات الأساسية يتخزّن مسبقًا (precache) لكل مسار static.
 * - طلبات التنقل (navigations): شبكة أولًا، ولو فشلت يرجع الكاش، وآخر حل يرجع الصفحة الرئيسية.
 * - ملفات Next الثابتة (/_next/static — فيها hash): كاش أولًا لأنها بتتغير بالـ hash بس.
 * - باقي ملفات التطبيق (أيقونات، خطوط، manifest): stale-while-revalidate.
 * - مفيش أي caching لطلبات غير GET أو من دومينات تانية.
 */
const VERSION = "bayti-monazam-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const PAGES_CACHE = `${VERSION}-pages`;
const ASSETS_CACHE = `${VERSION}-assets`;

/** الصفحات اللي بتتخزن مسبقًا — لازم تطابق مسارات التطبيق الـ static */
const PRECACHE_ROUTES = [
  "/",
  "/welcome",
  "/today",
  "/week",
  "/cleaning",
  "/habits",
  "/meals",
  "/adhkar",
  "/settings",
];

const PRECACHE_FILES = [
  "/manifest.webmanifest",
  "/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE);
      // addAll ذرّية: لو ملف فشل الكل يفشل — بنستخدم add فردي عشان صفحة واحدة
      // بايظة ما تمنعش باقي الصفحات من الشغل أوفلاين
      await Promise.allSettled(
        [...PRECACHE_ROUTES, ...PRECACHE_FILES].map((route) => shell.add(route)),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

function isAppAsset(url) {
  return (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/icon.svg" ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname.startsWith("/_next/image") ||
    /\.(woff2?|png|svg|jpg|jpeg|webp|ico)$/.test(url.pathname)
  );
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = (await cache.match(request)) ?? (await caches.match(request));
    if (cached) return cached;
    const shell = await caches.open(SHELL_CACHE);
    const fallback = (await shell.match(request)) ?? (await shell.match("/"));
    if (fallback) return fallback;
    throw error;
  }
}

async function cacheFirstAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(ASSETS_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSETS_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached ?? network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstAsset(request));
    return;
  }

  if (isAppAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
