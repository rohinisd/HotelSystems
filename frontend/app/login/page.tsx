"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let data;
      if (isRegister) {
        data = await api.register({ email, password, full_name: fullName, phone });
      } else {
        data = await api.login(email, password);
      }
      setAuth(data.access_token, data.role, data.facility_id);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail("owner@smasharena.in");
    setPassword("password123");
    setIsRegister(false);
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-xs tracking-tight">
            TS
          </div>
          <span className="text-xl font-bold tracking-tight">TurfStack</span>
        </div>

        <div className="space-y-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Manage your courts.
            <br />
            <span className="text-emerald-400">Grow your revenue.</span>
          </h1>
          <p className="text-slate-400 leading-relaxed">
            Real-time bookings, smart pricing, payment collection, and revenue
            analytics for pickleball, cricket, badminton &amp; more.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              Zero double-bookings
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              Razorpay + Cash + UPI
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          &copy; {new Date().getFullYear()} TurfStack &middot; Built in Hyderabad
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-white p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-xs tracking-tight text-white">
              TS
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              TurfStack
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              {isRegister ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-sm text-slate-500">
              {isRegister
                ? "Sign up to start booking courts"
                : "Sign in to your facility dashboard"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {isRegister && (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="fullName"
                    className="text-sm font-medium text-slate-700"
                  >
                    Full Name
                  </label>
                  <Input
                    id="fullName"
                    placeholder="Girish Hiremath"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="phone"
                    className="text-sm font-medium text-slate-700"
                  >
                    Phone
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isRegister
                  ? "Create Account"
                  : "Sign In"}
            </Button>
          </form>

          <div className="space-y-3">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium w-full text-center"
            >
              {isRegister
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </button>

            {!isRegister && (
              <button
                onClick={fillDemo}
                className="text-xs text-slate-400 hover:text-slate-600 w-full text-center block"
              >
                Try demo account &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
