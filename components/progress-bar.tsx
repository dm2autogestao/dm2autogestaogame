type ProgressBarProps = {
  value: number;
  color?: string;
  label?: string;
  compact?: boolean;
};

export function ProgressBar({ value, color = "#58CC02", label, compact }: ProgressBarProps) {
  const normalized = Math.max(0, Math.min(100, value));

  return (
    <div className="w-full">
      {label ? (
        <div className="mb-1 flex items-center justify-between text-xs font-extrabold text-slate-500">
          <span>{label}</span>
          <span>{normalized}%</span>
        </div>
      ) : null}
      <div className={`${compact ? "h-2" : "h-4"} overflow-hidden rounded-full border border-slate-200 bg-white shadow-inner`}>
        <div
          className="h-full rounded-full"
          style={{ backgroundColor: color, width: `${normalized}%`, transition: "width 180ms ease-out" }}
        />
      </div>
    </div>
  );
}
