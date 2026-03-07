import Link from "next/link";
import { Zap, CalendarCheck, BarChart3, Shield } from "lucide-react";
import { APP_NAME } from "@/lib/app-config";

const features = [
  {
    icon: CalendarCheck,
    title: "Instant Booking",
    desc: "Real-time slot availability. Book pickleball, cricket, badminton courts in seconds.",
  },
  {
    icon: BarChart3,
    title: "Revenue Dashboard",
    desc: "Track daily revenue, court utilization, and booking trends at a glance.",
  },
  {
    icon: Zap,
    title: "Smart Pricing",
    desc: "Peak-hour rates, weekend overrides, and early-bird discounts — fully configurable.",
  },
  {
    icon: Shield,
    title: "No Double-Bookings",
    desc: "Database-level exclusion constraints guarantee zero overlap. Always.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-xs tracking-tight">
            TS
          </div>
          <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-slate-300 hover:text-white transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/book"
            className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-400 transition-colors"
          >
            Book a Court
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-sm text-emerald-400">
            <Zap className="h-3.5 w-3.5" />
            Now live in Hyderabad
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
            Book courts.
            <br />
            <span className="text-emerald-400">Fill every slot.</span>
          </h1>

          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            {APP_NAME} is the all-in-one platform for sports facility owners.
            Online bookings, walk-in management, payments, and revenue analytics
            &mdash; out of the box.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/book"
              className="rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-all"
            >
              Book a Court &rarr;
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-700 bg-slate-800/50 px-8 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-all"
            >
              Facility Login
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-24">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-3 hover:border-emerald-500/30 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <f.icon className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        <div className="flex justify-center gap-6 mb-3">
          <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
          <Link href="/refund-policy" className="hover:text-slate-300 transition-colors">Refund Policy</Link>
          <Link href="/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
        </div>
        &copy; {new Date().getFullYear()} {APP_NAME} &middot; Built in Hyderabad
      </footer>
    </div>
  );
}
