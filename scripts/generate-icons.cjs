/**
 * توليد أيقونات PNG للتطبيق (PWA) من الشعار SVG باستخدام sharp الموجودة في التبعيات.
 * تشغيل: node scripts/generate-icons.cjs
 */
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SVG = fs.readFileSync(path.join(ROOT, "public", "icon.svg"));

const OUT_DIR = path.join(ROOT, "public", "icons");
fs.mkdirSync(OUT_DIR, { recursive: true });

/** أيقونة عادية: الشعار بحواف دائرية على خلفية كريمي */
async function renderAny(size, file) {
  await sharp(SVG, { density: 1200 })
    .resize(size, size)
    .png()
    .toFile(path.join(OUT_DIR, file));
  console.log("✓", file, size);
}

/** أيقونة maskable: خلفية ممتدة بالكامل مع هامش أمان 20% حوالين الشعار */
async function renderMaskable(size, file) {
  const iconSize = Math.round(size * 0.72);
  const icon = await sharp(SVG, { density: 1200 })
    .resize(iconSize, iconSize)
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0x71, g: 0x9b, b: 0x83, alpha: 1 },
    },
  })
    .composite([{ input: icon, gravity: "centre" }])
    .png()
    .toFile(path.join(OUT_DIR, file));
  console.log("✓", file, size, "(maskable)");
}

(async () => {
  await renderAny(192, "icon-192.png");
  await renderAny(512, "icon-512.png");
  await renderMaskable(512, "icon-maskable-512.png");
  // أيقونة iOS (apple-touch-icon) بخلفية ممتلئة
  await renderMaskable(180, "apple-touch-icon.png");
})();
