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
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="section-container py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-900">
            TableBook
          </Link>
          <nav className="flex gap-6">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-tango text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-tango-dark transition"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      <section className="section-container py-16 sm:py-20 md:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Book a table at your favourite place
          </h1>
          <p className="text-gray-500 text-lg">
            Authentic flavors, easy reservations. Find a restaurant and reserve in a few clicks.
          </p>
        </div>
      </section>

      <section className="section-container pb-20">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Find a restaurant</h2>
        {loading ? (
          <p className="text-gray-500">Loading restaurants...</p>
        ) : restaurants.length === 0 ? (
          <p className="text-gray-500">No restaurants yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((r) => (
              <Link
                key={r.id}
                href={`/restaurant/${r.slug}`}
                className="block rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-tango/30 transition"
              >
                {r.cover_image_url ? (
                  <div className="aspect-[2/1] bg-gray-100">
                    <img src={r.cover_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div
                    className="aspect-[2/1] flex items-center justify-center"
                    style={{ backgroundColor: r.primary_color || "#EA580C", color: "#fff" }}
                  >
                    {r.logo_url ? (
                      <img src={r.logo_url} alt="" className="h-16 w-auto object-contain" />
                    ) : (
                      <span className="text-3xl font-bold">{r.name.charAt(0)}</span>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{r.name}</h3>
                  {r.tagline && <p className="text-sm text-gray-500 mt-1">{r.tagline}</p>}
                  {r.city && <p className="text-sm text-gray-400 mt-1">{r.city}</p>}
                  <span
                    className="inline-block mt-3 text-sm font-semibold text-tango hover:underline"
                  >
                    Book a table →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-gray-100 py-8 mt-auto">
        <div className="section-container text-center text-gray-500 text-sm">
          TableBook – Restaurant table booking. Sign in to manage your reservations.
        </div>
      </footer>
    </main>
  );
}
