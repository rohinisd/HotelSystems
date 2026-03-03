import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Court",
  description:
    "Book pickleball, cricket, badminton, and volleyball courts instantly. Real-time availability and online payments.",
  openGraph: {
    title: "Book a Court | TurfStack",
    description:
      "Book sports courts with real-time availability. Pickleball, cricket, badminton & more.",
  },
};

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
