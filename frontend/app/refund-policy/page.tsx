import type { Metadata } from "next";
import { LegalLayout } from "@/components/layout/legal-layout";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
};

export default function RefundPolicyPage() {
  return (
    <LegalLayout>
      <h1 className="text-3xl font-bold mb-8">Cancellation &amp; Refund Policy</h1>
      <p className="text-sm text-slate-400 mb-8">Last updated: March 3, 2026</p>

      <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Cancellation by Player</h2>
          <p>You may cancel a confirmed booking subject to the following conditions:</p>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="px-4 py-3 text-white font-semibold">Cancellation Time</th>
                  <th className="px-4 py-3 text-white font-semibold">Refund</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800/50">
                  <td className="px-4 py-3">More than 24 hours before slot</td>
                  <td className="px-4 py-3 text-emerald-400 font-medium">Full refund</td>
                </tr>
                <tr className="border-b border-slate-800/50">
                  <td className="px-4 py-3">4–24 hours before slot</td>
                  <td className="px-4 py-3 text-amber-400 font-medium">50% refund</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Less than 4 hours before slot</td>
                  <td className="px-4 py-3 text-red-400 font-medium">No refund</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Cancellation by Facility</h2>
          <p>
            If a facility cancels your booking due to maintenance, weather, or other reasons, you will receive a <strong className="text-white">full refund</strong> regardless of timing. 
            The facility staff or manager will initiate the cancellation and refund through the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. How Refunds Work</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-white">Online payments (Razorpay):</strong> Refunds are processed back to the original payment method (card, UPI, net banking, or wallet). Razorpay typically processes refunds within 5–7 business days.</li>
            <li><strong className="text-white">Cash payments:</strong> Cash refunds are handled directly at the facility. TurfStack does not process cash refunds online.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. No-Show Policy</h2>
          <p>
            If you do not show up for your booked slot without cancelling in advance, no refund will be provided. 
            The slot will be marked as utilized.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Rescheduling</h2>
          <p>
            Currently, TurfStack does not support rescheduling. To change your slot, please cancel the existing booking 
            (subject to the refund policy above) and create a new booking.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Disputes</h2>
          <p>
            If you believe a refund was not processed correctly or have a dispute regarding a booking, please contact us at{" "}
            <a href="mailto:gen.girish@gmail.com" className="text-emerald-400 hover:underline">gen.girish@gmail.com</a>{" "}
            with your booking ID. We will investigate and respond within 48 hours.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
