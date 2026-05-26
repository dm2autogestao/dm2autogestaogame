import { Flame, Trophy } from "lucide-react";
import type { Level } from "@/data/game-data";

type HeaderProps = {
  xp: number;
  level: Level;
  unitName?: string;
};

export function Header({ xp, level, unitName = "Sua Unidade" }: HeaderProps) {
  return (
    <header className="sticky top-5 z-30 rounded-[30px] border border-white/80 bg-white/85 px-4 py-3 shadow-soft backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-10 w-28 shrink-0 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm sm:h-12 sm:w-36">
            <img
              src="/brand-logo.webp"
              alt="Logo"
              width={144}
              height={48}
              loading="eager"
              decoding="async"
              className="h-full w-full object-contain p-1"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Unidade</p>
            <p className="truncate text-sm font-black text-ink sm:text-base">{unitName}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="flex items-center justify-end gap-2">
            <div className="flex items-center gap-1 rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-black text-orange-600 shadow-sm">
              <Flame className="h-4 w-4 fill-current" />
              {xp} XP
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-amber-200 bg-amber-100 text-amber-600 shadow-sm">
              <Trophy className="h-5 w-5 fill-current" />
            </div>
          </div>
          <p className="mt-1 max-w-36 truncate text-[11px] font-black text-slate-500 sm:max-w-52">{level.name}</p>
        </div>
      </div>
    </header>
  );
}
