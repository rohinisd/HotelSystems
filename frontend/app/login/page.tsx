"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleSignIn } from "../components/GoogleSignIn";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Login failed");
        return;
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.access_token);
        window.location.href = "/dashboard";
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Network error. Is the API running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-white">
      <div className="w-full max-w-sm border border-gray-200 rounded-xl shadow-sm bg-white p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Sign In</h1>

        <p className="text-gray-600 text-sm mb-3">
          Sign in with Google to access your dashboard.
        </p>
        <div className="mb-4">
          <GoogleSignIn
            text="signin"
            onSuccess={() => { if (typeof window !== "undefined") window.location.href = "/dashboard"; }}
            onError={setError}
          />
        </div>

        <div className="relative my-4">
          <span className="block text-center text-gray-400 text-sm">or sign in with email</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tango focus:border-tango"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tango focus:border-tango"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-tango text-white rounded-lg hover:bg-tango-dark disabled:opacity-50 font-semibold"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600">
          No account?{" "}
          <Link href="/register" className="text-tango hover:underline font-semibold">
            Register
          </Link>
        </p>
        <p className="mt-2">
          <Link href="/" className="text-sm text-gray-500 hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
