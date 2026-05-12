"use client";

import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ProblemCardProps = {
  title: string;
  symptom: string;
  icon: LucideIcon;
  open: boolean;
  onClick: () => void;
};

export function ProblemCard({ title, symptom, icon: Icon, open, onClick }: ProblemCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-3xl border-2 border-b-4 p-4 text-left transition active:translate-y-1 active:border-b-2 ${
        open ? "border-sky-400 bg-sky-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${open ? "bg-skyjoy text-white" : "bg-slate-100 text-slate-500"}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-ink">{title}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">{symptom}</p>
        </div>
        <ChevronDown className={`h-5 w-5 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </div>
    </button>
  );
}
