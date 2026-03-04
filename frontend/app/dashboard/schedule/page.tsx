"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { api, type ScheduleItem, type Court } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatHour(hour: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12} ${ampm}`;
}

const SOURCE_LABELS: Record<string, string> = {
  walkin: "Walk-in",
  phone: "Phone",
  hudle: "Hudle",
  playo: "Playo",
  khelomore: "KheloMore",
  other: "Other",
};

const HOUR_START = 6;
const HOUR_END = 23;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

export default function SchedulePage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockDialog, setBlockDialog] = useState<{ court: Court; hour: number } | null>(null);
  const [unblockDialog, setUnblockDialog] = useState<{ bookingId: number; courtName: string; hour: number } | null>(null);

  const role = typeof window !== "undefined" ? localStorage.getItem("sfms_role") : null;
  const canBlock = role === "owner" || role === "manager";

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.getSchedule(date).catch(() => []),
      api.getCourts().catch(() => []),
    ])
      .then(([s, c]) => {
        setSchedule(s);
        setCourts(c.filter((x) => x.is_active));
      })
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleBlock() {
    if (!blockDialog) return;
    const { court, hour } = blockDialog;
    const startTime = `${hour.toString().padStart(2, "0")}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;
    try {
      await api.blockSlot({
        court_id: court.id,
        date,
        start_time: startTime,
        end_time: endTime,
      });
      setBlockDialog(null);
      refresh();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUnblock() {
    if (!unblockDialog) return;
    try {
      await api.unblockSlot(unblockDialog.bookingId);
      setUnblockDialog(null);
      refresh();
    } catch (e) {
      console.error(e);
    }
  }

  function shiftDate(delta: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split("T")[0]);
  }

  const courtNames = useMemo(() => {
    const names = new Map<string, Court>();
    courts.forEach((c) => names.set(c.name, c));
    return Array.from(names.values());
  }, [courts]);

  const bookingMap = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    schedule.forEach((s) => {
      const key = s.court_name;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [schedule]);

  function getBookingAt(courtName: string, hour: number): ScheduleItem | null {
    const items = bookingMap.get(courtName) || [];
    const hourStart = hour * 60;
    const hourEnd = (hour + 1) * 60;
    return items.find((b) => {
      const bStart = timeToMinutes(b.start_time);
      const bEnd = timeToMinutes(b.end_time);
      return bStart < hourEnd && bEnd > hourStart;
    }) || null;
  }

  const isToday = date === new Date().toISOString().split("T")[0];
  const currentHour = new Date().getHours();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schedule</h1>
          <p className="text-sm text-slate-500">
            {new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shiftDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
          />
          <Button variant="outline" size="icon" onClick={() => shiftDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isToday && (
            <Button variant="outline" size="sm" onClick={() => setDate(new Date().toISOString().split("T")[0])}>
              Today
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading schedule...</div>
          ) : courtNames.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No courts found</div>
          ) : (
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="sticky left-0 bg-slate-50 z-10 text-left text-xs font-semibold text-slate-600 px-3 py-3 border-b border-r w-28">
                    Court
                  </th>
                  {HOURS.map((h) => (
                    <th
                      key={h}
                      className={`text-center text-xs font-medium px-1 py-3 border-b min-w-[80px] ${
                        isToday && h === currentHour ? "bg-emerald-50 text-emerald-700" : "text-slate-500"
                      }`}
                    >
                      {formatHour(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courtNames.map((court) => (
                  <tr key={court.id} className="hover:bg-slate-50/50">
                    <td className="sticky left-0 bg-white z-10 text-sm font-medium text-slate-800 px-3 py-2 border-b border-r whitespace-nowrap">
                      <div>{court.name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{court.sport}</div>
                    </td>
                    {HOURS.map((h) => {
                      const booking = getBookingAt(court.name, h);
                      if (booking) {
                        const typeColor =
                          booking.booking_type === "blocked"
                            ? "bg-rose-100 border-rose-300 text-rose-800"
                            : booking.booking_type === "walkin"
                              ? "bg-amber-100 border-amber-300 text-amber-800"
                              : "bg-emerald-100 border-emerald-300 text-emerald-800";
                        const isBlocked = booking.booking_type === "blocked";
                        return (
                          <td key={h} className="px-0.5 py-1 border-b">
                            <div
                              className={`rounded px-1.5 py-1 text-[10px] leading-tight border flex items-center gap-1 ${typeColor} ${canBlock && isBlocked ? "cursor-pointer hover:bg-rose-200" : ""}`}
                              onClick={() =>
                                canBlock && isBlocked && setUnblockDialog({ bookingId: booking.id, courtName: court.name, hour: h })
                              }
                            >
                              {isBlocked && <Lock className="h-3 w-3 shrink-0" />}
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold truncate">
                                  {isBlocked ? "Blocked" : booking.player_full_name || booking.player_name || "Booked"}
                                </div>
                                {!isBlocked && (
                                  <div className="opacity-70 flex items-center gap-1 flex-wrap">
                                    {formatINR(booking.amount)}
                                    {booking.booking_source && booking.booking_source !== "turfstack" && (
                                      <span className="text-[9px] opacity-80" title={SOURCE_LABELS[booking.booking_source] || booking.booking_source}>
                                        ({SOURCE_LABELS[booking.booking_source] || booking.booking_source})
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      }
                      const isPast = isToday && h < currentHour;
                      return (
                        <td key={h} className={`px-0.5 py-1 border-b ${isPast ? "bg-slate-50" : ""}`}>
                          <div
                            className={`h-10 rounded border border-dashed border-slate-200 ${canBlock && !isPast ? "cursor-pointer hover:border-rose-300 hover:bg-rose-50" : ""}`}
                            onClick={() => canBlock && !isPast && setBlockDialog({ court, hour: h })}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-emerald-100 border border-emerald-300" />
          Online Booking
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-amber-100 border border-amber-300" />
          Walk-in
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-rose-100 border border-rose-300" />
          Blocked
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded border border-dashed border-slate-200" />
          Available
        </div>
      </div>

      <ConfirmDialog
        open={!!blockDialog}
        title="Block slot"
        message={
          blockDialog
            ? `Block ${blockDialog.court.name} at ${formatHour(blockDialog.hour)}?`
            : ""
        }
        confirmLabel="Block"
        variant="warning"
        onConfirm={handleBlock}
        onCancel={() => setBlockDialog(null)}
      />

      <ConfirmDialog
        open={!!unblockDialog}
        title="Unblock slot"
        message={
          unblockDialog
            ? `Unblock ${unblockDialog.courtName} at ${formatHour(unblockDialog.hour)}?`
            : ""
        }
        confirmLabel="Unblock"
        variant="default"
        onConfirm={handleUnblock}
        onCancel={() => setUnblockDialog(null)}
      />
    </div>
  );
}
