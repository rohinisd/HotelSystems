import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { QueryProvider } from "@/lib/query-client";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/app-config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL =
  process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "https://sfms-eight.vercel.app";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} - Book Courts, Manage Facilities`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  icons: { icon: "/favicon.ico" },
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} - Book Courts, Manage Facilities`,
    description:
      "Online bookings, walk-in management, Razorpay payments, and revenue analytics for sports facilities.",
    url: SITE_URL,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - Book Courts, Manage Facilities`,
    description: "India's smartest sports facility platform. Book courts instantly.",
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
        <AuthProvider>
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
