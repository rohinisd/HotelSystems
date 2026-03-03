"use client";

import { useState, useEffect, useMemo } from "react";
import { api, type RevenueTrend, type UtilizationData, type HourlyUtilization } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS_RANGE = Array.from({ length: 17 }, (_, i) => i + 6);

function formatHour(h: number): string {
  const ampm = h >= 12 ? "P" : "A";
  return `${h % 12 || 12}${ampm}`;
}

function HeatmapGrid({ data }: { data: HourlyUtilization[] }) {
  const { courts, maxCount, getCount } = useMemo(() => {
    const courtSet = new Set<string>();
    let max = 0;
    const map = new Map<string, number>();

    data.forEach((d) => {
      courtSet.add(d.court_name);
      const key = `${d.court_name}-${d.day_of_week}-${d.hour}`;
      map.set(key, (map.get(key) || 0) + d.booking_count);
      const val = map.get(key)!;
      if (val > max) max = val;
    });

    return {
      courts: Array.from(courtSet).sort(),
      maxCount: max,
      getCount: (court: string, day: number, hour: number) =>
        map.get(`${court}-${day}-${hour}`) || 0,
    };
  }, [data]);

  if (courts.length === 0) {
    return <div className="text-center py-8 text-slate-500">No utilization data yet</div>;
  }

  function intensity(count: number): string {
    if (count === 0) return "bg-slate-50";
    const ratio = count / maxCount;
    if (ratio < 0.25) return "bg-emerald-100";
    if (ratio < 0.5) return "bg-emerald-200";
    if (ratio < 0.75) return "bg-emerald-400 text-white";
    return "bg-emerald-600 text-white";
  }

  return (
    <div className="space-y-6">
      {courts.map((court) => (
        <div key={court}>
          <p className="text-sm font-medium text-slate-700 mb-2">{court}</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr>
                  <th className="w-10 text-left text-slate-500 font-medium pr-2"></th>
                  {HOURS_RANGE.map((h) => (
                    <th key={h} className="text-center font-medium text-slate-500 px-0.5 min-w-[28px]">
                      {formatHour(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS_SHORT.map((dayName, dayIdx) => (
                  <tr key={dayIdx}>
                    <td className="text-slate-500 font-medium pr-2 py-0.5">{dayName}</td>
                    {HOURS_RANGE.map((h) => {
                      const count = getCount(court, dayIdx, h);
                      return (
                        <td key={h} className="px-0.5 py-0.5">
                          <div
                            className={`h-6 w-full rounded-sm flex items-center justify-center text-[9px] font-medium ${intensity(count)}`}
                            title={`${dayName} ${formatHour(h)}: ${count} bookings`}
                          >
                            {count > 0 ? count : ""}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 text-[10px] text-slate-500">
        <span>Less</span>
        {["bg-slate-50", "bg-emerald-100", "bg-emerald-200", "bg-emerald-400", "bg-emerald-600"].map((c) => (
          <div key={c} className={`h-4 w-4 rounded-sm ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export default function RevenuePage() {
  const [trend, setTrend] = useState<RevenueTrend[]>([]);
  const [utilization, setUtilization] = useState<UtilizationData[]>([]);
  const [hourly, setHourly] = useState<HourlyUtilization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getRevenueTrend(30),
      api.getUtilization(),
      api.getHourlyUtilization(30).catch(() => []),
    ])
      .then(([t, u, h]) => {
        setTrend(t);
        setUtilization(u);
        setHourly(h);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleExport() {
    const token = localStorage.getItem("sfms_token");
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/v1/dashboard/export/revenue`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "revenue_export.csv";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      alert("Failed to export. Please try again.");
    }
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
              {totalBookings > 0 ? formatINR(totalRevenue / totalBookings) : "\u20B90"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Utilization Heatmap (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : (
            <HeatmapGrid data={hourly} />
          )}
        </CardContent>
      </Card>

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
