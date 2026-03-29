import { useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";

const navCls = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-lg px-2 py-2 text-center text-xs font-medium transition-colors sm:px-3 sm:text-sm",
    isActive
      ? "bg-sky-500/20 text-sky-200"
      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
  ].join(" ");

export function Layout() {
  const fileRef = useRef<HTMLInputElement>(null);
  const exportJson = useAppStore((s) => s.exportJson);
  const importJson = useAppStore((s) => s.importJson);
  const navigate = useNavigate();

  function downloadBackup() {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-focus-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onPickImport() {
    fileRef.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const r = importJson(text);
      if (r.ok) navigate("/today");
      else alert(r.error);
    };
    reader.readAsText(f);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-28 pt-6">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            每日专注
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            小步开始，不苛责自己
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={downloadBackup}
            className="rounded-lg border border-slate-600 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          >
            导出
          </button>
          <button
            type="button"
            onClick={onPickImport}
            className="rounded-lg border border-slate-600 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          >
            导入
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onFile}
          />
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-1 py-2 sm:px-2">
          <NavLink to="/inbox" className={navCls}>
            收集箱
          </NavLink>
          <NavLink to="/today" className={navCls}>
            今日
          </NavLink>
          <NavLink to="/focus" className={navCls}>
            专注
          </NavLink>
          <NavLink to="/checkin" className={navCls}>
            打卡
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
