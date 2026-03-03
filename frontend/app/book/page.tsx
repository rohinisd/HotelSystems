"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, type Branch, type Court, type Facility } from "@/lib/api";
import { isAuthenticated, getFacilityId, getRole } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SportSelector } from "@/components/booking/sport-selector";
import { SlotGrid } from "@/components/booking/slot-grid";
import { Loader2 } from "lucide-react";

interface Slot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  court_id: number;
  price: number;
}

export default function BookPage() {
  const router = useRouter();
  const role = getRole();
  const isStaff = role === "staff" || role === "owner" || role === "manager";

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<number | null>(null);
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
  const [playerName, setPlayerName] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const facilityId = getFacilityId();
    if (facilityId) {
      setSelectedFacility(facilityId);
      api.getBranches(facilityId).then(setBranches).catch(() => {}).finally(() => setInitialLoading(false));
    } else {
      api.getFacilities().then(async (facs) => {
        setFacilities(facs);
        if (facs.length === 1) {
          setSelectedFacility(facs[0].id);
          await api.getBranches(facs[0].id).then(setBranches).catch(() => {});
        }
      }).catch(() => {}).finally(() => setInitialLoading(false));
    }
  }, []);

  function handleFacilitySelect(fid: number) {
    setSelectedFacility(fid);
    setSelectedBranch(null);
    setSelectedCourt(null);
    setSlots([]);
    api.getBranches(fid).then(setBranches).catch(() => {});
  }

  useEffect(() => {
    if (selectedBranch && sport) {
      api.getCourts(selectedBranch).then((c) => {
        setCourts(c.filter((x) => x.sport === sport));
      });
    }
  }, [selectedBranch, sport]);

  useEffect(() => {
    if (selectedCourt && selectedDate) {
      setLoadingSlots(true);
      api.getSlots(selectedCourt.id, selectedDate)
        .then((data) => { setSlots(data); setSelectedSlot(null); })
        .catch(() => setSlots([]))
        .finally(() => setLoadingSlots(false));
    }
  }, [selectedCourt, selectedDate]);

  async function handleBook() {
    if (!selectedSlot || !selectedCourt) return;
    if (!isAuthenticated()) { router.push("/login"); return; }

    setBooking(true);
    setError("");
    try {
      const bookingType = isStaff ? "walkin" : "online";
      const result = await api.createBooking({
        court_id: selectedCourt.id,
        date: selectedDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        booking_type: bookingType,
        player_name: playerName || undefined,
        player_phone: playerPhone || undefined,
      });
      const qs = new URLSearchParams({
        id: String(result.id),
        amount: String(result.amount),
        court: `${selectedCourt.name} - ${sport}`,
        date: selectedDate,
        time: `${selectedSlot.start_time} - ${selectedSlot.end_time}`,
      });
      router.push(`/book/confirmation?${qs.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBooking(false);
    }
  }

  const showFacilityPicker = !getFacilityId() && facilities.length > 1;

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
          <p className="text-slate-500">Loading venues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">
            {isStaff ? "Walk-in Booking" : "Book a Court"}
          </h1>
          <p className="text-slate-500">Select your sport, venue, and time slot</p>
        </div>

        {showFacilityPicker && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Choose Facility</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {facilities.map((f) => (
                  <Button
                    key={f.id}
                    variant={selectedFacility === f.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFacilitySelect(f.id)}
                  >
                    {f.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-lg">1. Choose Sport</CardTitle></CardHeader>
          <CardContent>
            <SportSelector
              selected={sport}
              onSelect={(s) => {
                setSport(s);
                setSelectedCourt(null);
                setSlots([]);
              }}
            />
          </CardContent>
        </Card>

        {sport && selectedFacility && (
          <Card>
            <CardHeader><CardTitle className="text-lg">2. Choose Venue & Court</CardTitle></CardHeader>
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
                      onClick={() => setSelectedCourt(c)}
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

        {selectedCourt && (
          <Card>
            <CardHeader><CardTitle className="text-lg">3. Pick Date & Time</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="max-w-xs"
              />
              <SlotGrid slots={slots} selectedSlot={selectedSlot} onSelect={setSelectedSlot} loading={loadingSlots} />
            </CardContent>
          </Card>
        )}

        {selectedSlot && isStaff && (
          <Card>
            <CardHeader><CardTitle className="text-lg">4. Player Details (Walk-in)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Player name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
              <Input placeholder="Phone number" value={playerPhone} onChange={(e) => setPlayerPhone(e.target.value)} />
            </CardContent>
          </Card>
        )}

        {selectedSlot && (
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{selectedCourt?.name} - {sport}</p>
                  <p className="text-sm text-slate-600">{selectedDate} | {selectedSlot.start_time} - {selectedSlot.end_time}</p>
                  <p className="text-lg font-bold text-emerald-600 mt-1">{formatINR(selectedSlot.price)}</p>
                </div>
                <Button onClick={handleBook} disabled={booking} size="lg">
                  {booking ? "Booking..." : "Confirm Booking"}
                </Button>
              </div>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
