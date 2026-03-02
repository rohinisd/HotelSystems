"use client";

import { useState, useEffect } from "react";
import { api, type BookingItem } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, [dateFilter]);

  async function loadBookings() {
    setLoading(true);
    try {
      const data = await api.getBookings({ date: dateFilter });
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id: number) {
    if (!confirm("Cancel this booking?")) return;
    try {
      await api.cancelBooking(id);
      loadBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cancel failed");
    }
  }

  const statusColors: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
    no_show: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
          <p className="text-sm text-slate-500">Manage all bookings</p>
        </div>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-44"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No bookings for this date</div>
          ) : (
            <div className="divide-y">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
                      #{b.id}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {b.player_name || "Player"} &middot; {b.court_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {b.branch_name} &middot; {b.start_time} - {b.end_time} &middot; {b.booking_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{formatINR(b.amount)}</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[b.status] || "bg-slate-100"}`}>
                      {b.status}
                    </span>
                    {b.status === "confirmed" && (
                      <Button variant="ghost" size="sm" onClick={() => handleCancel(b.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
