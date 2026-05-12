import { Zap } from "lucide-react";

type XPBadgeProps = {
  xp: number;
  label?: string;
  tone?: "green" | "blue" | "gold";
};

const tones = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  blue: "border-sky-200 bg-sky-50 text-sky-700",
  gold: "border-amber-200 bg-amber-50 text-amber-700"
};

export function XPBadge({ xp, label = "XP", tone = "gold" }: XPBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black ${tones[tone]}`}>
      <Zap className="h-3.5 w-3.5 fill-current" />
      <span>{xp}</span>
      <span>{label}</span>
    </div>
  );
}
