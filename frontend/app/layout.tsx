import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { GoogleAuthProvider } from "./providers/GoogleAuthProvider";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: "TableBook – Restaurant table booking",
  description: "Book a table at your favourite restaurant. Authentic flavors, easy reservations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="antialiased min-h-screen bg-white font-sans text-gray-900">
        <GoogleAuthProvider>{children}</GoogleAuthProvider>
      </body>
    </html>
  );
}
