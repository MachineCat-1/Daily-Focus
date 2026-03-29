import { Link } from "react-router-dom";
import { EnergyBadge } from "@/components/EnergyBadge";
import { firstOpenSubStepTitle, isTaskEffectivelyDone } from "@/lib/task";
import { todayKey } from "@/lib/date";
import { useAppStore } from "@/store/useAppStore";
export function TodayPage() {
  const date = todayKey();
  const tasks = useAppStore((s) => s.tasks);
  const dailyPlans = useAppStore((s) => s.dailyPlans);
  const energyFilter = useAppStore((s) => s.energyFilter);
  const setEnergyFilter = useAppStore((s) => s.setEnergyFilter);
  const claimToToday = useAppStore((s) => s.claimToToday);
  const removeFromToday = useAppStore((s) => s.removeFromToday);
  const suggestedRolloverIds = useAppStore((s) => s.suggestedRolloverIds);
  const dismissRolloverSuggestion = useAppStore((s) => s.dismissRolloverSuggestion);
  const dailyCheckIns = useAppStore((s) => s.dailyCheckIns);

  const plan = dailyPlans[date] ?? { date, taskIds: [] };
  const todayChecked = (dailyCheckIns[date]?.length ?? 0) > 0;
  const todayTasks = plan.taskIds
    .map((id) => tasks[id])
    .filter(Boolean)
    .filter((t) => energyFilter === "all" || t.energy === energyFilter);

  return (
    <div className="space-y-6">
      {!todayChecked && (
        <Link
          to="/checkin"
          className="block rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-300 hover:border-sky-800 hover:bg-slate-900"
        >
          <span className="text-sky-400">今日还没打卡</span>
          <span className="text-slate-500"> · 点这里记一笔，给坚持留个脚印</span>
        </Link>
      )}
      {suggestedRolloverIds.length > 0 && (
        <section className="rounded-xl border border-amber-900/50 bg-amber-950/30 p-4">
          <h2 className="text-sm font-medium text-amber-100">昨日未完成 · 待认领</h2>
          <p className="mt-1 text-xs text-amber-200/70">
            它们还在，不丢人。选一件放进今天，或先忽略。
          </p>
          <ul className="mt-3 space-y-2">
            {suggestedRolloverIds.map((id) => {
              const t = tasks[id];
              if (!t) return null;
              return (
                <li
                  key={id}
                  className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-900/60 px-3 py-2"
                >
                  <span className="flex-1 text-sm text-slate-200">{t.title}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const r = claimToToday(id);
                      if (!r.ok) alert(r.reason);
                    }}
                    className="rounded-md bg-amber-600/80 px-2 py-1 text-xs text-white hover:bg-amber-500"
                  >
                    放进今天
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissRolloverSuggestion(id)}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    忽略
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-slate-300">今日 · 最多 3 件</h2>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ["all", "全部"],
                ["low", "低能量"],
                ["medium", "中"],
                ["high", "高能量"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setEnergyFilter(v)}
                className={`rounded-md px-2 py-1 text-xs ${
                  energyFilter === v
                    ? "bg-slate-700 text-white"
                    : "text-slate-500 hover:bg-slate-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {plan.taskIds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-10 text-center">
            <p className="text-sm text-slate-400">今天还没有认领任务。</p>
            <p className="mt-2 text-xs text-slate-600">
              去「收集箱」选 1～3 件，或处理上方的昨日条目。
            </p>
            <Link
              to="/inbox"
              className="mt-4 inline-block text-sm text-sky-400 hover:text-sky-300"
            >
              打开收集箱
            </Link>
          </div>
        ) : todayTasks.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            当前能量筛选下没有任务，试试「全部」。
          </p>
        ) : (
          <ul className="space-y-3">
            {todayTasks.map((t) => {
              const done = isTaskEffectivelyDone(t);
              const next = firstOpenSubStepTitle(t);
              return (
                <li
                  key={t.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/task/${t.id}`} className="min-w-0 flex-1">
                      <p className="font-medium text-slate-100">{t.title}</p>
                      <p className="mt-2 text-xs text-slate-500">当前一步</p>
                      <p className="text-sm text-sky-200/90">{next}</p>
                      <div className="mt-2">
                        <EnergyBadge energy={t.energy} />
                        {done && (
                          <span className="ml-2 text-xs text-emerald-400">已完成</span>
                        )}
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeFromToday(date, t.id)}
                      className="shrink-0 text-xs text-slate-500 hover:text-slate-300"
                    >
                      移出今日
                    </button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link
                      to={`/focus?task=${t.id}`}
                      className="rounded-lg bg-sky-600 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-sky-500"
                    >
                      去专注
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-slate-600">
        今日已选 {plan.taskIds.length} / 3
      </p>
    </div>
  );
}
