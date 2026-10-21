/**
 * يقرأ تقرير Playwright JSON ويعرض كل فشل كـ GitHub annotation،
 * عشان تفاصيل الفشل تكون واضحة في واجهة PR من غير الحاجة لسجلات التشغيل.
 */
const fs = require("node:fs");
const path = require("node:path");

const reportPath = process.argv[2] ?? "playwright-report/report.json";
const MAX_LINES = 12;

function walk(suite, out = []) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const results = test.results ?? [];
      const failed = results.filter((result) => result.status === "failed" || result.status === "timedOut");
      if (failed.length === 0) continue;
      const errors = failed
        .flatMap((result) => result.errors ?? [])
        .map((error) => (error.message ?? error.value ?? "").toString().trim())
        .filter(Boolean);
      out.push({
        title: spec.title,
        file: spec.file,
        project: test.projectName,
        message: errors.join("\n\n") || "فشل بدون رسالة",
      });
    }
  }
  for (const child of suite.suites ?? []) walk(child, out);
  return out;
}

function escape(value) {
  return value.replace(/%/g, "%25").replace(/\r/g, "").replace(/\n/g, "%0A");
}

if (!fs.existsSync(reportPath)) {
  console.log(`::warning::مفيش تقرير Playwright في ${reportPath}`);
  process.exit(0);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const failures = walk({ suites: report.suites ?? [] });

// ملخص ثابت في السجل
console.log(`E2E failures: ${failures.length}`);

if (failures.length === 0) process.exit(0);

for (const failure of failures.slice(0, 40)) {
  const body = failure.message.split("\n").slice(0, MAX_LINES).join("\n");
  console.log(
    `::error title=[${failure.project}] ${failure.title} (${path.basename(failure.file)})::${escape(body)}`,
  );
}

process.exit(0);
