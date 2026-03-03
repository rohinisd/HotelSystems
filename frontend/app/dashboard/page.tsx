"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IndianRupee,
  CalendarDays,
  TrendingUp,
  Users,
  CalendarPlus,
  Ticket,
  ArrowRight,
} from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, type BookingItem, type DashboardKPI } from "@/lib/api";
import { getRole } from "@/lib/auth";
import { formatINR } from "@/lib/utils";

function OwnerManagerDashboard() {
  const [kpis, setKpis] = useState<DashboardKPI[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    Promise.all([
      api.getDashboardKPIs().catch(() => []),
      api.getBookings({ date: today, limit: 10 }).catch(() => ({ items: [], total: 0 })),
    ])
      .then(([k, b]) => {
        setKpis(k);
        setBookings(b.items.filter((x: BookingItem) => x.status === "confirmed"));
      })
      .finally(() => setLoading(false));
  }, []);

  const kpiIcons = [
    <IndianRupee key="r" className="h-5 w-5 text-emerald-500" />,
    <CalendarDays key="b" className="h-5 w-5 text-blue-500" />,
    <TrendingUp key="u" className="h-5 w-5 text-amber-500" />,
    <Users key="p" className="h-5 w-5 text-purple-500" />,
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Welcome back! Here&apos;s your facility overview.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <KPICard key={i} label="" value="" changePct={0} icon={null} loading />
            ))
          : kpis.map((k, i) => (
              <KPICard
                key={k.label}
                label={k.label}
                value={k.value}
                changePct={k.change_pct}
                icon={kpiIcons[i] || kpiIcons[0]}
              />
            ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Today&apos;s Bookings</CardTitle>
          <Link href="/dashboard/bookings">
            <Button variant="ghost" size="sm">
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-slate-500">Loading...</div>
          ) : bookings.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              No bookings for today
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 8).map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-xs font-semibold">
                      #{b.id}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {b.player_name || "Player"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {b.court_name} &middot; {b.start_time} -{" "}
                        {b.end_time}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-slate-700">
                    {formatINR(b.amount)}
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

function StaffDashboard() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    api
      .getBookings({ date: today, limit: 10 })
      .then((b) => setBookings(b.items.filter((x) => x.status === "confirmed")))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Today&apos;s Schedule
          </h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Link href="/book">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <CalendarPlus className="h-4 w-4 mr-2" />
            Walk-in Booking
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-4xl font-bold text-emerald-600">
              {bookings.length}
            </p>
            <p className="text-sm text-slate-500 mt-1">Bookings Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-4xl font-bold text-blue-600">
              {formatINR(bookings.reduce((s, b) => s + b.amount, 0))}
            </p>
            <p className="text-sm text-slate-500 mt-1">Revenue Today</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Slots</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-slate-500">Loading...</div>
          ) : bookings.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              No bookings today
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
                      {b.start_time.slice(0, 5)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {b.player_name || "Player"} &middot; {b.court_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {b.start_time} - {b.end_time} &middot; {b.booking_type}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatINR(b.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlayerDashboard() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getBookings({ limit: 20 })
      .then((b) => setBookings(b.items))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = bookings.filter((b) => b.status === "confirmed");
  const past = bookings.filter((b) => b.status !== "confirmed").slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back!
          </h1>
          <p className="text-sm text-slate-500">
            Book your next court session
          </p>
        </div>
        <Link href="/book">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <CalendarPlus className="h-4 w-4 mr-2" />
            Book a Court
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Ticket className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-700">
                  {upcoming.length}
                </p>
                <p className="text-sm text-emerald-600">Upcoming Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-700">
                  {bookings.length}
                </p>
                <p className="text-sm text-slate-500">Total Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {upcoming.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Upcoming</CardTitle>
            <Link href="/dashboard/my-bookings">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcoming.slice(0, 5).map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {b.court_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {b.date} &middot; {b.start_time} - {b.end_time}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    {formatINR(b.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {upcoming.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <CalendarPlus className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-slate-500">No upcoming bookings</p>
            <Link href="/book">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Book your first court
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AccountantDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
        <p className="text-sm text-slate-500">
          Revenue reports and financial data
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard/revenue">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold">Revenue Reports</p>
                <p className="text-sm text-slate-500">
                  Daily trends, court performance, CSV exports
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 ml-auto" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const role = getRole();

  switch (role) {
    case "owner":
    case "manager":
      return <OwnerManagerDashboard />;
    case "staff":
      return <StaffDashboard />;
    case "accountant":
      return <AccountantDashboard />;
    case "player":
    default:
      return <PlayerDashboard />;
  }
}
