import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-8">Last updated: March 3, 2026</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
            <p>When you use TurfStack, we may collect the following information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Account information:</strong> Name, email address, phone number provided during registration.</li>
              <li><strong className="text-white">Booking data:</strong> Court selections, dates, times, and booking history.</li>
              <li><strong className="text-white">Payment information:</strong> Payments are processed by Razorpay. We do not store your card details, bank account numbers, or UPI PINs. We only store transaction references (order IDs, payment IDs) for record-keeping.</li>
              <li><strong className="text-white">Usage data:</strong> Browser type, IP address, and pages visited for analytics and security purposes.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To process and manage your court bookings.</li>
              <li>To send booking confirmations and important updates.</li>
              <li>To process payments and refunds through Razorpay.</li>
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
              <li><strong className="text-white">Razorpay:</strong> Payment details are shared with Razorpay for transaction processing. Razorpay&apos;s privacy policy applies to their handling of your data.</li>
              <li><strong className="text-white">Legal requirements:</strong> We may disclose data if required by law or to protect our legal rights.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">4. Data Security</h2>
            <p>
              We use industry-standard security measures including encrypted connections (HTTPS), secure password hashing (bcrypt), 
              and JWT-based authentication. Payment data is handled entirely by Razorpay, which is PCI-DSS compliant.
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
