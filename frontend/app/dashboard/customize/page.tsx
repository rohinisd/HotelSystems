"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type Restaurant = {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  cover_image_url: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
};

export default function CustomizePage() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0f766e");
  const [secondaryColor, setSecondaryColor] = useState("#134e4a");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }
    fetch(`${API_URL}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error("Not logged in");
        return r.json();
      })
      .then((me) => {
        const rid = me.restaurant_id;
        if (rid == null) {
          setError("Your account is not linked to a restaurant. Log in as a restaurant owner or ask an admin to set your restaurant.");
          setLoading(false);
          return;
        }
        return fetch(`${API_URL}/api/v1/restaurants/${rid}`).then((res) => res.json());
      })
      .then((r) => {
        if (!r) return;
        setRestaurant(r);
        setName(r.name || "");
        setTagline(r.tagline || "");
        setLogoUrl(r.logo_url || "");
        setPrimaryColor(r.primary_color || "#0f766e");
        setSecondaryColor(r.secondary_color || "#134e4a");
        setCoverImageUrl(r.cover_image_url || "");
        setAddress(r.address || "");
        setCity(r.city || "");
        setPhone(r.phone || "");
        setEmail(r.email || "");
      })
      .catch(() => setError("Failed to load restaurant"))
      .finally(() => setLoading(false));
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurant) return;
    setError("");
    setSaving(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    fetch(`${API_URL}/api/v1/restaurants/${restaurant.id}/customize`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        name: name || undefined,
        tagline: tagline || undefined,
        logo_url: logoUrl || undefined,
        primary_color: primaryColor || undefined,
        secondary_color: secondaryColor || undefined,
        cover_image_url: coverImageUrl || undefined,
        address: address || undefined,
        city: city || undefined,
        phone: phone || undefined,
        email: email || undefined,
      }),
    })
      .then((r) => (r.ok ? r.json() : r.json().then((d) => { throw new Error(d.detail || "Failed"); })))
      .then(setRestaurant)
      .catch((err) => setError(err.message || "Save failed"))
      .finally(() => setSaving(false));
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center"><p className="text-stone-500">Loading...</p></main>;

  return (
    <main className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Link href="/dashboard" className="text-stone-500 hover:text-stone-800 text-sm">← Dashboard</Link>
        <h1 className="text-2xl font-bold text-stone-900 mt-2 mb-2">Customize your restaurant page</h1>
        <p className="text-stone-600 text-sm mb-6">Change how your restaurant appears to customers. Colors and logo will show on your public booking page.</p>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Restaurant name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-stone-300 rounded-lg px-3 py-2" placeholder="The Garden Bistro" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Tagline</label>
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full border border-stone-300 rounded-lg px-3 py-2" placeholder="Fresh food, warm vibes" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Logo URL</label>
            <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="w-full border border-stone-300 rounded-lg px-3 py-2" placeholder="https://..." />
            {logoUrl && <img src={logoUrl} alt="Logo preview" className="mt-2 h-12 w-auto object-contain" />}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Cover image URL</label>
            <input type="url" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} className="w-full border border-stone-300 rounded-lg px-3 py-2" placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Primary colour</label>
              <div className="flex gap-2">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-14 rounded border border-stone-300 cursor-pointer" />
                <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 border border-stone-300 rounded-lg px-3 py-2 font-mono text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Secondary colour</label>
              <div className="flex gap-2">
                <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-10 w-14 rounded border border-stone-300 cursor-pointer" />
                <input type="text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="flex-1 border border-stone-300 rounded-lg px-3 py-2 font-mono text-sm" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border border-stone-300 rounded-lg px-3 py-2" placeholder="45 Green Avenue" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full border border-stone-300 rounded-lg px-3 py-2" placeholder="Mumbai" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-stone-300 rounded-lg px-3 py-2" placeholder="+91 98765 43210" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-stone-300 rounded-lg px-3 py-2" placeholder="hello@restaurant.com" />
          </div>
          <button type="submit" disabled={saving} className="w-full py-3 rounded-lg font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>

        {restaurant && (
          <p className="mt-4 text-center text-stone-500 text-sm">
            Preview: <a href={`/restaurant/${restaurant.slug}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">View your public page</a>
          </p>
        )}
      </div>
    </main>
  );
}
