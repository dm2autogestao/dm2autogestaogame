"use client";

import { CheckCircle2, Circle, Wrench } from "lucide-react";
import { XPBadge } from "@/components/xp-badge";

type SolutionCardProps = {
  title: string;
  xp: number;
  applied: boolean;
  onToggle: () => void;
};

export function SolutionCard({ title, xp, applied, onToggle }: SolutionCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-[22px] border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft ${
        applied ? "border-emerald-200 bg-emerald-50" : "border-white/80 bg-white/90"
      }`}
    >
      <div className={`${applied ? "text-emerald-600" : "text-slate-300"}`}>
        {applied ? <CheckCircle2 className="h-6 w-6 fill-current" /> : <Circle className="h-6 w-6" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-ink">{title}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-slate-500">
          <Wrench className="h-3.5 w-3.5" />
          {applied ? "Ação aplicada" : "Marcar como aplicada"}
        </p>
      </div>
      <XPBadge xp={xp} tone={applied ? "green" : "blue"} />
    </button>
  );
}
