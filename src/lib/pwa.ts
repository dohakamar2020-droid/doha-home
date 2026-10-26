/**
 * ثوابت PWA المشتركة بين التطبيق والاختبارات.
 * قائمة الصفحات هنا لازم تطابق PRECACHE_ROUTES في public/sw.js
 * — وفيه اختبار وحدة بيضمن التطابق ده.
 */

export const PWA_PRECACHE_ROUTES = [
  "/",
  "/welcome",
  "/today",
  "/week",
  "/cleaning",
  "/habits",
  "/meals",
  "/adhkar",
  "/settings",
] as const;

export const PWA_CACHE_VERSION_PREFIX = "bayti-monazam-v";

/** هل المسار من صفحات التطبيق اللي المفروض تتخزن مسبقًا؟ */
export function isPrecacheRoute(pathname: string): boolean {
  return (PWA_PRECACHE_ROUTES as readonly string[]).includes(pathname);
}
