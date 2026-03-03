"use client";

import { useState, useEffect, useRef } from "react";
import { api, type BookingItem } from "@/lib/api";
import { getRole } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Banknote,
  Smartphone,
  ChevronDown,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [paidIds, setPaidIds] = useState<Set<number>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const role = getRole();
  const canRecordPayment = role === "owner" || role === "manager" || role === "staff";
  const canRefund = role === "owner" || role === "manager";

  useEffect(() => {
    setPage(0);
    loadBookings(0);
  }, [dateFilter]);

  useEffect(() => {
    loadBookings(page);
  }, [page]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadBookings(p?: number) {
    setLoading(true);
    try {
      const currentPage = p ?? page;
      const data = await api.getBookings({
        date: dateFilter,
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE,
      });
      setBookings(data.items);
      setTotal(data.total);
    } catch {
      setBookings([]);
      setTotal(0);
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

  async function handleRefund(paymentId: number) {
    if (!confirm("Issue a refund for this payment?")) return;
    try {
      await api.refundPayment(paymentId);
      toast.success("Refund initiated");
      loadBookings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refund failed");
    }
  }

  async function handleRecordPayment(bookingId: number, method: "cash" | "upi") {
    setPayingId(bookingId);
    setOpenDropdown(null);
    try {
      if (method === "cash") {
        await api.recordCashPayment(bookingId);
      } else {
        await api.recordUpiPayment(bookingId);
      }
      setPaidIds((prev) => new Set(prev).add(bookingId));
      toast.success(`${method.toUpperCase()} payment recorded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment recording failed");
    } finally {
      setPayingId(null);
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
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-sm font-semibold">{formatINR(b.amount)}</span>

                    {(paidIds.has(b.id) || b.payment_status === "captured") ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1 text-xs font-medium">
                        <CheckCircle className="h-3 w-3" /> Paid {b.payment_method ? `(${b.payment_method})` : ""}
                      </span>
                    ) : (
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[b.status] || "bg-slate-100"}`}>
                        {b.status}
                      </span>
                    )}

                    {b.status === "cancelled" && b.payment_id && b.payment_status === "captured" && canRefund && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRefund(b.payment_id!)}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" /> Refund
                      </Button>
                    )}

                    {b.status === "confirmed" && !paidIds.has(b.id) && b.payment_status !== "captured" && canRecordPayment && (
                      <div className="relative" ref={openDropdown === b.id ? dropdownRef : undefined}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOpenDropdown(openDropdown === b.id ? null : b.id)}
                          disabled={payingId === b.id}
                          className="text-xs"
                        >
                          {payingId === b.id ? "..." : <>Payment <ChevronDown className="h-3 w-3 ml-1" /></>}
                        </Button>
                        {openDropdown === b.id && (
                          <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border bg-white shadow-lg py-1">
                            <button
                              onClick={() => handleRecordPayment(b.id, "cash")}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                            >
                              <Banknote className="h-4 w-4 text-emerald-600" /> Cash
                            </button>
                            <button
                              onClick={() => handleRecordPayment(b.id, "upi")}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                            >
                              <Smartphone className="h-4 w-4 text-blue-600" /> UPI
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {b.status === "confirmed" && (
                      <Button variant="ghost" size="sm" onClick={() => handleCancel(b.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs">
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

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
