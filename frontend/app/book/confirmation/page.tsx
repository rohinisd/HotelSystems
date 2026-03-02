"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";
import { Suspense } from "react";

function ConfirmationContent() {
  const params = useSearchParams();
  const bookingId = params.get("id");
  const amount = params.get("amount");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="p-8 space-y-4">
          <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
          <h1 className="text-2xl font-bold text-slate-900">Booking Confirmed!</h1>
          <p className="text-slate-600">
            Your booking #{bookingId} has been confirmed.
          </p>
          {amount && (
            <p className="text-xl font-semibold text-emerald-600">
              {formatINR(parseFloat(amount))}
            </p>
          )}
          <div className="flex gap-3 justify-center pt-4">
            <Link href="/book">
              <Button variant="outline">Book Another</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
