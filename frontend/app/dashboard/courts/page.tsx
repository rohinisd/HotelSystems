"use client";

import { useState, useEffect } from "react";
import { api, type Court } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, MapPin } from "lucide-react";

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCourts()
      .then(setCourts)
      .catch(() => setCourts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Courts</h1>
        <p className="text-sm text-slate-500">Manage your courts and pricing</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
                <div className="mt-3 h-4 w-24 animate-pulse rounded bg-slate-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courts.map((court) => (
            <Card key={court.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{court.name}</h3>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${court.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {court.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Trophy className="h-4 w-4" />
                  <span className="capitalize">{court.sport}</span>
                  {court.surface_type && (
                    <span className="text-slate-400">({court.surface_type})</span>
                  )}
                  {court.is_indoor && (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">Indoor</span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <p className="text-xs text-slate-500">Regular</p>
                    <p className="font-semibold">{formatINR(court.hourly_rate)}/hr</p>
                  </div>
                  {court.peak_hour_rate && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Peak</p>
                      <p className="font-semibold text-amber-600">{formatINR(court.peak_hour_rate)}/hr</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
