import type { Energy } from "@/types";

const map: Record<Energy, { label: string; className: string }> = {
  low: { label: "低能量", className: "bg-emerald-500/15 text-emerald-300" },
  medium: { label: "中", className: "bg-amber-500/15 text-amber-200" },
  high: { label: "高能量", className: "bg-rose-500/15 text-rose-200" },
};

export function EnergyBadge({ energy }: { energy: Energy }) {
  const m = map[energy];
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${m.className}`}
    >
      {m.label}
    </span>
  );
}
