"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type Restaurant = { id: number; name: string; slug: string; primary_color: string | null };
type Table = { id: number; name: string; capacity: number; min_party: number; max_party: number };

export default function BookPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [partySize, setPartySize] = useState(2);
  const [tableId, setTableId] = useState<number | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch(`${API_URL}/api/v1/restaurants/by-slug/${slug}`).then((r) => r.json()),
    ])
      .then(([r]) => {
        setRestaurant(r);
        return fetch(`${API_URL}/api/v1/restaurants/${r.id}/tables`).then((res) => res.json());
      })
      .then(setTables)
      .catch(() => setRestaurant(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (tables.length > 0 && partySize >= 1) {
      const suitable = tables.find((t) => partySize >= t.min_party && partySize <= t.max_party);
      setTableId(suitable ? suitable.id : tables[0].id);
    }
  }, [tables, partySize]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurant || !tableId || !date || !time) return;
    setError("");
    setSubmitting(true);
    fetch(`${API_URL}/api/v1/restaurants/${restaurant.id}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table_id: tableId,
        reservation_date: date,
        reservation_time: time,
        party_size: partySize,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone || undefined,
        notes: notes || undefined,
      }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.detail || "Failed"); });
        return res.json();
      })
      .then(() => setSuccess(true))
      .catch((err) => setError(err.message || "Booking failed"))
      .finally(() => setSubmitting(false));
  }

  if (loading || !restaurant) {
    return <main className="min-h-screen flex items-center justify-center bg-white"><p className="text-gray-500">Loading...</p></main>;
  }

  const primary = restaurant.primary_color || "#EA580C";

  if (success) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md text-center section-container">
          <h1 className="text-2xl font-bold text-gray-900">Booking confirmed</h1>
          <p className="mt-2 text-gray-600">We’ve reserved your table at {restaurant.name}. See you soon!</p>
          <Link href={`/restaurant/${slug}`} className="inline-block mt-6 px-6 py-3 rounded-lg text-white font-semibold bg-tango hover:bg-tango-dark" style={{ backgroundColor: primary }}>
            Back to {restaurant.name}
          </Link>
          <Link href="/" className="block mt-3 text-gray-500 text-sm">All restaurants</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white py-8">
      <div className="section-container max-w-lg">
        <Link href={`/restaurant/${slug}`} className="text-gray-500 hover:text-gray-900 text-sm font-medium">← {restaurant.name}</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">Book a table</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tango focus:border-tango" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tango focus:border-tango" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party size</label>
            <select value={partySize} onChange={(e) => setPartySize(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tango focus:border-tango">
              {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>)}
            </select>
          </div>
          {tables.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
              <select value={tableId ?? ""} onChange={(e) => setTableId(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tango focus:border-tango">
                {tables.filter((t) => partySize >= t.min_party && partySize <= t.max_party).map((t) => (
                  <option key={t.id} value={t.id}>{t.name} (up to {t.max_party})</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
            <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} required minLength={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tango focus:border-tango" placeholder="Full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tango focus:border-tango" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tango focus:border-tango" placeholder="+1 234 567 8900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tango focus:border-tango" placeholder="Dietary requirements, celebration..." />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full py-3 rounded-lg font-semibold text-white bg-tango hover:bg-tango-dark disabled:opacity-50" style={{ backgroundColor: primary }}>
            {submitting ? "Booking..." : "Confirm reservation"}
          </button>
        </form>
      </div>
    </main>
  );
}
