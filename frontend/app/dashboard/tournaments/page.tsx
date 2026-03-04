"use client";

import { useState, useEffect } from "react";
import { api, type Tournament } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Trophy, Calendar, Users, ChevronRight, Trash2, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  registration_open: "bg-blue-100 text-blue-700",
  registration_closed: "bg-orange-100 text-orange-700",
  in_progress: "bg-emerald-100 text-emerald-700",
  completed: "bg-purple-100 text-purple-700",
  cancelled: "bg-rose-100 text-rose-700",
};

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Single Elimination",
  double_elimination: "Double Elimination",
  round_robin: "Round Robin",
  group_knockout: "Group + Knockout",
};

const SPORTS = ["pickleball", "cricket", "badminton", "volleyball", "tennis", "football"];

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    sport: "pickleball",
    format: "single_elimination",
    start_date: "",
    end_date: "",
    registration_deadline: "",
    max_teams: "",
    entry_fee: "",
    description: "",
    contact_phone: "",
  });

  async function load() {
    setLoading(true);
    try {
      const data = await api.getTournaments();
      setTournaments(data);
    } catch {
      setTournaments([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createTournament({
        name: form.name,
        sport: form.sport,
        format: form.format,
        start_date: form.start_date,
        end_date: form.end_date || undefined,
        registration_deadline: form.registration_deadline || undefined,
        max_teams: form.max_teams ? parseInt(form.max_teams) : undefined,
        entry_fee: form.entry_fee ? parseFloat(form.entry_fee) : 0,
        description: form.description || undefined,
        contact_phone: form.contact_phone || undefined,
      });
      setShowCreate(false);
      setForm({
        name: "",
        sport: "pickleball",
        format: "single_elimination",
        start_date: "",
        end_date: "",
        registration_deadline: "",
        max_teams: "",
        entry_fee: "",
        description: "",
        contact_phone: "",
      });
      toast.success("Tournament created");
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create tournament");
    }
    setCreating(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await api.deleteTournament(deleteId);
      toast.success("Tournament deleted");
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tournaments</h1>
          <p className="text-sm text-slate-500">Manage tournaments for your facility</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Create Tournament
        </Button>
      </div>

      {showCreate && (
        <Card className="border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Create Tournament</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Name</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Summer Pickleball League"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Sport</label>
                  <select
                    value={form.sport}
                    onChange={(e) => setForm({ ...form, sport: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {SPORTS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Format</label>
                  <select
                    value={form.format}
                    onChange={(e) => setForm({ ...form, format: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {Object.entries(FORMAT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Start Date</label>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">End Date</label>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Registration Deadline</label>
                  <Input
                    type="date"
                    value={form.registration_deadline}
                    onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Max Teams</label>
                  <Input
                    type="number"
                    value={form.max_teams}
                    onChange={(e) => setForm({ ...form, max_teams: e.target.value })}
                    placeholder="Optional"
                    min="2"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Entry Fee (INR)</label>
                  <Input
                    type="number"
                    value={form.entry_fee}
                    onChange={(e) => setForm({ ...form, entry_fee: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Contact Phone</label>
                  <Input
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Any additional details..."
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={creating} className="bg-emerald-600 hover:bg-emerald-700">
                  {creating ? "Creating..." : "Create Tournament"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
      ) : tournaments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <Trophy className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-slate-500">No tournaments yet</p>
            <Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700">
              Create your first tournament
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/dashboard/tournaments/${t.id}`} className="flex-1 min-w-0 group">
                    <h3 className="font-semibold text-base truncate group-hover:text-emerald-600">
                      {t.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {t.sport.charAt(0).toUpperCase() + t.sport.slice(1)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {FORMAT_LABELS[t.format] || t.format}
                      </span>
                    </div>
                    <span
                      className={`inline-flex mt-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[t.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {t.status.replace(/_/g, " ")}
                    </span>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/dashboard/tournaments/${t.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteId(t.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <Link href={`/dashboard/tournaments/${t.id}`} className="block mt-4 pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {t.start_date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {t.team_count ?? 0} teams
                    </span>
                    <span className="font-medium text-slate-700">{formatINR(t.entry_fee)}</span>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Tournament"
        message="Are you sure you want to delete this tournament? This action cannot be undone."
        confirmLabel="Yes, Delete"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
