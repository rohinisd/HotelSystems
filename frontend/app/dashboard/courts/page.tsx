"use client";

import { useState, useEffect } from "react";
import { api, type Court, type Branch } from "@/lib/api";
import { getRole, getFacilityId } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Trophy, Plus, Pencil, X, Power, DollarSign } from "lucide-react";
import { toast } from "sonner";

const SPORTS = ["pickleball", "cricket", "badminton", "volleyball", "tennis", "football"];

interface CourtFormData {
  branch_id: number;
  name: string;
  sport: string;
  surface_type: string;
  hourly_rate: string;
  peak_hour_rate: string;
  slot_duration_minutes: string;
  is_indoor: boolean;
}

const emptyForm: CourtFormData = {
  branch_id: 0,
  name: "",
  sport: "pickleball",
  surface_type: "",
  hourly_rate: "",
  peak_hour_rate: "",
  slot_duration_minutes: "60",
  is_indoor: false,
};

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CourtFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const role = getRole();
  const canEdit = role === "owner" || role === "manager";

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [c, facilityId] = [await api.getCourts(), getFacilityId()];
      setCourts(c);
      if (facilityId) {
        const b = await api.getBranches(facilityId);
        setBranches(b);
      }
    } catch {
      setCourts([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({ ...emptyForm, branch_id: branches[0]?.id || 0 });
    setEditId(null);
    setShowForm(true);
    setError("");
  }

  function openEdit(court: Court) {
    setForm({
      branch_id: court.branch_id,
      name: court.name,
      sport: court.sport,
      surface_type: court.surface_type || "",
      hourly_rate: String(court.hourly_rate),
      peak_hour_rate: court.peak_hour_rate ? String(court.peak_hour_rate) : "",
      slot_duration_minutes: String(court.slot_duration_minutes),
      is_indoor: court.is_indoor,
    });
    setEditId(court.id);
    setShowForm(true);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editId) {
        await api.updateCourt(editId, {
          name: form.name,
          sport: form.sport,
          surface_type: form.surface_type || undefined,
          hourly_rate: parseFloat(form.hourly_rate),
          peak_hour_rate: form.peak_hour_rate ? parseFloat(form.peak_hour_rate) : undefined,
          slot_duration_minutes: parseInt(form.slot_duration_minutes),
          is_indoor: form.is_indoor,
        });
      } else {
        await api.createCourt({
          branch_id: form.branch_id,
          name: form.name,
          sport: form.sport,
          surface_type: form.surface_type || undefined,
          hourly_rate: parseFloat(form.hourly_rate),
          peak_hour_rate: form.peak_hour_rate ? parseFloat(form.peak_hour_rate) : undefined,
          slot_duration_minutes: parseInt(form.slot_duration_minutes),
          is_indoor: form.is_indoor,
        });
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(court: Court) {
    try {
      await api.updateCourt(court.id, { is_active: !court.is_active });
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Courts</h1>
          <p className="text-sm text-slate-500">Manage your courts and pricing</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Add Court
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editId ? "Edit Court" : "Add New Court"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Court Name</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Court A" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Sport</label>
                  <select
                    value={form.sport}
                    onChange={(e) => setForm({ ...form, sport: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {SPORTS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Surface Type</label>
                  <Input value={form.surface_type} onChange={(e) => setForm({ ...form, surface_type: e.target.value })} placeholder="e.g. Synthetic, Clay" />
                </div>
                {!editId && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Branch</label>
                    <select
                      value={form.branch_id}
                      onChange={(e) => setForm({ ...form, branch_id: parseInt(e.target.value) })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Hourly Rate (INR)</label>
                  <Input type="number" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} placeholder="800" required min="1" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Peak Hour Rate (INR)</label>
                  <Input type="number" value={form.peak_hour_rate} onChange={(e) => setForm({ ...form, peak_hour_rate: e.target.value })} placeholder="1200" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Slot Duration (min)</label>
                  <select
                    value={form.slot_duration_minutes}
                    onChange={(e) => setForm({ ...form, slot_duration_minutes: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Indoor</label>
                  <div className="flex items-center gap-2 h-10">
                    <input
                      type="checkbox"
                      checked={form.is_indoor}
                      onChange={(e) => setForm({ ...form, is_indoor: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-600">{form.is_indoor ? "Indoor" : "Outdoor"}</span>
                  </div>
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  {saving ? "Saving..." : editId ? "Update Court" : "Create Court"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-6 w-32 animate-pulse rounded bg-slate-200" /><div className="mt-3 h-4 w-24 animate-pulse rounded bg-slate-200" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courts.map((court) => (
            <Card key={court.id} className={`hover:shadow-md transition-shadow ${!court.is_active ? "opacity-60" : ""}`}>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{court.name}</h3>
                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(court)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${court.is_active ? "text-emerald-600" : "text-red-500"}`}
                          onClick={() => toggleActive(court)}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${court.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {court.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Trophy className="h-4 w-4" />
                  <span className="capitalize">{court.sport}</span>
                  {court.surface_type && <span className="text-slate-400">({court.surface_type})</span>}
                  {court.is_indoor && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">Indoor</span>}
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
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{court.slot_duration_minutes}min slots</span>
                  {canEdit && (
                    <Link href={`/dashboard/courts/pricing?court_id=${court.id}&name=${encodeURIComponent(court.name)}`}>
                      <Button variant="ghost" size="sm" className="text-xs h-7 text-emerald-600 hover:text-emerald-700">
                        <DollarSign className="h-3 w-3 mr-1" /> Pricing Rules
                      </Button>
                    </Link>
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
