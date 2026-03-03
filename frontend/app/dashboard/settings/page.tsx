"use client";

import { useState, useEffect } from "react";
import { api, type User, type Court } from "@/lib/api";
import { getRole } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User as UserIcon,
  Building2,
  Shield,
  Trophy,
  Check,
  Loader2,
} from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const role = getRole();

  useEffect(() => {
    Promise.all([api.getMe(), api.getCourts()])
      .then(([u, c]) => {
        setUser(u);
        setFullName(u.full_name);
        setPhone(u.phone || "");
        setCourts(c);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!user) return;
    const updates: { full_name?: string; phone?: string } = {};
    if (fullName !== user.full_name) updates.full_name = fullName;
    if (phone !== (user.phone || "")) updates.phone = phone || undefined;

    if (Object.keys(updates).length === 0) {
      toast.info("No changes to save");
      return;
    }

    setSaving(true);
    try {
      const updated = await api.updateMe(updates);
      setUser(updated);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  const hasChanges =
    user && (fullName !== user.full_name || phone !== (user.phone || ""));

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">
          Manage your account and facility preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Your Profile</CardTitle>
              <p className="text-sm text-slate-500">Account information</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Full Name
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Email
              </label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Phone
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Role
              </label>
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-slate-50">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium capitalize">
                  {user?.role || "—"}
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardContent>
      </Card>

      {(role === "owner" || role === "manager") && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Facility</CardTitle>
                <p className="text-sm text-slate-500">
                  Facility ID: {user?.facility_id || "—"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Facility Name
                </label>
                <Input defaultValue="TurfStack Arena" disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Plan
                </label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-slate-50">
                  <span className="text-sm font-medium">Free</span>
                  <span className="ml-auto text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(role === "owner" || role === "manager") && courts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Courts</CardTitle>
                <p className="text-sm text-slate-500">
                  {courts.length} court{courts.length !== 1 ? "s" : ""}{" "}
                  configured
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {courts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
                      {c.name.replace("Court ", "")}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-slate-500 capitalize">
                        {c.sport} &middot;{" "}
                        {c.surface_type || "Standard"} &middot;{" "}
                        {c.is_indoor ? "Indoor" : "Outdoor"} &middot;{" "}
                        {c.slot_duration_minutes}min slots
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatINR(c.hourly_rate)}/hr
                    </p>
                    {c.peak_hour_rate && (
                      <p className="text-xs text-amber-600">
                        Peak: {formatINR(c.peak_hour_rate)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>TurfStack v0.1.0</span>
            <span>API: sfms-api.fly.dev</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
