import { Check, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProgressBar } from "@/components/progress-bar";
import { XPBadge } from "@/components/xp-badge";
import type { PillarStatus } from "@/data/game-data";

type JourneyNodeProps = {
  name: string;
  short: string;
  icon: LucideIcon;
  accent: string;
  xp: number;
  progress: number;
  status: PillarStatus;
  index: number;
  onStart: () => void;
};

export function JourneyNode({ name, short, icon: Icon, accent, xp, progress, status, index, onStart }: JourneyNodeProps) {
  const locked = status === "locked";
  const done = status === "done";

  return (
    <article
      className={`relative ${index % 2 ? "ml-auto" : "mr-auto"} w-[88%] max-w-sm`}
    >
      <div className="absolute left-1/2 top-full h-8 w-1 -translate-x-1/2 bg-slate-200 last:hidden" />
      <div className={`rounded-[26px] border-2 border-b-8 bg-white p-4 shadow-soft ${locked ? "border-slate-200 opacity-65" : "border-slate-200"}`}>
        <div className="flex items-start gap-3">
          <div
            className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl border-2 border-b-4 text-white"
            style={{ backgroundColor: locked ? "#94A3B8" : accent, borderColor: locked ? "#CBD5E1" : accent }}
          >
            {locked ? <Lock className="h-7 w-7" /> : done ? <Check className="h-8 w-8 stroke-[4]" /> : <Icon className="h-8 w-8" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-black text-ink">{name}</h3>
                <p className="text-xs font-bold text-slate-500">{short}</p>
              </div>
              <XPBadge xp={xp} />
            </div>
            <ProgressBar value={progress} color={accent} compact />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase text-slate-500">
                {locked ? "Bloqueado" : done ? "Concluido" : "Em andamento"}
              </span>
              <button
                type="button"
                disabled={locked}
                onClick={onStart}
                className="rounded-2xl border-2 border-b-4 border-emerald-600 bg-meadow px-4 py-2 text-xs font-black uppercase text-white transition active:translate-y-1 active:border-b-2 disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-400"
              >
                Comecar meta
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
