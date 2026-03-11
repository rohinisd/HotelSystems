"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type Restaurant = {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  tagline: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  cover_image_url: string | null;
};

export default function RestaurantPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_URL}/api/v1/restaurants/by-slug/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setRestaurant)
      .catch(() => setRestaurant(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <main className="min-h-screen flex items-center justify-center bg-white"><p className="text-gray-500">Loading...</p></main>;
  if (!restaurant) return <main className="min-h-screen flex items-center justify-center bg-white"><p className="text-gray-500">Restaurant not found.</p></main>;

  const primary = restaurant.primary_color || "#EA580C";
  const secondary = restaurant.secondary_color || "#C2410C";

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="section-container py-4 flex justify-between items-center">
          <Link href="/" className="text-gray-500 hover:text-gray-900 text-sm font-medium">
            ← All restaurants
          </Link>
          <Link href="/login" className="text-gray-600 text-sm font-medium hover:text-gray-900">
            Sign In
          </Link>
        </div>
      </header>

      <section
        className="py-16 sm:py-20 px-4 text-white"
        style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}
      >
        <div className="section-container text-center">
          {restaurant.logo_url && (
            <img src={restaurant.logo_url} alt="" className="h-20 w-auto mx-auto mb-4 object-contain" />
          )}
          <h1 className="text-4xl sm:text-5xl font-bold">{restaurant.name}</h1>
          {restaurant.tagline && <p className="mt-3 text-white/90 text-lg">{restaurant.tagline}</p>}
          {restaurant.address && <p className="mt-2 text-white/80 text-sm">{restaurant.address}{restaurant.city ? `, ${restaurant.city}` : ""}</p>}
          {restaurant.phone && <p className="mt-1 text-white/80 text-sm">{restaurant.phone}</p>}
          <Link
            href={`/restaurant/${slug}/book`}
            className="inline-block mt-8 px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition shadow-sm"
          >
            Book a table
          </Link>
        </div>
      </section>

      <section className="section-container py-16">
        <p className="text-gray-500 text-center mb-8">Choose your date and time to make a reservation.</p>
        <div className="text-center">
          <Link
            href={`/restaurant/${slug}/book`}
            className="inline-block px-8 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition bg-tango"
            style={{ backgroundColor: primary }}
          >
            Book a table
          </Link>
        </div>
      </section>
    </main>
  );
}
