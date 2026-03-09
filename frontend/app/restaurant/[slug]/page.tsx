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

  if (loading) return <main className="min-h-screen flex items-center justify-center"><p className="text-stone-500">Loading...</p></main>;
  if (!restaurant) return <main className="min-h-screen flex items-center justify-center"><p className="text-stone-500">Restaurant not found.</p></main>;

  const primary = restaurant.primary_color || "#0f766e";
  const secondary = restaurant.secondary_color || "#134e4a";

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-stone-500 hover:text-stone-800 text-sm">← All restaurants</Link>
          <Link href="/login" className="text-stone-600 text-sm font-medium">Login</Link>
        </div>
      </header>

      <section
        className="py-16 px-4 text-white"
        style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}
      >
        <div className="max-w-4xl mx-auto text-center">
          {restaurant.logo_url && (
            <img src={restaurant.logo_url} alt="" className="h-20 w-auto mx-auto mb-4 object-contain" />
          )}
          <h1 className="text-4xl font-bold">{restaurant.name}</h1>
          {restaurant.tagline && <p className="mt-2 text-white/90 text-lg">{restaurant.tagline}</p>}
          {restaurant.address && <p className="mt-2 text-white/80 text-sm">{restaurant.address}{restaurant.city ? `, ${restaurant.city}` : ""}</p>}
          {restaurant.phone && <p className="mt-1 text-white/80 text-sm">{restaurant.phone}</p>}
          <Link
            href={`/restaurant/${slug}/book`}
            className="inline-block mt-8 px-6 py-3 bg-white text-stone-900 font-semibold rounded-lg hover:bg-stone-100 transition"
          >
            Book a table
          </Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-stone-600 text-center">Choose your date and time to make a reservation.</p>
        <div className="text-center mt-6">
          <Link
            href={`/restaurant/${slug}/book`}
            className="inline-block px-6 py-3 rounded-lg font-medium text-white hover:opacity-90 transition"
            style={{ backgroundColor: primary }}
          >
            Book a table
          </Link>
        </div>
      </section>
    </main>
  );
}
