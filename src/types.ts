export type Energy = "low" | "medium" | "high";

export interface SubStep {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  dueDate?: string;
  energy: Energy;
  subSteps: SubStep[];
  /** Whole-task done (or derived from substeps in UI) */
  done: boolean;
  /** In 收集箱 until claimed to a day */
  inbox: boolean;
  createdAt: string;
}

export interface DailyPlan {
  date: string;
  taskIds: string[];
}

/** @deprecated 仅用于从旧版备份迁移；新数据用 checkInHabits + dailyCheckIns */
export type CheckInMap = Record<string, string>;

/** 打卡习惯（最多 6 个），与「任务」无关 */
export interface CheckInHabit {
  id: string;
  title: string;
  /** 0..5 对应固定调色板 */
  colorIndex: number;
  /** 希望坚持的天数（目标），如 21 */
  targetDays: number;
  createdAt: string;
}

/** dateKey -> 当日已勾选的习惯 id 列表（去重，最多 6 个） */
export type DailyHabitCheckInMap = Record<string, string[]>;
/** dateKey -> 当日总结文本 */
export type DailySummaryMap = Record<string, string>;

export interface AppExport {
  version: 1 | 2;
  exportedAt: string;
  tasks: Task[];
  dailyPlans: Record<string, DailyPlan>;
  lastOpenedDate: string;
  suggestedRolloverIds: string[];
  workDurationSec: number;
  breakDurationSec: number;
  energyFilter?: Energy | "all";
  /** v1 旧字段 */
  checkIns?: CheckInMap;
  /** v2 */
  checkInHabits?: Record<string, CheckInHabit>;
  dailyCheckIns?: DailyHabitCheckInMap;
  dailySummaries?: DailySummaryMap;
}
