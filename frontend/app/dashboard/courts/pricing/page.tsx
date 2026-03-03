"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, type PricingRule } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function PricingContent() {
  const params = useSearchParams();
  const courtId = parseInt(params.get("court_id") || "0");
  const courtName = params.get("name") || "Court";

  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteRuleId, setDeleteRuleId] = useState<number | null>(null);

  const [dayOfWeek, setDayOfWeek] = useState<string>("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("21:00");
  const [rate, setRate] = useState("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (courtId) loadRules();
  }, [courtId]);

  async function loadRules() {
    setLoading(true);
    try {
      const data = await api.getCourtPricing(courtId);
      setRules(data);
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createPricingRule(courtId, {
        day_of_week: dayOfWeek !== "" ? parseInt(dayOfWeek) : undefined,
        start_time: startTime,
        end_time: endTime,
        rate: parseFloat(rate),
        label: label || undefined,
      });
      setShowAdd(false);
      setRate("");
      setLabel("");
      loadRules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add rule");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleteRuleId === null) return;
    try {
      await api.deletePricingRule(courtId, deleteRuleId);
      loadRules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleteRuleId(null);
    }
  }

  if (!courtId) {
    return (
      <div className="space-y-6">
        <p className="text-slate-500">No court selected.</p>
        <Link href="/dashboard/courts"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Courts</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/courts">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pricing Rules</h1>
            <p className="text-sm text-slate-500">{courtName}</p>
          </div>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Add Rule
        </Button>
      </div>

      {showAdd && (
        <Card className="border-emerald-200">
          <CardContent className="p-6">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Day</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">All days</option>
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Start Time</label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">End Time</label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Rate (INR/hr)</label>
                  <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="1200" required min="1" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Label</label>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Peak hours" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  {saving ? "Saving..." : "Add Rule"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : rules.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No custom pricing rules. Default hourly rate applies.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Day</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Rate</th>
                  <th className="px-4 py-3 font-medium">Label</th>
                  <th className="px-4 py-3 font-medium w-16"></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">{r.day_of_week !== null ? DAYS[r.day_of_week] : "All days"}</td>
                    <td className="px-4 py-3">{r.start_time} - {r.end_time}</td>
                    <td className="px-4 py-3 font-semibold">{formatINR(r.rate)}/hr</td>
                    <td className="px-4 py-3 text-slate-500">{r.label || "-"}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteRuleId(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteRuleId !== null}
        title="Remove Pricing Rule"
        message="Are you sure you want to remove this pricing rule? The default rate will apply instead."
        confirmLabel="Yes, Remove"
        cancelLabel="Keep Rule"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteRuleId(null)}
      />
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
      <PricingContent />
    </Suspense>
  );
}
