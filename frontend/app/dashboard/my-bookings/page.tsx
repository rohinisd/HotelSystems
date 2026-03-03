"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, type BookingItem } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Ticket } from "lucide-react";
import { toast } from "sonner";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    try {
      const data = await api.getBookings({ limit: 50 });
      setBookings(data.items);
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
      toast.success("Booking cancelled");
      loadBookings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    }
  }

  const statusColors: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
    no_show: "bg-amber-100 text-amber-700",
  };

  const upcoming = bookings.filter((b) => b.status === "confirmed");
  const past = bookings.filter((b) => b.status !== "confirmed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
          <p className="text-sm text-slate-500">
            View and manage your court bookings
          </p>
        </div>
        <Link href="/book">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <CalendarPlus className="h-4 w-4 mr-2" />
            Book a Court
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-500">Loading...</div>
      ) : bookings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <Ticket className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-slate-500">No bookings yet</p>
            <Link href="/book">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Book your first court
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Upcoming ({upcoming.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {upcoming.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                          <span className="text-xs font-semibold leading-none">
                            {new Date(b.date).toLocaleDateString("en-IN", { day: "2-digit" })}
                          </span>
                          <span className="text-[10px] leading-none mt-0.5">
                            {new Date(b.date).toLocaleDateString("en-IN", { month: "short" })}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{b.court_name}</p>
                          <p className="text-xs text-slate-500">
                            {b.start_time} - {b.end_time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">
                          {formatINR(b.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(b.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {past.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  Past ({past.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {past.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-4 opacity-70"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <span className="text-xs font-semibold leading-none">
                            {new Date(b.date).toLocaleDateString("en-IN", { day: "2-digit" })}
                          </span>
                          <span className="text-[10px] leading-none mt-0.5">
                            {new Date(b.date).toLocaleDateString("en-IN", { month: "short" })}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{b.court_name}</p>
                          <p className="text-xs text-slate-500">
                            {b.start_time} - {b.end_time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">
                          {formatINR(b.amount)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[b.status] || "bg-slate-100"}`}
                        >
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
