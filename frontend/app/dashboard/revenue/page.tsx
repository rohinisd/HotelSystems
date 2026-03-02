"use client";

import { useState, useEffect } from "react";
import { api, type RevenueTrend, type UtilizationData } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function RevenuePage() {
  const [trend, setTrend] = useState<RevenueTrend[]>([]);
  const [utilization, setUtilization] = useState<UtilizationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getRevenueTrend(30), api.getUtilization()])
      .then(([t, u]) => {
        setTrend(t);
        setUtilization(u);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleExport() {
    const token = localStorage.getItem("sfms_token");
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/v1/dashboard/export/revenue`;
    window.open(`${url}?token=${token}`, "_blank");
  }

  const totalRevenue = trend.reduce((sum, d) => sum + d.revenue, 0);
  const totalBookings = trend.reduce((sum, d) => sum + d.bookings, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Revenue</h1>
          <p className="text-sm text-slate-500">Last 30 days performance</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Revenue (30d)</p>
            <p className="text-2xl font-bold">{formatINR(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Bookings (30d)</p>
            <p className="text-2xl font-bold">{totalBookings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Avg per Booking</p>
            <p className="text-2xl font-bold">
              {totalBookings > 0 ? formatINR(totalRevenue / totalBookings) : "₹0"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : trend.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No data yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium text-right">Revenue</th>
                    <th className="pb-3 font-medium text-right">Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  {trend.map((d) => (
                    <tr key={d.date} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-3">{d.date}</td>
                      <td className="py-3 text-right font-medium">{formatINR(d.revenue)}</td>
                      <td className="py-3 text-right">{d.bookings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Court Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Court Performance (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {utilization.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No data yet</div>
          ) : (
            <div className="space-y-3">
              {utilization.map((u) => (
                <div key={u.court_name} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{u.court_name}</p>
                    <p className="text-xs text-slate-500 capitalize">{u.sport}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatINR(u.total_revenue)}</p>
                    <p className="text-xs text-slate-500">{u.total_bookings} bookings</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
