"use client";

import { useState, useEffect } from "react";
import { api, type Branch } from "@/lib/api";
import { getFacilityId } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Plus, X, Clock } from "lucide-react";

interface BranchFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  opening_time: string;
  closing_time: string;
}

const emptyForm: BranchFormData = {
  name: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  opening_time: "06:00",
  closing_time: "23:00",
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BranchFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const facilityId = getFacilityId();

  useEffect(() => {
    loadBranches();
  }, []);

  async function loadBranches() {
    if (!facilityId) return;
    setLoading(true);
    try {
      const data = await api.getBranches(facilityId);
      setBranches(data);
    } catch {
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!facilityId) return;
    setSaving(true);
    setError("");
    try {
      await api.createBranch(facilityId, {
        name: form.name,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        pincode: form.pincode || undefined,
        phone: form.phone || undefined,
        opening_time: form.opening_time,
        closing_time: form.closing_time,
      });
      setShowForm(false);
      setForm(emptyForm);
      loadBranches();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create branch");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Branches</h1>
          <p className="text-sm text-slate-500">Manage your facility locations</p>
        </div>
        <Button onClick={() => { setShowForm(true); setForm(emptyForm); setError(""); }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Add Branch
        </Button>
      </div>

      {showForm && (
        <Card className="border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Branch</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="branchName" className="text-sm font-medium text-slate-700">Branch Name</label>
                  <Input id="branchName" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Main Branch" required />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone</label>
                  <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="address" className="text-sm font-medium text-slate-700">Address</label>
                  <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Sports Road" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="city" className="text-sm font-medium text-slate-700">City</label>
                  <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Hyderabad" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="state" className="text-sm font-medium text-slate-700">State</label>
                  <Input id="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="Telangana" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="pincode" className="text-sm font-medium text-slate-700">Pincode</label>
                  <Input id="pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="500032" maxLength={10} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="openingTime" className="text-sm font-medium text-slate-700">Opening Time</label>
                  <Input id="openingTime" type="time" value={form.opening_time} onChange={(e) => setForm({ ...form, opening_time: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="closingTime" className="text-sm font-medium text-slate-700">Closing Time</label>
                  <Input id="closingTime" type="time" value={form.closing_time} onChange={(e) => setForm({ ...form, closing_time: e.target.value })} />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  {saving ? "Creating..." : "Create Branch"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-6 w-32 animate-pulse rounded bg-slate-200" /></CardContent></Card>
          ))}
        </div>
      ) : branches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-slate-500">
            <MapPin className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            No branches yet. Add your first location.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {branches.map((b) => (
            <Card key={b.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{b.name}</h3>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${b.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {b.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                {(b.address || b.city) && (
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{[b.address, b.city].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  <span>{b.opening_time} - {b.closing_time}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
