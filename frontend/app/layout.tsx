import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = "https://turfstack.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "TurfStack - Book Courts, Manage Facilities",
    template: "%s | TurfStack",
  },
  description:
    "India's smartest sports facility platform. Book pickleball, cricket, badminton courts instantly. Manage bookings, revenue & utilization.",
  icons: { icon: "/favicon.ico" },
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    siteName: "TurfStack",
    title: "TurfStack - Book Courts, Manage Facilities",
    description:
      "Online bookings, walk-in management, Razorpay payments, and revenue analytics for sports facilities.",
    url: SITE_URL,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "TurfStack - Book Courts, Manage Facilities",
    description:
      "India's smartest sports facility platform. Book courts instantly.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
