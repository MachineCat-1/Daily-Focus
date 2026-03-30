import { createId } from "@/lib/id";
import { addDaysKey, isBeforeKey, todayKey } from "@/lib/date";
import { isTaskEffectivelyDone } from "@/lib/task";
import type {
  AppExport,
  CheckInHabit,
  CheckInMap,
  DailyHabitCheckInMap,
  DailySummaryMap,
  DailyPlan,
  Energy,
  Task,
} from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "daily-focus-v1";
const MAX_CHECKIN_HABITS = 6;

interface AppState {
  tasks: Record<string, Task>;
  dailyPlans: Record<string, DailyPlan>;
  lastOpenedDate: string;
  suggestedRolloverIds: string[];
  workDurationSec: number;
  breakDurationSec: number;
  focusTaskId: string | null;
  energyFilter: Energy | "all";
  /** 仅用于从旧版 localStorage 合并迁移，迁移后清空 */
  checkIns: CheckInMap;
  checkInHabits: Record<string, CheckInHabit>;
  dailyCheckIns: DailyHabitCheckInMap;
  dailySummaries: DailySummaryMap;

  addInboxTask: (title: string, energy?: Energy) => string;
  updateTask: (id: string, patch: Partial<Omit<Task, "id">>) => void;
  removeTask: (id: string) => void;
  addSubStep: (taskId: string, title: string) => void;
  toggleSubStep: (taskId: string, subId: string) => void;
  removeSubStep: (taskId: string, subId: string) => void;
  toggleTaskDone: (taskId: string) => void;

  claimToToday: (taskId: string) => { ok: true } | { ok: false; reason: string };
  removeFromToday: (date: string, taskId: string) => void;

  setFocusTask: (taskId: string | null) => void;
  setEnergyFilter: (f: Energy | "all") => void;
  setDurations: (work: number, brk: number) => void;

  dismissRolloverSuggestion: (taskId: string) => void;
  runDayRollover: () => void;

  migrateLegacyCheckInIfNeeded: () => void;
  addCheckInHabit: (
    title: string,
    colorIndex: number,
    targetDays: number,
  ) => { ok: true; id: string } | { ok: false; reason: string };
  updateCheckInHabit: (
    id: string,
    patch: Partial<Pick<CheckInHabit, "title" | "colorIndex" | "targetDays">>,
  ) => void;
  removeCheckInHabit: (id: string) => void;
  toggleHabitToday: (habitId: string) => void;
  clearTodayCheckIns: () => void;
  setDailySummary: (date: string, text: string) => void;

  exportJson: () => string;
  importJson: (raw: string) => { ok: true } | { ok: false; error: string };

  seedLowEnergyTemplates: () => void;
}

