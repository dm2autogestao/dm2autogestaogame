import { CheckCircle2, Circle } from "lucide-react";
import { XPBadge } from "@/components/xp-badge";

type MissionCardProps = {
  title: string;
  xp: number;
  done: boolean;
  onToggle: () => void;
};

export function MissionCard({ title, xp, done, onToggle }: MissionCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-[26px] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft active:translate-y-0 ${
        done ? "border-emerald-200 bg-emerald-50" : "border-white/80 bg-white/90"
      }`}
    >
      <div className={`${done ? "text-emerald-600" : "text-slate-300"}`}>
        {done ? <CheckCircle2 className="h-8 w-8 fill-current text-emerald-500" /> : <Circle className="h-8 w-8" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-black leading-snug ${done ? "text-emerald-800 line-through decoration-2" : "text-ink"}`}>{title}</p>
        <p className="mt-1 text-xs font-bold text-slate-500">{done ? "Meta concluída" : "Toque para ganhar XP"}</p>
      </div>
      <XPBadge xp={xp} tone={done ? "green" : "gold"} />
    </button>
  );
}
