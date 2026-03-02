"use client";

import {
  IndianRupee,
  CalendarDays,
  Users,
  TrendingUp,
} from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Welcome back! Here&apos;s your facility overview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Today's Revenue"
          value="₹4,800"
          changePct={12.5}
          icon={<IndianRupee className="h-5 w-5 text-emerald-500" />}
        />
        <KPICard
          label="Today's Bookings"
          value="4"
          changePct={-5.0}
          icon={<CalendarDays className="h-5 w-5 text-blue-500" />}
        />
        <KPICard
          label="Active Courts"
          value="7"
          changePct={0}
          icon={<TrendingUp className="h-5 w-5 text-amber-500" />}
        />
        <KPICard
          label="Utilization"
          value="68%"
          changePct={8.2}
          icon={<Users className="h-5 w-5 text-purple-500" />}
        />
      </div>

      {/* Today's Schedule Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today&apos;s Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { court: "Court A", time: "9:00 AM - 10:00 AM", player: "Arjun Reddy", sport: "Pickleball", amount: "₹800" },
              { court: "Court A", time: "10:00 AM - 11:00 AM", player: "Meera Patel", sport: "Pickleball", amount: "₹800" },
              { court: "Court B", time: "5:00 PM - 6:00 PM", player: "Arjun Reddy", sport: "Pickleball", amount: "₹1,200" },
              { court: "Court C", time: "4:00 PM - 5:00 PM", player: "Walk-in", sport: "Cricket", amount: "₹2,000" },
            ].map((booking, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    {booking.court.split(" ")[1]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{booking.player}</p>
                    <p className="text-xs text-slate-500">
                      {booking.court} &middot; {booking.sport} &middot; {booking.time}
                    </p>
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-700">
                  {booking.amount}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
