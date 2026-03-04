"use client";

import { useState, useEffect } from "react";
import { api, type DueItem } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, IndianRupee } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DuesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ items: DueItem[]; total_due: number; count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDues()
      .then(setData)
      .catch(() => setError("Failed to load dues"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Dues</h1>
        <div className="p-8 text-center text-slate-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Dues</h1>
        <div className="p-8 text-center text-amber-600 flex items-center justify-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      </div>
    );
  }

  const items = data?.items ?? [];
  const totalDue = data?.total_due ?? 0;
  const count = data?.count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dues</h1>
        <p className="text-sm text-slate-500">Bookings with pending or no payment</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-muted-foreground">Total Outstanding</p>
            </div>
            <p className="text-2xl font-bold text-amber-700">{formatINR(totalDue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-muted-foreground">Pending Bookings</p>
            </div>
            <p className="text-2xl font-bold">{count}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Outstanding Bookings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No outstanding dues</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="pb-3 px-4 font-medium">Date</th>
                    <th className="pb-3 px-4 font-medium">Court</th>
                    <th className="pb-3 px-4 font-medium">Player</th>
                    <th className="pb-3 px-4 font-medium">Phone</th>
                    <th className="pb-3 px-4 font-medium text-right">Amount</th>
                    <th className="pb-3 px-4 font-medium">Type</th>
                    <th className="pb-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-3 px-4">{item.date}</td>
                      <td className="py-3 px-4">
                        {item.court_name}
                        <span className="text-slate-500 text-xs ml-1">({item.sport})</span>
                      </td>
                      <td className="py-3 px-4">{item.player_name || "—"}</td>
                      <td className="py-3 px-4">{item.player_phone || "—"}</td>
                      <td className="py-3 px-4 text-right font-medium">{formatINR(item.amount)}</td>
                      <td className="py-3 px-4 capitalize">{item.booking_type}</td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/bookings?date=${item.date}`}>
                            Record payment
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
