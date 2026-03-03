import type { Metadata } from "next";
import { LegalLayout } from "@/components/layout/legal-layout";

export const metadata: Metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
  return (
    <LegalLayout>
      <h1 className="text-3xl font-bold mb-8">Terms &amp; Conditions</h1>
      <p className="text-sm text-slate-400 mb-8">Last updated: March 3, 2026</p>

      <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. About TurfStack</h2>
          <p>
            TurfStack (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is an online sports facility booking platform operated by Girish Basavaraj Hiremath. 
            We enable players to discover and book courts for pickleball, cricket, badminton, and other sports at partner facilities across India.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Eligibility</h2>
          <p>
            You must be at least 18 years of age to create an account and use our services. By registering, you confirm that the information 
            you provide is accurate and complete.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Booking &amp; Payments</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>All court bookings are subject to availability at the time of confirmation.</li>
            <li>Payments are processed securely through Razorpay. We accept credit/debit cards, UPI, net banking, and wallets.</li>
            <li>Prices displayed include applicable taxes unless stated otherwise.</li>
            <li>A booking is confirmed only after successful payment or explicit confirmation by facility staff for walk-in bookings.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. User Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You are responsible for arriving at the booked court on time.</li>
            <li>Misuse of the platform, including creating fraudulent bookings, may result in account suspension.</li>
            <li>You must not share your account credentials with others.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Facility Owners</h2>
          <p>
            Facility owners and managers are responsible for maintaining accurate court information, pricing, and availability on the platform. 
            TurfStack acts as a technology provider and is not liable for the condition or quality of the sports facilities.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Intellectual Property</h2>
          <p>
            All content on TurfStack, including logos, designs, and software, is owned by us and protected under applicable intellectual property laws. 
            You may not reproduce, distribute, or create derivative works without written permission.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Limitation of Liability</h2>
          <p>
            TurfStack is provided &quot;as is&quot;. We are not liable for any direct, indirect, or consequential damages arising from the use of our platform, 
            including but not limited to booking disputes, payment failures, or facility-related issues.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">8. Governing Law</h2>
          <p>
            These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Hyderabad, Telangana.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">9. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">10. Contact</h2>
          <p>
            For questions about these terms, reach us at{" "}
            <a href="mailto:gen.girish@gmail.com" className="text-emerald-400 hover:underline">gen.girish@gmail.com</a>.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
