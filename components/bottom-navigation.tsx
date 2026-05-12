"use client";

import type { LucideIcon } from "lucide-react";

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type BottomNavigationProps = {
  items: NavItem[];
  active: string;
  onChange: (id: string) => void;
};

export function BottomNavigation({ items, active, onChange }: BottomNavigationProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-3 pt-2 shadow-[0_-12px_35px_rgba(23,32,51,0.12)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border text-[10px] font-black transition ${
                isActive
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-press"
                  : "border-transparent bg-white text-slate-400"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
