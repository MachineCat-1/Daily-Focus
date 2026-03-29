import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EnergyBadge } from "@/components/EnergyBadge";
import { useAppStore } from "@/store/useAppStore";

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const task = useAppStore((s) => (id ? s.tasks[id] : undefined));
  const updateTask = useAppStore((s) => s.updateTask);
  const addSubStep = useAppStore((s) => s.addSubStep);
  const toggleSubStep = useAppStore((s) => s.toggleSubStep);
  const removeSubStep = useAppStore((s) => s.removeSubStep);
  const toggleTaskDone = useAppStore((s) => s.toggleTaskDone);
  const removeTask = useAppStore((s) => s.removeTask);
  const claimToToday = useAppStore((s) => s.claimToToday);

  const [subDraft, setSubDraft] = useState("");
  const [nextOnly, setNextOnly] = useState(false);
  const [twoMinHint, setTwoMinHint] = useState(false);

  if (!id || !task) {
    return (
      <div className="text-center text-slate-400">
        <p>找不到这个任务</p>
        <Link to="/inbox" className="mt-4 inline-block text-sky-400">
          回收集箱
        </Link>
      </div>
    );
  }

  const taskId = task.id;
  const openSubs = task.subSteps.filter((s) => !s.done);
  const showSubs = nextOnly ? openSubs.slice(0, 1) : task.subSteps;

  function addSub(e: React.FormEvent) {
    e.preventDefault();
    const t = subDraft.trim();
    if (!t) return;
    addSubStep(taskId, t);
    setSubDraft("");
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-slate-500 hover:text-slate-300"
        >
          ← 返回
        </button>
      </div>

      <div>
        <input
          value={task.title}
          onChange={(e) => updateTask(task.id, { title: e.target.value })}
          className="w-full border-b border-slate-700 bg-transparent text-lg font-semibold text-white focus:border-sky-500 focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <EnergyBadge energy={task.energy} />
          <span className="text-xs text-slate-500">能量</span>
          {(["low", "medium", "high"] as const).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => updateTask(task.id, { energy: e })}
              className={`rounded px-2 py-0.5 text-xs ${
                task.energy === e ? "bg-slate-700 text-white" : "text-slate-500"
              }`}
            >
              {e === "low" ? "低" : e === "medium" ? "中" : "高"}
            </button>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <span>截止（可选）</span>
          <input
            type="date"
            value={task.dueDate ?? ""}
            onChange={(e) =>
              updateTask(task.id, {
                dueDate: e.target.value || undefined,
              })
            }
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
          />
        </label>
      </div>

      {task.inbox && (
        <button
          type="button"
          onClick={() => {
            const r = claimToToday(task.id);
            if (!r.ok) alert(r.reason);
          }}
          className="w-full rounded-xl bg-sky-600 py-3 text-sm font-medium text-white hover:bg-sky-500"
        >
          认领到今天
        </button>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTwoMinHint(true)}
          className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
        >
          先只做 2 分钟
        </button>
        <button
          type="button"
          onClick={() => setNextOnly((v) => !v)}
          className={`rounded-lg border px-3 py-2 text-xs ${
            nextOnly
              ? "border-sky-500 bg-sky-500/10 text-sky-200"
              : "border-slate-600 text-slate-300 hover:bg-slate-800"
          }`}
        >
          {nextOnly ? "显示全部步骤" : "只显示当前一步"}
        </button>
        <Link
          to={`/focus?task=${task.id}`}
          className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-sky-300 hover:bg-slate-700"
        >
          打开专注计时
        </Link>
      </div>

      {twoMinHint && (
        <div className="rounded-xl border border-sky-900/50 bg-sky-950/40 p-4 text-sm text-sky-100">
          <p>好的：接下来只做 2 分钟，做到哪算哪。</p>
          <p className="mt-2 text-xs text-sky-200/70">
            2 分钟后如果还想停，就停；多数时候你会已经动起来了。
          </p>
          <button
            type="button"
            onClick={() => setTwoMinHint(false)}
            className="mt-3 text-xs text-sky-400 underline"
          >
            知道了
          </button>
        </div>
      )}

      <section>
        <h3 className="text-sm font-medium text-slate-300">小步拆解</h3>
        <p className="mt-1 text-xs text-slate-500">
          越具体越好，例如「打开文档写标题」而不是「写报告」。
        </p>
        <form onSubmit={addSub} className="mt-3 flex gap-2">
          <input
            value={subDraft}
            onChange={(e) => setSubDraft(e.target.value)}
            placeholder="下一步具体做什么…"
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white"
          >
            添加
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {showSubs.length === 0 ? (
            <li className="text-sm text-slate-500">
              {task.subSteps.length === 0
                ? "还没有子步骤。没有也行，把标题当成唯一一步。"
                : "太棒了，这一步清单已经清空。"}
            </li>
          ) : (
            showSubs.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={s.done}
                  onChange={() => toggleSubStep(task.id, s.id)}
                  className="size-4 rounded border-slate-600"
                />
                <span
                  className={`flex-1 text-sm ${s.done ? "text-slate-500 line-through" : "text-slate-200"}`}
                >
                  {s.title}
                </span>
                {!nextOnly && (
                  <button
                    type="button"
                    onClick={() => removeSubStep(task.id, s.id)}
                    className="text-xs text-slate-600 hover:text-rose-400"
                  >
                    删
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-6">
        <button
          type="button"
          onClick={() => toggleTaskDone(task.id)}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          {task.done ? "标为未完成" : "整项完成"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm("确定删除这个任务？")) {
              removeTask(task.id);
              navigate("/inbox");
            }
          }}
          className="rounded-lg border border-rose-900/50 px-4 py-2 text-sm text-rose-300 hover:bg-rose-950/40"
        >
          删除任务
        </button>
      </div>
    </div>
  );
}
