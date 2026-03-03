"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type User } from "@/lib/api";
import { getRole } from "@/lib/auth";

interface TopbarProps {
  onMenuClick: () => void;
}

const roleLabels: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  staff: "Staff",
  accountant: "Accountant",
  player: "Player",
};

const roleColors: Record<string, string> = {
  owner: "bg-emerald-100 text-emerald-700",
  manager: "bg-blue-100 text-blue-700",
  staff: "bg-amber-100 text-amber-700",
  accountant: "bg-purple-100 text-purple-700",
  player: "bg-slate-100 text-slate-700",
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const role = getRole() || "player";

  useEffect(() => {
    api.getMe().then(setUser).catch(() => {});
  }, []);

  const initials = user
    ? user.full_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "..";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-6 w-6" />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <span
          className={`hidden sm:inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleColors[role] || roleColors.player}`}
        >
          {roleLabels[role] || role}
        </span>
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-slate-700">
            {user?.full_name || "Loading..."}
          </p>
          <p className="text-xs text-slate-500">{user?.email || ""}</p>
        </div>
        <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm">
          {initials}
        </div>
      </div>
    </header>
  );
}
