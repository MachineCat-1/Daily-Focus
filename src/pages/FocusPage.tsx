import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { todayKey } from "@/lib/date";
import { useAppStore } from "@/store/useAppStore";

type Phase = "idle" | "work" | "break";

function beep() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.08;
    o.start();
    setTimeout(() => {
      o.stop();
      void ctx.close();
    }, 200);
  } catch {
    /* ignore */
  }
}

export function FocusPage() {
  const [searchParams] = useSearchParams();
  const paramTask = searchParams.get("task") ?? "";

  const tasks = useAppStore((s) => s.tasks);
  const dailyPlans = useAppStore((s) => s.dailyPlans);
  const workDurationSec = useAppStore((s) => s.workDurationSec);
  const breakDurationSec = useAppStore((s) => s.breakDurationSec);
  const setDurations = useAppStore((s) => s.setDurations);
  const setFocusTask = useAppStore((s) => s.setFocusTask);
  const addSubStep = useAppStore((s) => s.addSubStep);

  const date = todayKey();
  const plan = dailyPlans[date] ?? { date, taskIds: [] };
  const todayTaskIds = plan.taskIds;

  const [taskId, setTaskId] = useState(paramTask);
  useEffect(() => {
    if (paramTask) setTaskId(paramTask);
  }, [paramTask]);

  const [phase, setPhase] = useState<Phase>("idle");
  const [remaining, setRemaining] = useState(workDurationSec);
  const [leaveHint, setLeaveHint] = useState(false);
  const wasRunningWork = useRef(false);

  const task = taskId ? tasks[taskId] : undefined;

  useEffect(() => {
    setFocusTask(taskId || null);
    return () => setFocusTask(null);
  }, [taskId, setFocusTask]);

  useEffect(() => {
    function onVis() {
      if (document.visibilityState === "hidden" && phase === "work") {
        wasRunningWork.current = true;
      }
      if (
        document.visibilityState === "visible" &&
        wasRunningWork.current &&
        phase === "work"
      ) {
        setLeaveHint(true);
        wasRunningWork.current = false;
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [phase]);

  useEffect(() => {
    if (phase === "idle") return;
    const id = window.setInterval(() => {
      setRemaining((r) => (r <= 1 ? 0 : r - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (remaining !== 0 || phase === "idle") return;

    if (phase === "work") {
      beep();
      const text = window.prompt(
        "这一段结束了。下一段最小动作是？（可留空跳过）",
        "",
      );
      if (text?.trim() && taskId) addSubStep(taskId, text.trim());
      setPhase("break");
      setRemaining(breakDurationSec);
      return;
    }

    if (phase === "break") {
      beep();
      setPhase("idle");
      setRemaining(workDurationSec);
    }
  }, [remaining, phase, breakDurationSec, workDurationSec, taskId, addSubStep]);

  function startWork() {
    if (!taskId) {
      alert("先选一个今日任务");
      return;
    }
    setLeaveHint(false);
    setRemaining(workDurationSec);
    setPhase("work");
  }

  function pauseToIdle() {
    setPhase("idle");
    setRemaining(workDurationSec);
  }

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h2 className="text-sm font-medium text-slate-300">专注</h2>
      <p className="text-xs text-slate-500">
        计时仅作陪伴；离开标签页时会轻轻提醒你回到当下。
      </p>

      <div>
        <label className="text-xs text-slate-500">关联任务（来自今日）</label>
        <select
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-slate-100"
        >
          <option value="">请选择…</option>
          {todayTaskIds.map((id) => {
            const t = tasks[id];
            if (!t) return null;
            return (
              <option key={id} value={id}>
                {t.title}
              </option>
            );
          })}
        </select>
        {task && (
          <Link
            to={`/task/${task.id}`}
            className="mt-2 inline-block text-xs text-sky-400 hover:text-sky-300"
          >
            打开任务详情
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-6 py-10 text-center">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          {phase === "idle" && "就绪"}
          {phase === "work" && "专注中"}
          {phase === "break" && "休息"}
        </p>
        <p className="mt-4 font-mono text-5xl font-light tabular-nums text-white">
          {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {phase === "idle" && (
            <button
              type="button"
              onClick={startWork}
              className="rounded-xl bg-sky-600 px-6 py-3 text-sm font-medium text-white hover:bg-sky-500"
            >
              开始专注
            </button>
          )}
          {(phase === "work" || phase === "break") && (
            <button
              type="button"
              onClick={pauseToIdle}
              className="rounded-xl border border-slate-600 px-6 py-3 text-sm text-slate-300 hover:bg-slate-800"
            >
              结束计时
            </button>
          )}
        </div>
      </div>

      {leaveHint && phase === "work" && (
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          刚才页面在后台了一会儿。若可以，慢慢把注意力带回到眼前这件事上。
          <button
            type="button"
            className="ml-2 text-xs text-amber-300 underline"
            onClick={() => setLeaveHint(false)}
          >
            知道了
          </button>
        </div>
      )}

      <section className="rounded-xl border border-slate-800 p-4">
        <h3 className="text-xs font-medium text-slate-400">时长（分钟）</h3>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2 text-slate-300">
            专注
            <input
              type="number"
              min={1}
              step={1}
              value={Math.round(workDurationSec / 60)}
              disabled={phase !== "idle"}
              onChange={(e) => {
                const min = Math.max(1, Math.floor(Number(e.target.value) || 25));
                setDurations(min * 60, breakDurationSec);
              }}
              className="w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
            />
          </label>
          <label className="flex items-center gap-2 text-slate-300">
            休息
            <input
              type="number"
              min={1}
              step={1}
              value={Math.round(breakDurationSec / 60)}
              disabled={phase !== "idle"}
              onChange={(e) => {
                const min = Math.max(1, Math.floor(Number(e.target.value) || 5));
                setDurations(workDurationSec, min * 60);
              }}
              className="w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          预设：25 / 5 分钟。仅在空闲时可改。
        </p>
      </section>
    </div>
  );
}
