"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarPlus,
  CalendarClock,
  Trophy,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Ticket,
  GitBranch,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearAuth, getRole } from "@/lib/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["owner", "manager"],
  },
  {
    label: "Schedule",
    href: "/dashboard/schedule",
    icon: CalendarClock,
    roles: ["owner", "manager", "staff"],
  },
  {
    label: "Bookings",
    href: "/dashboard/bookings",
    icon: CalendarDays,
    roles: ["owner", "manager", "staff"],
  },
  {
    label: "Walk-in Booking",
    href: "/book",
    icon: CalendarPlus,
    roles: ["staff"],
  },
  {
    label: "Book a Court",
    href: "/book",
    icon: CalendarPlus,
    roles: ["player"],
  },
  {
    label: "My Bookings",
    href: "/dashboard/my-bookings",
    icon: Ticket,
    roles: ["player"],
  },
  {
    label: "Courts",
    href: "/dashboard/courts",
    icon: Trophy,
    roles: ["owner", "manager"],
  },
  {
    label: "Equipment",
    href: "/dashboard/equipment",
    icon: Package,
    roles: ["owner", "manager", "staff"],
  },
  {
    label: "Revenue",
    href: "/dashboard/revenue",
    icon: BarChart3,
    roles: ["owner", "manager", "accountant"],
  },
  {
    label: "Team",
    href: "/dashboard/team",
    icon: Users,
    roles: ["owner"],
  },
  {
    label: "Branches",
    href: "/dashboard/branches",
    icon: GitBranch,
    roles: ["owner"],
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["owner", "manager"],
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = getRole() || "player";

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <div
      className={cn("flex w-64 flex-col bg-slate-900 text-white", className)}
    >
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-slate-700">
        <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-xs tracking-tight">
          TS
        </div>
        <span className="text-lg font-bold tracking-tight">TurfStack</span>
      </div>

      <div className="px-4 pt-4 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {role === "player" ? "Player" : role === "accountant" ? "Accounts" : "Management"}
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 pb-4">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-700 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="Sign out of your account"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
