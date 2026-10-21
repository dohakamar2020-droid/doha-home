import type { Room } from "@/types/domain";
import { createId } from "@/lib/id";

/** الغرف الافتراضية — مصدر واحد تستخدمه القوالب وخطة البيت */
export const DEFAULT_ROOMS: ReadonlyArray<{ key: string; name: string; emoji: string }> = [
  { key: "kitchen", name: "المطبخ", emoji: "🍳" },
  { key: "bathroom", name: "الحمام", emoji: "🚿" },
  { key: "bedroom", name: "أوضة النوم", emoji: "🛏️" },
  { key: "living", name: "الصالة", emoji: "🛋️" },
  { key: "laundry", name: "الغسيل", emoji: "🧺" },
  { key: "general", name: "البيت عمومًا", emoji: "🏠" },
];

export function createDefaultRooms(now: string = new Date().toISOString()): Room[] {
  return DEFAULT_ROOMS.map((room, index) => ({
    id: createId(),
    name: room.name,
    emoji: room.emoji,
    order: index,
    createdAt: now,
  }));
}
