import { Crown, Sparkles } from "lucide-react";
import type { Level } from "@/data/game-data";
import { ProgressBar } from "@/components/progress-bar";

type LevelCardProps = {
  level: Level;
  xp: number;
  progress: number;
  nextLevelName?: string;
};

export function LevelCard({ level, xp, progress, nextLevelName }: LevelCardProps) {
  return (
    <section
      className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur"
    >
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-100/70" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Jornada Comercial
          </div>
          <h1 className="text-2xl font-black leading-tight text-ink">Jornada Comercial Gamificada</h1>
          <p className="mt-2 max-w-[22rem] text-sm font-semibold text-slate-500">
            Metas simples, XP real e clareza para fazer o comercial rodar toda semana.
          </p>
        </div>
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl border border-amber-200 bg-amber-100 text-amber-600 shadow-sm">
          <Crown className="h-8 w-8 fill-current" />
        </div>
      </div>
      <div className="relative mt-5 rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Nivel atual</p>
            <p className="text-base font-black text-ink">{level.name}</p>
          </div>
          <div className="rounded-2xl bg-white px-3 py-2 text-right shadow-sm">
            <p className="text-xs font-black text-slate-400">XP total</p>
            <p className="text-lg font-black text-ink">{xp}</p>
          </div>
        </div>
        <ProgressBar value={progress} color={level.color} />
        <p className="mt-2 text-xs font-bold text-slate-500">
          {nextLevelName ? `Proximo nivel: ${nextLevelName}` : "Nivel maximo alcancado. Hora de escalar."}
        </p>
      </div>
    </section>
  );
}