function planFor(state: AppState, date: string): DailyPlan {
  return state.dailyPlans[date] ?? { date, taskIds: [] };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: {},
      dailyPlans: {},
      lastOpenedDate: todayKey(),
      suggestedRolloverIds: [],
      workDurationSec: 25 * 60,
      breakDurationSec: 5 * 60,
      focusTaskId: null,
      energyFilter: "all",
      checkIns: {},
      checkInHabits: {},
      dailyCheckIns: {},
      dailySummaries: {},

      addInboxTask: (title, energy = "medium") => {
        const id = createId();
        const t: Task = {
          id,
          title: title.trim() || "未命名",
          energy,
          subSteps: [],
          done: false,
          inbox: true,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ tasks: { ...s.tasks, [id]: t } }));
        return id;
      },

      updateTask: (id, patch) => {
        set((s) => {
          const cur = s.tasks[id];
          if (!cur) return s;
          return { tasks: { ...s.tasks, [id]: { ...cur, ...patch } } };
        });
      },

      removeTask: (id) => {
        set((s) => {
          const { [id]: _, ...rest } = s.tasks;
          const dailyPlans: Record<string, DailyPlan> = {};
          for (const [d, p] of Object.entries(s.dailyPlans)) {
            dailyPlans[d] = { ...p, taskIds: p.taskIds.filter((x) => x !== id) };
          }
          return {
            tasks: rest,
            dailyPlans,
            focusTaskId: s.focusTaskId === id ? null : s.focusTaskId,
            suggestedRolloverIds: s.suggestedRolloverIds.filter((x) => x !== id),
          };
        });
      },

      addSubStep: (taskId, title) => {
        const tid = title.trim();
        if (!tid) return;
        set((s) => {
          const cur = s.tasks[taskId];
          if (!cur) return s;
          const sub = { id: createId(), title: tid, done: false };
          return {
            tasks: {
              ...s.tasks,
              [taskId]: { ...cur, subSteps: [...cur.subSteps, sub] },
            },
          };
        });
      },

      toggleSubStep: (taskId, subId) => {
        set((s) => {
          const cur = s.tasks[taskId];
          if (!cur) return s;
          const subSteps = cur.subSteps.map((x) =>
            x.id === subId ? { ...x, done: !x.done } : x,
          );
          const allDone = subSteps.length > 0 && subSteps.every((x) => x.done);
          return {
            tasks: {
              ...s.tasks,
              [taskId]: { ...cur, subSteps, done: allDone || cur.done },
            },
          };
        });
      },

      removeSubStep: (taskId, subId) => {
        set((s) => {
          const cur = s.tasks[taskId];
          if (!cur) return s;
          return {
            tasks: {
              ...s.tasks,
              [taskId]: {
                ...cur,
                subSteps: cur.subSteps.filter((x) => x.id !== subId),
              },
            },
          };
        });
      },

      toggleTaskDone: (taskId) => {
        set((s) => {
          const cur = s.tasks[taskId];
          if (!cur) return s;
          const done = !cur.done;
          const subSteps = cur.subSteps.map((x) => ({ ...x, done }));
          return { tasks: { ...s.tasks, [taskId]: { ...cur, done, subSteps } } };
        });
      },

      claimToToday: (taskId) => {
        const s = get();
        const t = s.tasks[taskId];
        if (!t) return { ok: false, reason: "任务不存在" };
        const date = todayKey();
        const plan = planFor(s, date);
        if (plan.taskIds.includes(taskId)) return { ok: true };
        if (plan.taskIds.length >= 3) {
          return { ok: false, reason: "今日已选满 3 件，先完成或移出几项再认领" };
        }
        const taskIds = [...plan.taskIds, taskId];
        set({
          dailyPlans: { ...s.dailyPlans, [date]: { date, taskIds } },
          tasks: { ...s.tasks, [taskId]: { ...t, inbox: false } },
          suggestedRolloverIds: s.suggestedRolloverIds.filter((x) => x !== taskId),
        });
        return { ok: true };
      },

      removeFromToday: (date, taskId) => {
        set((s) => {
          const plan = s.dailyPlans[date];
          if (!plan) return s;
          const taskIds = plan.taskIds.filter((x) => x !== taskId);
          const t = s.tasks[taskId];
          const tasks = t
            ? { ...s.tasks, [taskId]: { ...t, inbox: true } }
            : s.tasks;
          return {
            dailyPlans: { ...s.dailyPlans, [date]: { ...plan, taskIds } },
            tasks,
          };
        });
      },

      setFocusTask: (taskId) => set({ focusTaskId: taskId }),

      setEnergyFilter: (energyFilter) => set({ energyFilter }),

      setDurations: (work, brk) =>
        set({
          workDurationSec: Math.max(60, work),
          breakDurationSec: Math.max(60, brk),
        }),

      dismissRolloverSuggestion: (taskId) =>
        set((s) => ({
          suggestedRolloverIds: s.suggestedRolloverIds.filter((x) => x !== taskId),
        })),

      runDayRollover: () => {
        const s = get();
        const today = todayKey();
        if (!isBeforeKey(s.lastOpenedDate, today)) return;

        const yesterday = addDaysKey(today, -1);
        const yPlan = s.dailyPlans[yesterday];
        const rolled: string[] = [];
        if (yPlan) {
          for (const id of yPlan.taskIds) {
            const task = s.tasks[id];
            if (task && !isTaskEffectivelyDone(task)) rolled.push(id);
          }
        }

        set({
          lastOpenedDate: today,
          suggestedRolloverIds: [
            ...new Set([...s.suggestedRolloverIds, ...rolled]),
          ],
        });
      },

      migrateLegacyCheckInIfNeeded: () => {
        const s = get();
        if (Object.keys(s.checkInHabits).length > 0) return;
        if (Object.keys(s.checkIns).length === 0) return;
        const id = createId();
        const habit: CheckInHabit = {
          id,
          title: "每日打卡",
          colorIndex: 0,
          targetDays: 21,
          createdAt: new Date().toISOString(),
        };
        const daily: DailyHabitCheckInMap = {};
        for (const d of Object.keys(s.checkIns)) {
          daily[d] = [id];
        }
        set({
          checkInHabits: { [id]: habit },
          dailyCheckIns: daily,
          checkIns: {},
        });
      },

      addCheckInHabit: (title, colorIndex, targetDays) => {
        const s = get();
        if (Object.keys(s.checkInHabits).length >= MAX_CHECKIN_HABITS) {
          return { ok: false, reason: `最多 ${MAX_CHECKIN_HABITS} 个打卡习惯` };
        }
        const t = title.trim() || "未命名习惯";
        const td = Math.max(1, Math.floor(targetDays) || 21);
        const ci = Math.min(5, Math.max(0, Math.floor(colorIndex)));
        const id = createId();
        const habit: CheckInHabit = {
          id,
          title: t,
          colorIndex: ci,
          targetDays: td,
          createdAt: new Date().toISOString(),
        };
        set({ checkInHabits: { ...s.checkInHabits, [id]: habit } });
        return { ok: true, id };
      },

      updateCheckInHabit: (id, patch) => {
        set((s) => {
          const cur = s.checkInHabits[id];
          if (!cur) return s;
          const next: CheckInHabit = {
            ...cur,
            ...patch,
            title: patch.title !== undefined ? patch.title.trim() || cur.title : cur.title,
            colorIndex:
              patch.colorIndex !== undefined
                ? Math.min(5, Math.max(0, Math.floor(patch.colorIndex)))
                : cur.colorIndex,
            targetDays:
              patch.targetDays !== undefined
                ? Math.max(1, Math.floor(patch.targetDays))
                : cur.targetDays,
          };
          return { checkInHabits: { ...s.checkInHabits, [id]: next } };
        });
      },

      removeCheckInHabit: (id) => {
        set((s) => {
          const { [id]: _, ...restH } = s.checkInHabits;
          const dailyCheckIns: DailyHabitCheckInMap = {};
          for (const [d, arr] of Object.entries(s.dailyCheckIns)) {
            const next = arr.filter((x) => x !== id);
            if (next.length) dailyCheckIns[d] = next;
          }
          return { checkInHabits: restH, dailyCheckIns };
        });
      },

      toggleHabitToday: (habitId) => {
        const day = todayKey();
        set((s) => {
          if (!s.checkInHabits[habitId]) return s;
          const cur = s.dailyCheckIns[day] ?? [];
          const has = cur.includes(habitId);
          let next: string[];
          if (has) {
            next = cur.filter((x) => x !== habitId);
          } else {
            if (cur.length >= MAX_CHECKIN_HABITS) return s;
            next = [...cur, habitId];
          }
          const dailyCheckIns = { ...s.dailyCheckIns };
          if (next.length === 0) {
            const { [day]: __, ...rest } = dailyCheckIns;
            return { dailyCheckIns: rest };
          }
          dailyCheckIns[day] = next;
          return { dailyCheckIns };
        });
      },

      clearTodayCheckIns: () => {
        const day = todayKey();
        set((s) => {
          if (!s.dailyCheckIns[day]) return s;
          const { [day]: _, ...rest } = s.dailyCheckIns;
          return { dailyCheckIns: rest };
        });
      },

      setDailySummary: (date, text) => {
        const key = date.trim();
        if (!key) return;
        const value = text.trim();
        set((s) => {
          if (!value) {
            if (!s.dailySummaries[key]) return s;
            const { [key]: _, ...rest } = s.dailySummaries;
            return { dailySummaries: rest };
          }
          return { dailySummaries: { ...s.dailySummaries, [key]: value } };
        });
      },

      exportJson: () => {
        const s = get();
        const payload: AppExport = {
          version: 2,
          exportedAt: new Date().toISOString(),
          tasks: Object.values(s.tasks),
          dailyPlans: s.dailyPlans,
          lastOpenedDate: s.lastOpenedDate,
          suggestedRolloverIds: s.suggestedRolloverIds,
          workDurationSec: s.workDurationSec,
          breakDurationSec: s.breakDurationSec,
          energyFilter: s.energyFilter,
          checkInHabits: s.checkInHabits,
          dailyCheckIns: s.dailyCheckIns,
          dailySummaries: s.dailySummaries,
        };
        return JSON.stringify(payload, null, 2);
      },

      importJson: (raw) => {
        try {
          const data = JSON.parse(raw) as AppExport;
          if (!Array.isArray(data.tasks)) {
            return { ok: false, error: "文件格式不对" };
          }
          const ver = data.version ?? 1;
          if (ver !== 1 && ver !== 2) {
            return { ok: false, error: "不支持的备份版本" };
          }
          const tasks: Record<string, Task> = {};
          for (const t of data.tasks) {
            if (t?.id && t.title) tasks[t.id] = t as Task;
          }

          let checkInHabits: Record<string, CheckInHabit> =
            data.checkInHabits ?? {};
          let dailyCheckIns: DailyHabitCheckInMap = data.dailyCheckIns ?? {};
          let dailySummaries: DailySummaryMap = data.dailySummaries ?? {};
          let checkIns: CheckInMap = {};

          if (
            Object.keys(checkInHabits).length === 0 &&
            data.checkIns &&
            Object.keys(data.checkIns).length > 0
          ) {
            const id = createId();
            checkInHabits = {
              [id]: {
                id,
                title: "每日打卡",
                colorIndex: 0,
                targetDays: 21,
                createdAt: new Date().toISOString(),
              },
            };
            dailyCheckIns = {};
            for (const d of Object.keys(data.checkIns)) {
              dailyCheckIns[d] = [id];
            }
          }

          set({
            tasks,
            dailyPlans: data.dailyPlans ?? {},
            lastOpenedDate: data.lastOpenedDate ?? todayKey(),
            suggestedRolloverIds: data.suggestedRolloverIds ?? [],
            workDurationSec: data.workDurationSec ?? 25 * 60,
            breakDurationSec: data.breakDurationSec ?? 5 * 60,
            energyFilter: data.energyFilter ?? "all",
            checkIns,
            checkInHabits,
            dailyCheckIns,
            dailySummaries,
            focusTaskId: null,
          });
          return { ok: true };
        } catch {
          return { ok: false, error: "无法解析 JSON" };
        }
      },

      seedLowEnergyTemplates: () => {
        const templates: { title: string; subs: string[] }[] = [
          { title: "喝杯水、伸个懒腰", subs: ["站起来", "喝一口水", "坐回座位"] },
          { title: "桌面整理 2 分钟", subs: ["只清理手边一臂距离"] },
          { title: "给今天写一句开场白", subs: ["一句话写下此刻最想完成的一件小事"] },
        ];
        set((s) => {
          const next = { ...s.tasks };
          for (const tpl of templates) {
            const id = createId();
            next[id] = {
              id,
              title: tpl.title,
              energy: "low",
              subSteps: tpl.subs.map((st) => ({
                id: createId(),
                title: st,
                done: false,
              })),
              done: false,
              inbox: true,
              createdAt: new Date().toISOString(),
            };
          }
          return { tasks: next };
        });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        tasks: s.tasks,
        dailyPlans: s.dailyPlans,
        lastOpenedDate: s.lastOpenedDate,
        suggestedRolloverIds: s.suggestedRolloverIds,
        workDurationSec: s.workDurationSec,
        breakDurationSec: s.breakDurationSec,
        energyFilter: s.energyFilter,
        checkInHabits: s.checkInHabits,
        dailyCheckIns: s.dailyCheckIns,
        dailySummaries: s.dailySummaries,
      }),
    },
  ),
);
