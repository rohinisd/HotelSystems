"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, type Branch, type Court } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SportSelector } from "@/components/booking/sport-selector";
import { SlotGrid } from "@/components/booking/slot-grid";

interface Slot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  court_id: number;
  price: number;
}

export default function BookPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [sport, setSport] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getBranches(1).then(setBranches).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedBranch && sport) {
      api.getCourts(selectedBranch).then((courts) => {
        setCourts(courts.filter((c) => c.sport === sport));
      });
    }
  }, [selectedBranch, sport]);

  useEffect(() => {
    if (selectedCourt && selectedDate) {
      setLoadingSlots(true);
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/v1/bookings/slots?court_id=${selectedCourt.id}&date=${selectedDate}`,
      )
        .then((r) => r.json())
        .then((data) => {
          setSlots(data);
          setSelectedSlot(null);
        })
        .catch(() => setSlots([]))
        .finally(() => setLoadingSlots(false));
    }
  }, [selectedCourt, selectedDate]);

  async function handleBook() {
    if (!selectedSlot || !selectedCourt) return;
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    setBooking(true);
    setError("");
    try {
      const result = await api.createBooking({
        court_id: selectedCourt.id,
        date: selectedDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        booking_type: "online",
      });
      router.push(`/book/confirmation?id=${result.id}&amount=${result.amount}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Book a Court</h1>
          <p className="text-slate-500">Select your sport, venue, and time slot</p>
        </div>

        {/* Step 1: Sport */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Choose Sport</CardTitle>
          </CardHeader>
          <CardContent>
            <SportSelector
              selected={sport}
              onSelect={(s) => {
                setSport(s);
                setSelectedCourt(null);
                setSlots([]);
                if (selectedBranch) setStep(2);
              }}
            />
          </CardContent>
        </Card>

        {/* Step 2: Branch + Court */}
        {sport && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. Choose Venue & Court</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {branches.map((b) => (
                  <Button
                    key={b.id}
                    variant={selectedBranch === b.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedBranch(b.id);
                      setSelectedCourt(null);
                      setSlots([]);
                    }}
                  >
                    {b.name}
                  </Button>
                ))}
              </div>

              {courts.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {courts.map((c) => (
                    <Button
                      key={c.id}
                      variant={selectedCourt?.id === c.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedCourt(c);
                        setStep(3);
                      }}
                    >
                      {c.name} ({c.surface_type || c.sport}) - {formatINR(c.hourly_rate)}/hr
                    </Button>
                  ))}
                </div>
              )}
              {selectedBranch && courts.length === 0 && (
                <p className="text-sm text-slate-500">No {sport} courts at this branch</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Date + Slots */}
        {selectedCourt && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">3. Pick Date & Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="max-w-xs"
              />
              <SlotGrid
                slots={slots}
                selectedSlot={selectedSlot}
                onSelect={setSelectedSlot}
                loading={loadingSlots}
              />
            </CardContent>
          </Card>
        )}

        {/* Confirm */}
        {selectedSlot && (
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    {selectedCourt?.name} - {sport}
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedDate} | {selectedSlot.start_time} - {selectedSlot.end_time}
                  </p>
                  <p className="text-lg font-bold text-emerald-600 mt-1">
                    {formatINR(selectedSlot.price)}
                  </p>
                </div>
                <Button onClick={handleBook} disabled={booking} size="lg">
                  {booking ? "Booking..." : "Confirm Booking"}
                </Button>
              </div>
              {error && (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
