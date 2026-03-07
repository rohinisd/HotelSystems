import type { Metadata } from "next";
import { LegalLayout } from "@/components/layout/legal-layout";
import { PAYMENT_PROVIDER } from "@/lib/app-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <LegalLayout>
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-sm text-slate-400 mb-8">Last updated: March 3, 2026</p>

      <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
          <p>When you use TurfStack, we may collect the following information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-white">Account information:</strong> Name, email address, phone number provided during registration.</li>
            <li><strong className="text-white">Booking data:</strong> Court selections, dates, times, and booking history.</li>
            <li><strong className="text-white">Payment information:</strong> Payments are processed by {PAYMENT_PROVIDER.name}. We do not store your card details, bank account numbers, or UPI PINs. We only store transaction references (order IDs, payment IDs) for record-keeping.</li>
            <li><strong className="text-white">Usage data:</strong> Browser type, IP address, and pages visited for analytics and security purposes.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To process and manage your court bookings.</li>
            <li>To send booking confirmations and important updates.</li>
            <li>To process payments and refunds through {PAYMENT_PROVIDER.name}.</li>
            <li>To provide customer support.</li>
            <li>To improve our platform and user experience.</li>
            <li>To prevent fraud and ensure platform security.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Data Sharing</h2>
          <p>We do not sell your personal data. We share information only with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-white">Facility owners:</strong> Your name and phone number are shared with the facility where you book a court, so they can identify you on arrival.</li>
            <li><strong className="text-white">{PAYMENT_PROVIDER.name}:</strong> Payment details are shared with {PAYMENT_PROVIDER.name} for transaction processing. Their privacy policy applies to their handling of your data.</li>
            <li><strong className="text-white">Legal requirements:</strong> We may disclose data if required by law or to protect our legal rights.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Data Security</h2>
          <p>
            We use industry-standard security measures including encrypted connections (HTTPS), secure password hashing (bcrypt), 
            and JWT-based authentication. Payment data is handled entirely by {PAYMENT_PROVIDER.name}, which is PCI-DSS compliant.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. Booking and payment records are retained for accounting 
            and legal compliance purposes. You may request deletion of your account by contacting us.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Cookies</h2>
          <p>
            We use essential cookies and local storage for authentication (JWT tokens) and session management. 
            We do not use third-party tracking cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access and view your personal data through your account profile.</li>
            <li>Update or correct your information.</li>
            <li>Request deletion of your account and associated data.</li>
            <li>Withdraw consent for marketing communications.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">8. Changes to This Policy</h2>
          <p>
            We may update this policy periodically. We will notify users of significant changes via email or a notice on the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">9. Contact</h2>
          <p>
            For privacy-related inquiries, contact us at{" "}
            <a href="mailto:gen.girish@gmail.com" className="text-emerald-400 hover:underline">gen.girish@gmail.com</a>.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
