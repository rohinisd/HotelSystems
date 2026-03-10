import type { Metadata } from "next";
import "./globals.css";
import { GoogleAuthProvider } from "./providers/GoogleAuthProvider";

export const metadata: Metadata = {
  title: "TableBook – Restaurant table booking",
  description: "Book a table at your favourite restaurant. SaaS for restaurants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gray-50">
        <GoogleAuthProvider>{children}</GoogleAuthProvider>
      </body>
    </html>
  );
}
