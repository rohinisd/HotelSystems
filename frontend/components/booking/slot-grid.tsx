"use client";

import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/utils";

interface Slot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  court_id: number;
  price: number;
  is_peak?: boolean;
}

interface SlotGridProps {
  slots: Slot[];
  selectedSlot: Slot | null;
  onSelect: (slot: Slot) => void;
  loading?: boolean;
}

function formatTime12(time24: string): string {
  const [h, m] = time24.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export function SlotGrid({ slots, selectedSlot, onSelect, loading }: SlotGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No slots available for this date
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
      {slots.map((slot) => {
        const isSelected = selectedSlot?.start_time === slot.start_time && selectedSlot?.court_id === slot.court_id;
        return (
          <button
            key={`${slot.court_id}-${slot.start_time}`}
            disabled={!slot.is_available}
            onClick={() => onSelect(slot)}
            className={cn(
              "rounded-lg border p-3 text-center text-sm transition-all",
              slot.is_available
                ? isSelected
                  ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500 shadow-sm"
                  : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50"
                : "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed line-through",
            )}
          >
            <div className="font-medium">{formatTime12(slot.start_time)}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1 flex-wrap">
              {formatINR(slot.price)}
              {slot.is_peak && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-medium">
                  Peak
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
