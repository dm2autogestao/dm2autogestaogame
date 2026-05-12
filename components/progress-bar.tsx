"use client";

import { motion } from "framer-motion";

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
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${normalized}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
      </div>
    </div>
  );
}
