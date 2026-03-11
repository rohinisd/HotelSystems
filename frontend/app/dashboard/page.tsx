"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type Restaurant = {
  id: number;
  name: string;
  slug: string;
  city: string | null;
  tagline: string | null;
  primary_color: string | null;
};

type Reservation = {
  id: number;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: string;
  guest_name: string;
  guest_email: string;
};

export default function DashboardPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [me, setMe] = useState<{ restaurant_id: number | null; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      fetch(`${API_URL}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : null)
        .then(setMe)
        .catch(() => setMe(null));
    } else {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/restaurants`)
      .then((res) => res.json())
      .then(setRestaurants)
      .catch(() => setRestaurants([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!me?.restaurant_id) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    fetch(`${API_URL}/api/v1/restaurants/${me.restaurant_id}/reservations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : [])
      .then(setReservations)
      .catch(() => setReservations([]));
  }, [me?.restaurant_id]);

  if (loading) {
    return <main className="min-h-screen p-8 bg-white"><p className="text-gray-500">Loading...</p></main>;
  }

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="section-container max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex gap-3">
            <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">All restaurants</Link>
            {me?.restaurant_id && (
              <Link href="/dashboard/customize" className="px-4 py-2 rounded-lg text-sm font-semibold bg-tango text-white hover:bg-tango-dark">
                Customize my page
              </Link>
            )}
            <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Sign In</Link>
          </div>
        </div>

        {me?.restaurant_id && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Reservations</h2>
            {reservations.length === 0 ? (
              <p className="text-gray-500">No reservations yet.</p>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">Date</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">Time</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">Guest</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">Party</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((r) => (
                      <tr key={r.id} className="border-t border-gray-100">
                        <td className="p-3 text-gray-700">{r.reservation_date}</td>
                        <td className="p-3 text-gray-700">{r.reservation_time}</td>
                        <td className="p-3 text-gray-700">{r.guest_name}</td>
                        <td className="p-3 text-gray-700">{r.party_size}</td>
                        <td className="p-3"><span className="text-tango font-semibold">{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Restaurants</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {restaurants.map((r) => (
              <Link
                key={r.id}
                href={`/restaurant/${r.slug}`}
                className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-tango/40 transition"
              >
                <span className="font-semibold text-gray-900">{r.name}</span>
                {r.city && <span className="text-gray-500 text-sm ml-2">({r.city})</span>}
                {r.tagline && <p className="text-sm text-gray-500 mt-1">{r.tagline}</p>}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
