import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your BookYourSlots dashboard. Manage court bookings, revenue, and team.",
  openGraph: {
    title: "Sign In | BookYourSlots",
    description: "Access your sports facility dashboard.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
