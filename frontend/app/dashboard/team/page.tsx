"use client";

import { useEffect, useState } from "react";
import { api, type User } from "@/lib/api";
import { getRole } from "@/lib/auth";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  UserPlus,
  Shield,
  X,
  Loader2,
  Power,
} from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-emerald-100 text-emerald-700",
  manager: "bg-blue-100 text-blue-700",
  staff: "bg-amber-100 text-amber-700",
  accountant: "bg-purple-100 text-purple-700",
  player: "bg-slate-100 text-slate-700",
};

export default function TeamPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const role = getRole();

  const [form, setForm] = useState({
    email: "",
    full_name: "",
    phone: "",
    role: "staff",
    password: "",
  });

  useEffect(() => {
    api.getTeam()
      .then(setMembers)
      .catch(() => toast.error("Failed to load team"))
      .finally(() => setLoading(false));
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    try {
      const user = await api.inviteUser({
        email: form.email,
        full_name: form.full_name,
        phone: form.phone || undefined,
        role: form.role,
        password: form.password,
      });
      setMembers((prev) => [...prev, user]);
      setShowInvite(false);
      setForm({ email: "", full_name: "", phone: "", role: "staff", password: "" });
      toast.success(`${user.full_name} added as ${user.role}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to invite user");
    } finally {
      setInviting(false);
    }
  }

  async function toggleActive(member: User) {
    try {
      const updated = await api.updateUser(member.id, {
        is_active: !member.is_active,
      });
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? updated : m))
      );
      toast.success(
        `${member.full_name} ${updated.is_active ? "activated" : "deactivated"}`
      );
    } catch {
      toast.error("Failed to update user");
    }
  }

  async function changeRole(member: User, newRole: string) {
    try {
      const updated = await api.updateUser(member.id, { role: newRole });
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? updated : m))
      );
      toast.success(`${member.full_name} role changed to ${newRole}`);
    } catch {
      toast.error("Failed to change role");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Team</h1>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team</h1>
          <p className="text-sm text-slate-500">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        {role === "owner" && (
          <Button
            onClick={() => setShowInvite(!showInvite)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {showInvite ? (
              <X className="h-4 w-4 mr-1.5" />
            ) : (
              <UserPlus className="h-4 w-4 mr-1.5" />
            )}
            {showInvite ? "Cancel" : "Add Member"}
          </Button>
        )}
      </div>

      {showInvite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Full Name *
                  </label>
                  <Input
                    required
                    value={form.full_name}
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                    placeholder="Ravi Kumar"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Email *
                  </label>
                  <Input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="ravi@turfstack.in"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Phone
                  </label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="9876543210"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Role *
                  </label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value })
                    }
                  >
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                    <option value="accountant">Accountant</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Password *
                  </label>
                  <Input
                    required
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="Min 6 characters"
                    minLength={6}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={inviting}
              >
                {inviting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-1.5" />
                )}
                {inviting ? "Adding..." : "Add Member"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <CardTitle className="text-lg">Team Members</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                  member.is_active
                    ? "hover:bg-slate-50"
                    : "bg-slate-50 opacity-60"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-semibold text-sm">
                    {member.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {member.full_name}
                      {!member.is_active && (
                        <span className="ml-2 text-xs text-red-500 font-normal">
                          (Deactivated)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {member.email}
                      {member.phone ? ` · ${member.phone}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {role === "owner" && member.role !== "owner" ? (
                    <select
                      className="h-8 rounded-md border text-xs px-2 bg-white"
                      value={member.role}
                      onChange={(e) => changeRole(member, e.target.value)}
                    >
                      <option value="manager">Manager</option>
                      <option value="staff">Staff</option>
                      <option value="accountant">Accountant</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        ROLE_COLORS[member.role] || ROLE_COLORS.player
                      }`}
                    >
                      <Shield className="h-3 w-3" />
                      {member.role}
                    </span>
                  )}

                  {role === "owner" && member.role !== "owner" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive(member)}
                      className={
                        member.is_active
                          ? "text-red-600 hover:bg-red-50"
                          : "text-emerald-600 hover:bg-emerald-50"
                      }
                    >
                      <Power className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-8">
                No team members yet. Click &quot;Add Member&quot; to get
                started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
