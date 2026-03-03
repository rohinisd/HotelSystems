"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
        <p className="text-sm text-slate-500 max-w-md">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline">
          <RefreshCcw className="h-4 w-4 mr-2" /> Try Again
        </Button>
        <Link href="/">
          <Button>
            <Home className="h-4 w-4 mr-2" /> Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
