import type { LucideIcon } from "lucide-react";

type ScoreCardProps = {
  label: string;
  value: string;
  trend?: string;
  icon?: LucideIcon;
  color?: string;
};

export function ScoreCard({ label, value, trend, icon: Icon, color = "#58CC02" }: ScoreCardProps) {
  return (
    <article className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-ink">{value}</p>
        </div>
        {Icon ? (
          <div className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: color }}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {trend ? <p className="mt-3 text-xs font-black text-emerald-600">{trend}</p> : null}
    </article>
  );
}
