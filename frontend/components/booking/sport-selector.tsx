"use client";

import { cn } from "@/lib/utils";

const SPORTS = [
  { id: "pickleball", label: "Pickleball", emoji: "🏓" },
  { id: "cricket", label: "Cricket", emoji: "🏏" },
  { id: "volleyball", label: "Volleyball", emoji: "🏐" },
  { id: "badminton", label: "Badminton", emoji: "🏸" },
];

interface SportSelectorProps {
  selected: string | null;
  onSelect: (sport: string) => void;
}

export function SportSelector({ selected, onSelect }: SportSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {SPORTS.map((sport) => (
        <button
          key={sport.id}
          onClick={() => onSelect(sport.id)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
            selected === sport.id
              ? "border-emerald-500 bg-emerald-50 shadow-sm"
              : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50",
          )}
        >
          <span className="text-3xl">{sport.emoji}</span>
          <span className="text-sm font-medium">{sport.label}</span>
        </button>
      ))}
    </div>
  );
}
