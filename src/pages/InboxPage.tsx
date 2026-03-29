import { useState } from "react";
import { Link } from "react-router-dom";
import { EnergyBadge } from "@/components/EnergyBadge";
import { useAppStore } from "@/store/useAppStore";
import type { Energy } from "@/types";

export function InboxPage() {
  const [title, setTitle] = useState("");
  const [energy, setEnergy] = useState<Energy>("medium");
  const tasks = useAppStore((s) => s.tasks);
  const addInboxTask = useAppStore((s) => s.addInboxTask);
  const claimToToday = useAppStore((s) => s.claimToToday);
  const removeTask = useAppStore((s) => s.removeTask);
  const seedLowEnergyTemplates = useAppStore((s) => s.seedLowEnergyTemplates);

  function confirmRemove(taskTitle: string, taskId: string) {
    if (confirm(`确定从收集箱删除「${taskTitle}」？此操作不可恢复。`)) {
      removeTask(taskId);
    }
  }

  const inboxList = Object.values(tasks).filter((t) => t.inbox);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    addInboxTask(t, energy);
    setTitle("");
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-sm font-medium text-slate-300">快速记下</h2>
        <p className="mb-3 text-xs text-slate-500">
          不用想清楚再做，先丢进来。稍后在详情里拆小步。
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="此刻想到的一件事…"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">能量</span>
            {(
              [
                ["low", "低"],
                ["medium", "中"],
                ["high", "高"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setEnergy(v)}
                className={`rounded-lg px-2 py-1 text-xs ${
                  energy === v
                    ? "bg-sky-600 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="submit"
              className="ml-auto rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
            >
              放入收集箱
            </button>
          </div>
        </form>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">收集箱</h2>
          <button
            type="button"
            onClick={() => seedLowEnergyTemplates()}
            className="text-xs text-sky-400 hover:text-sky-300"
          >
            插入低能量示例
          </button>
        </div>
        {inboxList.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 px-4 py-8 text-center text-sm text-slate-500">
            这里是空的也没关系。低能量时可以先点右上角「插入低能量示例」。
          </p>
        ) : (
          <ul className="space-y-2">
            {inboxList.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-3 sm:flex-nowrap sm:gap-3"
              >
                <Link
                  to={`/task/${t.id}`}
                  className="min-w-0 flex-1 basis-full text-left text-sm text-slate-200 hover:text-white sm:basis-auto"
                >
                  <span className="line-clamp-2">{t.title}</span>
                  <span className="mt-1 block">
                    <EnergyBadge energy={t.energy} />
                  </span>
                </Link>
                <div className="flex shrink-0 gap-2 sm:ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const r = claimToToday(t.id);
                      if (!r.ok) alert(r.reason);
                    }}
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-sky-300 hover:bg-slate-700"
                  >
                    认领到今天
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmRemove(t.title, t.id)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-500 hover:border-rose-900/50 hover:text-rose-300"
                  >
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
