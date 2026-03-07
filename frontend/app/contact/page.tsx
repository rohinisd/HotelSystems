import type { Metadata } from "next";
import { Mail, MapPin, Globe } from "lucide-react";
import { LegalLayout } from "@/components/layout/legal-layout";
import { PAYMENT_PROVIDER } from "@/lib/app-config";

export const metadata: Metadata = {
  title: "Contact Us",
};

export default function ContactPage() {
  return (
    <LegalLayout>
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
          <a href="https://sfms-eight.vercel.app" className="text-sm text-emerald-400 hover:underline">
            sfms-eight.vercel.app
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
            <span>BookYourSlots — Sports Facility Booking</span>
          </div>
          <div className="flex gap-3">
            <span className="text-slate-500 min-w-[140px]">Payment partner</span>
            <div>
              <span>{PAYMENT_PROVIDER.name}</span>
              <p className="text-xs text-slate-500 mt-1">CIN: {PAYMENT_PROVIDER.cin} · GST: {PAYMENT_PROVIDER.gst}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-slate-500 min-w-[140px]">Response time</span>
            <span>Within 24–48 hours</span>
          </div>
        </div>
      </div>
    </LegalLayout>
  );
}
