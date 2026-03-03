import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
      <nav className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-xs tracking-tight">
            TS
          </div>
          <span className="text-lg font-bold tracking-tight">TurfStack</span>
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
        <p className="text-slate-400 mb-10">
          Have a question, feedback, or need help with a booking? We&apos;d love to hear from you.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white">Email</h3>
            <a href="mailto:gen.girish@gmail.com" className="text-sm text-emerald-400 hover:underline break-all">
              gen.girish@gmail.com
            </a>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white">Location</h3>
            <p className="text-sm text-slate-400">Hyderabad, Telangana, India</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white">Website</h3>
            <a href="https://turfstack.vercel.app" className="text-sm text-emerald-400 hover:underline">
              turfstack.vercel.app
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 space-y-4">
          <h2 className="text-xl font-semibold text-white">Business Details</h2>
          <div className="space-y-3 text-slate-300 text-sm">
            <div className="flex gap-3">
              <span className="text-slate-500 min-w-[140px]">Operated by</span>
              <span>Girish Basavaraj Hiremath</span>
            </div>
            <div className="flex gap-3">
              <span className="text-slate-500 min-w-[140px]">Platform</span>
              <span>TurfStack — Sports Facility Booking</span>
            </div>
            <div className="flex gap-3">
              <span className="text-slate-500 min-w-[140px]">Payment partner</span>
              <span>Razorpay Software Pvt. Ltd.</span>
            </div>
            <div className="flex gap-3">
              <span className="text-slate-500 min-w-[140px]">Response time</span>
              <span>Within 24–48 hours</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        <div className="flex justify-center gap-6 mb-3">
          <Link href="/terms" className="hover:text-slate-300">Terms</Link>
          <Link href="/privacy" className="hover:text-slate-300">Privacy</Link>
          <Link href="/refund-policy" className="hover:text-slate-300">Refund Policy</Link>
          <Link href="/contact" className="hover:text-slate-300">Contact</Link>
        </div>
        &copy; {new Date().getFullYear()} TurfStack &middot; Built in Hyderabad
      </footer>
    </div>
  );
}
