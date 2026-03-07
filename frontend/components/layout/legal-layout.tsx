import Link from "next/link";
import { APP_NAME } from "@/lib/app-config";

export function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
      <nav className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${APP_NAME} home`}>
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-xs tracking-tight">
            BYS
          </div>
          <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">{children}</main>

      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        <div className="flex justify-center gap-6 mb-3">
          <Link href="/terms" className="hover:text-slate-300">Terms</Link>
          <Link href="/privacy" className="hover:text-slate-300">Privacy</Link>
          <Link href="/refund-policy" className="hover:text-slate-300">Refund Policy</Link>
          <Link href="/contact" className="hover:text-slate-300">Contact</Link>
        </div>
        &copy; {new Date().getFullYear()} {APP_NAME} &middot; Built in Hyderabad
      </footer>
    </div>
  );
}
