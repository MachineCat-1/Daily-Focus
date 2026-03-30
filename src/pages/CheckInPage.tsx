import { useEffect, useMemo, useState } from "react";
import {
  buildMonthCells,
  computeAnyHabitStreak,
  countDaysWithAnyCheckInMonth,
  milestonesOnDate,
  sortHabitIdsForCell,
  streakForHabitEndingToday,
} from "@/lib/checkIn";
import { habitColorClass, habitRingClass } from "@/lib/habitColors";
import { todayKey } from "@/lib/date";
import { useAppStore } from "@/store/useAppStore";

const WEEK_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

export function CheckInPage() {
  const checkInHabits = useAppStore((s) => s.checkInHabits);
  const dailyCheckIns = useAppStore((s) => s.dailyCheckIns);
  const addCheckInHabit = useAppStore((s) => s.addCheckInHabit);
  const updateCheckInHabit = useAppStore((s) => s.updateCheckInHabit);
  const removeCheckInHabit = useAppStore((s) => s.removeCheckInHabit);
  const toggleHabitToday = useAppStore((s) => s.toggleHabitToday);
  const clearTodayCheckIns = useAppStore((s) => s.clearTodayCheckIns);
  const dailySummaries = useAppStore((s) => s.dailySummaries);
  const setDailySummary = useAppStore((s) => s.setDailySummary);

  const today = todayKey();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const [draftTitle, setDraftTitle] = useState("");
  const [draftColor, setDraftColor] = useState(0);
  const [draftTarget, setDraftTarget] = useState(21);
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const [summaryDraft, setSummaryDraft] = useState("");

  useEffect(() => {
    if (!selectedDate) {
      setSummaryDraft("");
      return;
    }
    setSummaryDraft(dailySummaries[selectedDate] ?? "");
  }, [selectedDate, dailySummaries]);

  const habitsList = useMemo(
    () => Object.values(checkInHabits).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [checkInHabits],
  );

  const streakAny = useMemo(
    () => computeAnyHabitStreak(dailyCheckIns, today),
    [dailyCheckIns, today],
  );

  const monthDayCount = useMemo(
    () => countDaysWithAnyCheckInMonth(dailyCheckIns, cursor.y, cursor.m),
    [dailyCheckIns, cursor.y, cursor.m],
  );

  const cells = useMemo(
    () => buildMonthCells(cursor.y, cursor.m),
    [cursor.y, cursor.m],
  );

  const todayIds = dailyCheckIns[today] ?? [];
  const todayChecked = todayIds.length > 0;
  const hasAnyHistory = Object.keys(dailyCheckIns).length > 0;

  function prevMonth() {
    setCursor((c) => {
      const d = new Date(c.y, c.m - 1, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  function nextMonth() {
    setCursor((c) => {
      const d = new Date(c.y, c.m + 1, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  function goThisMonth() {
    const d = new Date();
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  }

  function submitHabit(e: React.FormEvent) {
    e.preventDefault();
    const r = addCheckInHabit(draftTitle, draftColor, draftTarget);
    if (!r.ok) {
      alert(r.reason);
      return;
    }
    setDraftTitle("");
    setDraftTarget(21);
  }

  const headline = !habitsList.length
    ? "先添加打卡习惯"
    : todayChecked
      ? streakAny > 0
        ? `已连续 ${streakAny} 天有行动`
        : "今日已记录"
      : "今天还没勾选习惯";

  const subline = !habitsList.length
    ? "最多 6 个，每个一种颜色；目标天数可自定（常见 21 天）。"
    : todayChecked
      ? streakAny > 1
        ? "日历格会按颜色叠起来，一天多习惯也能看见。"
        : "记下了就好。"
      : hasAnyHistory
        ? "在下面勾选今天的习惯，或从任意一天再开始。"
        : "勾选下方习惯，格子会慢慢被颜色填满。";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-6">
        <p className="text-2xl font-semibold text-white">{headline}</p>
        <p className="mt-2 text-sm text-slate-400">{subline}</p>
        <p className="mt-3 text-xs text-slate-500">
          {cursor.y} 年 {cursor.m + 1} 月有打卡记录的天数：{monthDayCount}
        </p>
      </section>

      <section className="rounded-xl border border-slate-800 p-4">
        <h3 className="text-sm font-medium text-slate-300">添加习惯（{habitsList.length}/6）</h3>
        <form onSubmit={submitHabit} className="mt-3 space-y-3">
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="例如：早起、阅读 15 分钟…"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">颜色</span>
            {Array.from({ length: 6 }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setDraftColor(i)}
                className={`size-8 rounded-full ${habitColorClass(i)} ${
                  draftColor === i ? `ring-2 ring-offset-2 ring-offset-slate-950 ${habitRingClass(i)}` : ""
                }`}
                aria-label={`颜色 ${i + 1}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs text-slate-500">
              目标坚持天数
              <input
                type="number"
                min={1}
                value={draftTarget}
                onChange={(e) => setDraftTarget(Number(e.target.value) || 21)}
                className="ml-2 w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
              />
            </label>
            <button
              type="submit"
              disabled={habitsList.length >= 6}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-40"
            >
              添加
            </button>
          </div>
        </form>
      </section>

      {habitsList.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-slate-300">今日勾选</h3>
          <p className="text-xs text-slate-500">
            点选表示今天完成了该习惯；同一格子可在月历里叠多种颜色。
          </p>
          <ul className="space-y-2">
            {habitsList.map((h) => {
              const on = todayIds.includes(h.id);
              const streak = streakForHabitEndingToday(h.id, dailyCheckIns, today);
              const pct = Math.min(100, Math.round((streak / h.targetDays) * 100));
              return (
                <li
                  key={h.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`size-3 shrink-0 rounded-full ${habitColorClass(h.colorIndex)}`}
                    />
                    <input
                      value={h.title}
                      onChange={(e) =>
                        updateCheckInHabit(h.id, { title: e.target.value })
                      }
                      className="min-w-0 flex-1 rounded border border-transparent bg-transparent text-sm text-slate-100 focus:border-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => toggleHabitToday(h.id)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                        on
                          ? `${habitColorClass(h.colorIndex)} text-white`
                          : "border border-slate-600 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      {on ? "今日已选" : "今日打卡"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`删除习惯「${h.title}」？历史打卡记录会一并从日历消失。`)) {
                          removeCheckInHabit(h.id);
                        }
                      }}
                      className="text-xs text-slate-600 hover:text-rose-400"
                    >
                      删除
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>
                      当前连续 {streak} / 目标 {h.targetDays} 天
                    </span>
                    <label className="flex items-center gap-1">
                      颜色
                      <select
                        value={h.colorIndex}
                        onChange={(e) =>
                          updateCheckInHabit(h.id, {
                            colorIndex: Number(e.target.value),
                          })
                        }
                        className="rounded border border-slate-700 bg-slate-900 px-1 text-slate-300"
                      >
                        {Array.from({ length: 6 }, (_, i) => (
                          <option key={i} value={i}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-1">
                      目标天数
                      <input
                        type="number"
                        min={1}
                        value={h.targetDays}
                        onChange={(e) =>
                          updateCheckInHabit(h.id, {
                            targetDays: Number(e.target.value) || 1,
                          })
                        }
                        className="w-16 rounded border border-slate-700 bg-slate-900 px-1 text-slate-300"
                      />
                    </label>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full ${habitColorClass(h.colorIndex)} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          {todayChecked && (
            <button
              type="button"
              onClick={() => clearTodayCheckIns()}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              撤销今日全部勾选
            </button>
          )}
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
            aria-label="上一月"
          >
            ←
          </button>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-medium text-slate-200">
              {cursor.y} 年 {cursor.m + 1} 月
            </span>
            {(cursor.y !== new Date().getFullYear() ||
              cursor.m !== new Date().getMonth()) && (
              <button
                type="button"
                onClick={goThisMonth}
                className="text-xs text-sky-400 hover:text-sky-300"
              >
                回到本月
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
            aria-label="下一月"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500">
          {WEEK_LABELS.map((w) => (
            <div key={w} className="py-1 font-medium">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell.inMonth || !cell.dateKey) {
              return (
                <div
                  key={`pad-${i}`}
                  className="aspect-square rounded-lg bg-transparent"
                />
              );
            }
            const key = cell.dateKey;
            const rawIds = dailyCheckIns[key] ?? [];
            const ids = sortHabitIdsForCell(rawIds, checkInHabits);
            const isToday = key === today;
            const ms = milestonesOnDate(key, checkInHabits, dailyCheckIns);
            const show21 = ms.some((m) => m.kind === 21);
            const show7 = ms.some((m) => m.kind === 7);

            const hasSummary = Boolean(dailySummaries[key]);

            return (
              <button
                type="button"
                key={key}
                onClick={() => setSelectedDate(key)}
                className={[
                  "relative flex aspect-square flex-col overflow-hidden rounded-lg text-[10px] tabular-nums transition",
                  ids.length === 0
                    ? "border border-slate-700/80 text-slate-500"
                    : "",
                  isToday
                    ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950"
                    : "",
                  selectedDate === key ? "ring-2 ring-violet-400 ring-offset-2 ring-offset-slate-950" : "",
                  "hover:brightness-110",
                ].join(" ")}
                title={key}
              >
                {ids.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center">
                    {Number(key.slice(8, 10))}
                  </div>
                ) : (
                  ids.map((hid) => (
                    <div
                      key={hid}
                      className={`min-h-0 flex-1 ${habitColorClass(checkInHabits[hid]?.colorIndex ?? 0)}`}
                    />
                  ))
                )}
                <span
                  className={`pointer-events-none absolute left-0.5 top-0.5 text-[9px] font-medium ${
                    ids.length ? "text-white/90 drop-shadow" : ""
                  }`}
                >
                  {Number(key.slice(8, 10))}
                </span>
                {hasSummary && (
                  <span
                    className="pointer-events-none absolute right-0.5 top-0.5 size-1.5 rounded-full bg-violet-300"
                    title="已填写每日总结"
                  />
                )}
                {(show21 || show7) && (
                  <span className="pointer-events-none absolute bottom-0.5 right-0.5 flex gap-0.5">
                    {show21 && (
                      <span
                        className="rounded bg-amber-400/95 px-0.5 text-[8px] font-bold text-slate-900"
                        title="连续第 21 天（习惯养成节点）"
                      >
                        21
                      </span>
                    )}
                    {show7 && (
                      <span
                        className="rounded bg-amber-300/95 px-0.5 text-[8px] font-bold text-slate-900"
                        title="连续第 7 天"
                      >
                        7
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-200">
                {selectedDate} 每日总结
              </p>
              {dailySummaries[selectedDate] && (
                <button
                  type="button"
                  onClick={() => {
                    setSummaryDraft("");
                    setDailySummary(selectedDate, "");
                  }}
                  className="text-xs text-slate-500 hover:text-rose-400"
                >
                  清空
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              记录今天做了什么，给自己留一个可回看的片段。
            </p>
            <textarea
              value={summaryDraft}
              onChange={(e) => setSummaryDraft(e.target.value)}
              placeholder="例如：完成了需求梳理、专注 2 轮、晚上复盘了卡住点。"
              className="mt-3 h-28 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDailySummary(selectedDate, summaryDraft)}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
              >
                保存总结
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <span>图例：</span>
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className={`size-2.5 rounded-sm ${habitColorClass(i)}`} />
              {i + 1}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="rounded bg-amber-400 px-0.5 text-[8px] font-bold text-slate-900">
              7
            </span>
            连续 7 天
          </span>
          <span className="flex items-center gap-1">
            <span className="rounded bg-amber-400 px-0.5 text-[8px] font-bold text-slate-900">
              21
            </span>
            连续 21 天
          </span>
        </div>
      </section>
    </div>
  );
}
