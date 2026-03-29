/** 6 色，与打卡习惯一一对应（colorIndex 0..5） */
export const HABIT_COLOR_CLASSES = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-orange-500",
] as const;

export const HABIT_RING_CLASSES = [
  "ring-sky-400",
  "ring-emerald-400",
  "ring-amber-400",
  "ring-rose-400",
  "ring-violet-400",
  "ring-orange-400",
] as const;

export function habitColorClass(index: number): string {
  return HABIT_COLOR_CLASSES[Math.min(5, Math.max(0, index))] ?? HABIT_COLOR_CLASSES[0];
}

export function habitRingClass(index: number): string {
  return HABIT_RING_CLASSES[Math.min(5, Math.max(0, index))] ?? HABIT_RING_CLASSES[0];
}
