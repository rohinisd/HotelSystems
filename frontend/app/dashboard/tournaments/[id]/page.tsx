"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api, type Tournament, type TournamentTeam, type TournamentMatch } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Trophy,
  Users,
  GitBranch,
  Settings,
  Plus,
  Trash2,
  Play,
  Check,
  ChevronRight,
  X,
  Pencil,
} from "lucide-react";
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

export default function TournamentDetailPage() {
  const params = useParams();
  const tournamentId = Number(params.id);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [tab, setTab] = useState<"overview" | "teams" | "bracket">("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [withdrawId, setWithdrawId] = useState<number | null>(null);
  const [generatingBracket, setGeneratingBracket] = useState(false);
  const [editMatchId, setEditMatchId] = useState<number | null>(null);
  const [matchScoreForm, setMatchScoreForm] = useState({ score_team1: "", score_team2: "" });

  const [editForm, setEditForm] = useState({
    name: "",
    sport: "",
    format: "",
    start_date: "",
    end_date: "",
    registration_deadline: "",
    max_teams: "",
    entry_fee: "",
    description: "",
    contact_phone: "",
  });

  const [teamForm, setTeamForm] = useState({
    team_name: "",
    player1_name: "",
    player1_phone: "",
    player1_email: "",
    player2_name: "",
    player2_phone: "",
  });

  async function load() {
    if (!tournamentId || isNaN(tournamentId)) return;
    setLoading(true);
    try {
      const [t, tms, m] = await Promise.all([
        api.getTournament(tournamentId),
        api.getTournamentTeams(tournamentId),
        api.getTournamentMatches(tournamentId),
      ]);
      setTournament(t);
      setTeams(tms);
      setMatches(m);
      setEditForm({
        name: t.name,
        sport: t.sport,
        format: t.format,
        start_date: t.start_date,
        end_date: t.end_date || "",
        registration_deadline: t.registration_deadline || "",
        max_teams: t.max_teams ? String(t.max_teams) : "",
        entry_fee: String(t.entry_fee),
        description: t.description || "",
        contact_phone: t.contact_phone || "",
      });
    } catch {
      setTournament(null);
      setTeams([]);
      setMatches([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [tournamentId]);

  async function handleUpdateTournament(e: React.FormEvent) {
    e.preventDefault();
    if (!tournament) return;
    setSaving(true);
    try {
      const updated = await api.updateTournament(tournamentId, {
        name: editForm.name,
        sport: editForm.sport,
        format: editForm.format,
        start_date: editForm.start_date,
        end_date: editForm.end_date || undefined,
        registration_deadline: editForm.registration_deadline || undefined,
        max_teams: editForm.max_teams ? parseInt(editForm.max_teams) : undefined,
        entry_fee: parseFloat(editForm.entry_fee) || 0,
        description: editForm.description || undefined,
        contact_phone: editForm.contact_phone || undefined,
      });
      setTournament(updated);
      setShowEdit(false);
      toast.success("Tournament updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
    setSaving(false);
  }

  async function handleStatusChange(newStatus: string) {
    if (!tournament) return;
    setSaving(true);
    try {
      const updated = await api.updateTournament(tournamentId, { status: newStatus });
      setTournament(updated);
      toast.success(`Status updated to ${newStatus.replace(/_/g, " ")}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Status update failed");
    }
    setSaving(false);
  }

  async function handleAddTeam(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.registerTeam(tournamentId, {
        team_name: teamForm.team_name,
        player1_name: teamForm.player1_name,
        player1_phone: teamForm.player1_phone || undefined,
        player1_email: teamForm.player1_email || undefined,
        player2_name: teamForm.player2_name || undefined,
        player2_phone: teamForm.player2_phone || undefined,
      });
      setTeamForm({
        team_name: "",
        player1_name: "",
        player1_phone: "",
        player1_email: "",
        player2_name: "",
        player2_phone: "",
      });
      setShowAddTeam(false);
      load();
      toast.success("Team registered");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    }
    setSaving(false);
  }

  async function handleWithdraw() {
    if (!withdrawId) return;
    try {
      await api.withdrawTeam(tournamentId, withdrawId);
      load();
      toast.success("Team withdrawn");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Withdraw failed");
    }
    setWithdrawId(null);
  }

  async function handleGenerateBracket() {
    setGeneratingBracket(true);
    try {
      const result = await api.generateBracket(tournamentId);
      setMatches(result.matches);
      if (tournament) setTournament({ ...tournament, status: result.status });
      load();
      toast.success("Bracket generated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Bracket generation failed");
    }
    setGeneratingBracket(false);
  }

  async function handleUpdateMatch() {
    if (!editMatchId) return;
    const m = matches.find((x) => x.id === editMatchId);
    if (!m) return;
    setSaving(true);
    try {
      const updated = await api.updateMatch(tournamentId, editMatchId, {
        score_team1: matchScoreForm.score_team1 || undefined,
        score_team2: matchScoreForm.score_team2 || undefined,
        status: "completed",
      });
      setMatches((prev) => prev.map((x) => (x.id === editMatchId ? updated : x)));
      setEditMatchId(null);
      setMatchScoreForm({ score_team1: "", score_team2: "" });
      toast.success("Match updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
    setSaving(false);
  }

  function openMatchEdit(m: TournamentMatch) {
    setEditMatchId(m.id);
    setMatchScoreForm({
      score_team1: m.score_team1 || "",
      score_team2: m.score_team2 || "",
    });
  }

  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const matchesByRound = rounds.map((r) => ({
    round: r,
    matches: matches.filter((m) => m.round === r),
  }));

  if (loading && !tournament) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-64 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="space-y-6">
        <p className="text-slate-500">Tournament not found</p>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Settings },
    { id: "teams" as const, label: "Teams", icon: Users },
    { id: "bracket" as const, label: "Bracket", icon: GitBranch },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{tournament.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {tournament.sport.charAt(0).toUpperCase() + tournament.sport.slice(1)}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {FORMAT_LABELS[tournament.format] || tournament.format}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_COLORS[tournament.status] || "bg-slate-100 text-slate-700"
              }`}
            >
              {tournament.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {tournament.status === "draft" && (
              <Button
                size="sm"
                onClick={() => handleStatusChange("registration_open")}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Open Registration
              </Button>
            )}
            {tournament.status === "registration_open" && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("registration_closed")}
                  disabled={saving}
                  variant="outline"
                >
                  Close Registration
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("in_progress")}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Start Tournament
                </Button>
              </>
            )}
            {tournament.status === "registration_closed" && (
              <Button
                size="sm"
                onClick={() => handleStatusChange("in_progress")}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Start Tournament
              </Button>
            )}
            {(tournament.status === "in_progress" || tournament.status === "registration_closed") && (
              <Button
                size="sm"
                onClick={() => handleStatusChange("completed")}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Check className="h-4 w-4 mr-1" /> Complete
              </Button>
            )}
            {tournament.status !== "cancelled" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("cancelled")}
                disabled={saving}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Cancel Tournament
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowEdit(true)}>
              <Pencil className="h-4 w-4 mr-1" /> Edit Details
            </Button>
          </div>

          {showEdit && (
            <Card className="border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Edit Tournament</h2>
                  <Button variant="ghost" size="icon" onClick={() => setShowEdit(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <form onSubmit={handleUpdateTournament} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Name</label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Sport</label>
                      <select
                        value={editForm.sport}
                        onChange={(e) => setEditForm({ ...editForm, sport: e.target.value })}
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
                        value={editForm.format}
                        onChange={(e) => setEditForm({ ...editForm, format: e.target.value })}
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
                        value={editForm.start_date}
                        onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">End Date</label>
                      <Input
                        type="date"
                        value={editForm.end_date}
                        onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Registration Deadline</label>
                      <Input
                        type="date"
                        value={editForm.registration_deadline}
                        onChange={(e) =>
                          setEditForm({ ...editForm, registration_deadline: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Max Teams</label>
                      <Input
                        type="number"
                        value={editForm.max_teams}
                        onChange={(e) => setEditForm({ ...editForm, max_teams: e.target.value })}
                        min="2"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Entry Fee (INR)</label>
                      <Input
                        type="number"
                        value={editForm.entry_fee}
                        onChange={(e) => setEditForm({ ...editForm, entry_fee: e.target.value })}
                        min="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Contact Phone</label>
                      <Input
                        value={editForm.contact_phone}
                        onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-medium text-slate-600">Dates:</span> {tournament.start_date}
                {tournament.end_date && ` – ${tournament.end_date}`}
              </p>
              {tournament.registration_deadline && (
                <p>
                  <span className="font-medium text-slate-600">Registration deadline:</span>{" "}
                  {tournament.registration_deadline}
                </p>
              )}
              <p>
                <span className="font-medium text-slate-600">Entry fee:</span> {formatINR(tournament.entry_fee)}
              </p>
              {tournament.max_teams && (
                <p>
                  <span className="font-medium text-slate-600">Max teams:</span> {tournament.max_teams}
                </p>
              )}
              {tournament.description && (
                <p>
                  <span className="font-medium text-slate-600">Description:</span> {tournament.description}
                </p>
              )}
              {tournament.contact_phone && (
                <p>
                  <span className="font-medium text-slate-600">Contact:</span> {tournament.contact_phone}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "teams" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {teams.length} team{teams.length !== 1 ? "s" : ""} registered
            </p>
            {(tournament.status === "draft" || tournament.status === "registration_open") && (
              <Button onClick={() => setShowAddTeam(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" /> Add Team
              </Button>
            )}
          </div>

          {showAddTeam && (
            <Card className="border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Register Team</h2>
                  <Button variant="ghost" size="icon" onClick={() => setShowAddTeam(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <form onSubmit={handleAddTeam} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Team Name</label>
                      <Input
                        value={teamForm.team_name}
                        onChange={(e) => setTeamForm({ ...teamForm, team_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Player 1 Name</label>
                      <Input
                        value={teamForm.player1_name}
                        onChange={(e) => setTeamForm({ ...teamForm, player1_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Player 1 Phone</label>
                      <Input
                        value={teamForm.player1_phone}
                        onChange={(e) => setTeamForm({ ...teamForm, player1_phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Player 1 Email</label>
                      <Input
                        type="email"
                        value={teamForm.player1_email}
                        onChange={(e) => setTeamForm({ ...teamForm, player1_email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Player 2 Name</label>
                      <Input
                        value={teamForm.player2_name}
                        onChange={(e) => setTeamForm({ ...teamForm, player2_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Player 2 Phone</label>
                      <Input
                        value={teamForm.player2_phone}
                        onChange={(e) => setTeamForm({ ...teamForm, player2_phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                      {saving ? "Registering..." : "Register Team"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddTeam(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {teams.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No teams registered yet</p>
                {(tournament.status === "draft" || tournament.status === "registration_open") && (
                  <Button
                    onClick={() => setShowAddTeam(true)}
                    className="mt-3 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Add first team
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {teams.map((team) => (
                <Card key={team.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{team.team_name}</p>
                      <p className="text-sm text-slate-500">
                        {team.player1_name}
                        {team.player2_name && ` & ${team.player2_name}`}
                      </p>
                      {team.seed != null && (
                        <span className="text-xs text-slate-400">Seed: {team.seed}</span>
                      )}
                    </div>
                    {(tournament.status === "draft" || tournament.status === "registration_open") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setWithdrawId(team.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Withdraw
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "bracket" && (
        <div className="space-y-6">
          {(tournament.status === "registration_closed" || tournament.status === "in_progress") &&
            matches.length === 0 && (
              <Button
                onClick={handleGenerateBracket}
                disabled={generatingBracket || teams.length < 2}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Play className="h-4 w-4 mr-2" />
                {generatingBracket ? "Generating..." : "Generate Bracket"}
              </Button>
            )}

          {teams.length < 2 && matches.length === 0 && (
            <p className="text-sm text-slate-500">Need at least 2 teams to generate a bracket</p>
          )}

          {matches.length > 0 && (
            <div className="overflow-x-auto">
              <div className="flex gap-8 min-w-max pb-4">
                {matchesByRound.map(({ round, matches: roundMatches }) => (
                  <div key={round} className="flex flex-col gap-4 min-w-[200px]">
                    <h3 className="text-sm font-semibold text-slate-600 sticky top-0 bg-white py-2">
                      Round {round}
                    </h3>
                    <div className="flex flex-col gap-4">
                      {roundMatches.map((m) => (
                        <Card key={m.id} className="w-[200px]">
                          <CardContent className="p-3 space-y-2">
                            {editMatchId === m.id ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Input
                                    placeholder="Score"
                                    value={matchScoreForm.score_team1}
                                    onChange={(e) =>
                                      setMatchScoreForm({ ...matchScoreForm, score_team1: e.target.value })
                                    }
                                    className="h-8 text-sm"
                                  />
                                  <span className="text-slate-400">-</span>
                                  <Input
                                    placeholder="Score"
                                    value={matchScoreForm.score_team2}
                                    onChange={(e) =>
                                      setMatchScoreForm({ ...matchScoreForm, score_team2: e.target.value })
                                    }
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    className="flex-1 h-7 text-xs"
                                    onClick={handleUpdateMatch}
                                    disabled={saving}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      setEditMatchId(null);
                                      setMatchScoreForm({ score_team1: "", score_team2: "" });
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="text-sm">
                                  <p
                                    className={`truncate ${
                                      m.winner_id === m.team1_id ? "font-semibold" : "text-slate-600"
                                    }`}
                                  >
                                    {m.team1_name || "TBD"}
                                  </p>
                                  <p
                                    className={`truncate ${
                                      m.winner_id === m.team2_id ? "font-semibold" : "text-slate-600"
                                    }`}
                                  >
                                    {m.team2_name || "TBD"}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-500">
                                    {m.score_team1 ?? "-"} - {m.score_team2 ?? "-"}
                                  </span>
                                  {tournament.status === "in_progress" &&
                                    m.status !== "completed" &&
                                    (m.team1_id || m.team2_id) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={() => openMatchEdit(m)}
                                      >
                                        Enter score
                                      </Button>
                                    )}
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {matches.length === 0 && tournament.status !== "draft" && tournament.status !== "registration_open" && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <GitBranch className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No bracket generated yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <ConfirmDialog
        open={withdrawId !== null}
        title="Withdraw Team"
        message="Are you sure you want to withdraw this team from the tournament?"
        confirmLabel="Yes, Withdraw"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={handleWithdraw}
        onCancel={() => setWithdrawId(null)}
      />
    </div>
  );
}
