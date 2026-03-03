"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback, Suspense } from "react";
import { CheckCircle, CreditCard, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";
import { api, type PaymentOrder } from "@/lib/api";
import { loadRazorpayScript, openRazorpayCheckout, type RazorpayResponse } from "@/lib/razorpay";

type PaymentState = "loading" | "ready" | "processing" | "success" | "failed" | "skipped";

function ConfirmationContent() {
  const params = useSearchParams();
  const router = useRouter();
  const bookingId = params.get("id");
  const amount = params.get("amount");
  const courtName = params.get("court");
  const date = params.get("date");
  const time = params.get("time");

  const [state, setState] = useState<PaymentState>("loading");
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [error, setError] = useState("");

  const initPayment = useCallback(async () => {
    if (!bookingId) return;
    setState("loading");
    setError("");
    try {
      const paymentOrder = await api.createPaymentOrder(parseInt(bookingId));
      setOrder(paymentOrder);
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError("Could not load payment gateway. You can pay at the venue.");
      }
      setState("ready");
    } catch (err: any) {
      const msg = err?.message || err?.detail || "";
      if (msg.toLowerCase().includes("not configured")) {
        setError("Online payments are not available right now. You can pay at the venue.");
      } else {
        setError("Could not set up payment. You can pay at the venue or retry.");
      }
      setState("ready");
    }
  }, [bookingId]);

  useEffect(() => {
    initPayment();
  }, [initPayment]);

  async function handlePay() {
    if (!order) return;
    setState("processing");
    setError("");

    openRazorpayCheckout(
      order,
      async (response: RazorpayResponse) => {
        try {
          await api.verifyPayment(response);
          setState("success");
        } catch {
          setError("Payment captured but verification failed. Contact support.");
          setState("failed");
        }
      },
      (err: any) => {
        setError(err?.description || "Payment was cancelled or failed.");
        setState("failed");
      },
    );
  }

  if (!bookingId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8 space-y-4">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            <p className="text-slate-600">No booking found.</p>
            <Link href="/book"><Button>Book a Court</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8 space-y-4">
            <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
            <h1 className="text-2xl font-bold text-slate-900">Payment Successful!</h1>
            <p className="text-slate-600">Booking #{bookingId} is confirmed and paid.</p>
            {amount && (
              <p className="text-xl font-semibold text-emerald-600">{formatINR(parseFloat(amount))}</p>
            )}
            <div className="flex gap-3 justify-center pt-4">
              <Link href="/book"><Button variant="outline">Book Another</Button></Link>
              <Link href="/dashboard"><Button>Go to Dashboard</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "skipped") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8 space-y-4">
            <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
            <h1 className="text-2xl font-bold text-slate-900">Booking Confirmed!</h1>
            <p className="text-slate-600">Booking #{bookingId} is reserved. Payment pending.</p>
            {amount && (
              <p className="text-xl font-semibold text-slate-700">{formatINR(parseFloat(amount))}</p>
            )}
            <p className="text-xs text-slate-400">You can pay at the venue or online later.</p>
            <div className="flex gap-3 justify-center pt-4">
              <Link href="/book"><Button variant="outline">Book Another</Button></Link>
              <Link href="/dashboard"><Button>Go to Dashboard</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <CreditCard className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="text-2xl font-bold text-slate-900">Complete Payment</h1>
            <p className="text-sm text-slate-500">Booking #{bookingId}</p>
          </div>

          <div className="rounded-lg border p-4 space-y-2 bg-slate-50">
            {courtName && <p className="text-sm font-medium">{courtName}</p>}
            {date && <p className="text-xs text-slate-500">{date}</p>}
            {time && <p className="text-xs text-slate-500">{time}</p>}
            {amount && (
              <p className="text-2xl font-bold text-emerald-600 pt-1">{formatINR(parseFloat(amount))}</p>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handlePay}
              disabled={state === "loading" || state === "processing" || !order}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              {state === "loading" ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Preparing...</>
              ) : state === "processing" ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><CreditCard className="h-4 w-4 mr-2" /> Pay {amount ? formatINR(parseFloat(amount)) : "Now"}</>
              )}
            </Button>

            {(state === "failed" || (state === "ready" && !order)) && (
              <Button onClick={initPayment} variant="outline" className="w-full">
                Retry Payment Setup
              </Button>
            )}

            <button
              onClick={() => setState("skipped")}
              className="text-xs text-slate-400 hover:text-slate-600 w-full text-center block"
            >
              <Clock className="inline h-3 w-3 mr-1" />
              Pay later at the venue
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
