import type { AppData } from "@/types/domain";
import { BACKUP_APP_ID, BACKUP_VERSION, backupSchema, formatZodError } from "@/lib/schemas";
import { migrateRawData } from "@/lib/storage";
import type { BackupFile } from "@/lib/schemas";

export type { BackupFile } from "@/lib/schemas";

export type ParseBackupResult =
  | { ok: true; backup: BackupFile }
  | { ok: false; message: string };

export function buildBackup(data: AppData, exportedAt: string = new Date().toISOString()): BackupFile {
  return {
    app: BACKUP_APP_ID,
    backupVersion: BACKUP_VERSION,
    exportedAt,
    data,
  };
}

export function serializeBackup(data: AppData): string {
  return JSON.stringify(buildBackup(data), null, 2);
}

export function parseBackup(text: string): ParseBackupResult {
  if (!text.trim()) return { ok: false, message: "الملف فاضي" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, message: "الملف مش JSON صالح. اتأكدي إنك اخترتي ملف النسخة الاحتياطية الصح." };
  }
  const candidate =
    parsed && typeof parsed === "object" && "data" in parsed
      ? parsed
      : { app: BACKUP_APP_ID, backupVersion: 1, exportedAt: new Date().toISOString(), data: parsed };

  // النسخ القديمة (data.version = 1) بتمر على نفس ترحيل التخزين قبل التحقق
  const rawData = (candidate as { data?: unknown }).data;
  if (rawData && typeof rawData === "object") {
    const migrated = migrateRawData(rawData);
    if (!migrated.ok) return { ok: false, message: migrated.message };
    (candidate as { data: unknown }).data = migrated.data;
  }

  const result = backupSchema.safeParse(candidate);
  if (!result.success) {
    return { ok: false, message: `النسخة الاحتياطية غير صالحة — ${formatZodError(result.error)}` };
  }
  return { ok: true, backup: result.data };
}

export interface BackupSummary {
  displayName: string;
  exportedAt: string;
  tasks: number;
  taskCompletions: number;
  rooms: number;
  cleaningTasks: number;
  cleaningCompletions: number;
  habits: number;
  habitCompletions: number;
}

export function summarizeBackup(backup: BackupFile): BackupSummary {
  return {
    displayName: backup.data.settings.displayName,
    exportedAt: backup.exportedAt,
    tasks: backup.data.tasks.length,
    taskCompletions: backup.data.taskCompletions.length,
    rooms: backup.data.rooms.length,
    cleaningTasks: backup.data.cleaningTasks.length,
    cleaningCompletions: backup.data.cleaningCompletions.length,
    habits: backup.data.habits.length,
    habitCompletions: backup.data.habitCompletions.length,
  };
}

export function backupFileName(exportedAt: string = new Date().toISOString()): string {
  const date = exportedAt.slice(0, 10);
  return `bayti-monazam-backup-${date}.json`;
}

/** ينزّل ملف JSON في المتصفح (ما يعملش على السيرفر) */
export function downloadJsonFile(content: string, fileName: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
