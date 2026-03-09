"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type Hotel = {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  is_active: boolean;
};

type Room = {
  id: number;
  hotel_id: number;
  name: string;
  room_type: string;
  rate_per_night: number;
  capacity: number;
  is_available: boolean;
};

export default function DashboardPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/v1/hotels`)
      .then((res) => res.json())
      .then((data) => {
        setHotels(data);
        if (data.length > 0 && !selectedHotelId) {
          setSelectedHotelId(data[0].id);
        }
      })
      .catch(() => setError("Failed to load hotels"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedHotelId == null) return;
    setRooms([]);
    fetch(`${API_URL}/api/v1/hotels/${selectedHotelId}/rooms`)
      .then((res) => res.json())
      .then(setRooms)
      .catch(() => setError("Failed to load rooms"));
  }, [selectedHotelId]);

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-gray-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Hotels & Rooms</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Home
          </Link>
        </div>

        {error && (
          <p className="text-red-600 mb-4">{error}</p>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select hotel
          </label>
          <select
            value={selectedHotelId ?? ""}
            onChange={(e) => setSelectedHotelId(Number(e.target.value))}
            className="border rounded px-3 py-2 min-w-[200px]"
          >
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} {h.city ? `(${h.city})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3">Room</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Rate/night</th>
                <th className="text-left p-3">Capacity</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.room_type}</td>
                  <td className="p-3">₹{r.rate_per_night.toLocaleString()}</td>
                  <td className="p-3">{r.capacity}</td>
                  <td className="p-3">
                    {r.is_available ? (
                      <span className="text-green-600">Available</span>
                    ) : (
                      <span className="text-gray-500">Unavailable</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rooms.length === 0 && !error && (
            <p className="p-4 text-gray-500">No rooms for this hotel.</p>
          )}
        </div>
      </div>
    </main>
  );
}
