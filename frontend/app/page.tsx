"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type Restaurant = {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  tagline: string | null;
  logo_url: string | null;
  primary_color: string | null;
  cover_image_url: string | null;
};

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/restaurants`)
      .then((res) => res.json())
      .then(setRestaurants)
      .catch(() => setRestaurants([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <span className="text-xl font-semibold text-stone-800">TableBook</span>
          <div className="flex gap-3">
            <Link href="/login" className="text-stone-600 hover:text-stone-900 text-sm font-medium">
              Login
            </Link>
            <Link href="/register" className="text-stone-600 hover:text-stone-900 text-sm font-medium">
              Register
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">Find a restaurant</h1>
        <p className="text-stone-600 mb-8">Book a table at your favourite place.</p>

        {loading ? (
          <p className="text-stone-500">Loading restaurants...</p>
        ) : restaurants.length === 0 ? (
          <p className="text-stone-500">No restaurants yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {restaurants.map((r) => (
              <Link
                key={r.id}
                href={`/restaurant/${r.slug}`}
                className="block rounded-xl overflow-hidden border border-stone-200 bg-white shadow-sm hover:shadow-md transition"
              >
                {r.cover_image_url ? (
                  <div className="aspect-[2/1] bg-stone-200">
                    <img src={r.cover_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div
                    className="aspect-[2/1] flex items-center justify-center"
                    style={{ backgroundColor: r.primary_color || "#0f766e", color: "#fff" }}
                  >
                    {r.logo_url ? (
                      <img src={r.logo_url} alt="" className="h-16 w-auto object-contain" />
                    ) : (
                      <span className="text-2xl font-bold">{r.name.charAt(0)}</span>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <h2 className="font-semibold text-stone-900">{r.name}</h2>
                  {r.tagline && <p className="text-sm text-stone-500 mt-1">{r.tagline}</p>}
                  {r.city && <p className="text-sm text-stone-400 mt-1">{r.city}</p>}
                  <span className="inline-block mt-2 text-sm font-medium" style={{ color: r.primary_color || "#0f766e" }}>
                    Book a table →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
