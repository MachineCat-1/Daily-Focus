import { addDaysKey, toDateKey } from "@/lib/date";
import type { CheckInHabit, DailyHabitCheckInMap } from "@/types";

/** 从今天起，连续「至少完成一个习惯」的天数 */
export function computeAnyHabitStreak(
  daily: DailyHabitCheckInMap,
  today: string,
): number {
  let d = today;
  let n = 0;
  while (daily[d]?.length) {
    n++;
    d = addDaysKey(d, -1);
  }
  return n;
}

/** 某一习惯从今天向前的连续打卡天数；今天未完成该习惯则为 0 */
export function streakForHabitEndingToday(
  habitId: string,
  daily: DailyHabitCheckInMap,
  today: string,
): number {
  let d = today;
  let n = 0;
  while (daily[d]?.includes(habitId)) {
    n++;
    d = addDaysKey(d, -1);
  }
  return n;
}

/** 以 endDate 为「连续段的最后一天」，该段长度（仅当 endDate 当天完成了该习惯时计数） */
export function streakForHabitEndingOn(
  habitId: string,
  endDate: string,
  daily: DailyHabitCheckInMap,
): number {
  if (!daily[endDate]?.includes(habitId)) return 0;
  let d = endDate;
  let n = 0;
  while (daily[d]?.includes(habitId)) {
    n++;
    d = addDaysKey(d, -1);
  }
  return n;
}

export type MilestoneKind = 7 | 21;

export function milestonesOnDate(
  dateKey: string,
  habits: Record<string, CheckInHabit>,
  daily: DailyHabitCheckInMap,
): { habitId: string; kind: MilestoneKind }[] {
  const ids = daily[dateKey];
  if (!ids?.length) return [];
  const out: { habitId: string; kind: MilestoneKind }[] = [];
  for (const hid of ids) {
    if (!habits[hid]) continue;
    const len = streakForHabitEndingOn(hid, dateKey, daily);
    if (len === 21) out.push({ habitId: hid, kind: 21 });
    else if (len === 7) out.push({ habitId: hid, kind: 7 });
  }
  return out;
}

export function countDaysWithAnyCheckInMonth(
  daily: DailyHabitCheckInMap,
  year: number,
  monthIndex: number,
): number {
  const dim = new Date(year, monthIndex + 1, 0).getDate();
  let c = 0;
  for (let day = 1; day <= dim; day++) {
    const key = toDateKey(new Date(year, monthIndex, day));
    if (daily[key]?.length) c++;
  }
  return c;
}

export interface MonthCell {
  dateKey: string | null;
  inMonth: boolean;
}

/** 周一开始；前后用空格子补齐整周 */
export function buildMonthCells(year: number, monthIndex: number): MonthCell[] {
  const first = new Date(year, monthIndex, 1);
  const leadDays = (first.getDay() + 6) % 7;
  const dim = new Date(year, monthIndex + 1, 0).getDate();
  const cells: MonthCell[] = [];
  for (let i = 0; i < leadDays; i++) {
    cells.push({ dateKey: null, inMonth: false });
  }
  for (let d = 1; d <= dim; d++) {
    cells.push({
      dateKey: toDateKey(new Date(year, monthIndex, d)),
      inMonth: true,
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ dateKey: null, inMonth: false });
  }
  return cells;
}

/** 当天格子里习惯条顺序：按 colorIndex 再按 id，保证稳定 */
export function sortHabitIdsForCell(
  ids: string[],
  habits: Record<string, CheckInHabit>,
): string[] {
  return [...ids].filter((id) => habits[id]).sort((a, b) => {
    const ca = habits[a].colorIndex;
    const cb = habits[b].colorIndex;
    if (ca !== cb) return ca - cb;
    return a.localeCompare(b);
  });
}
