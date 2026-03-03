"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuth } from "@/lib/auth-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const { isAuthenticated, initialized } = useAuth();

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) {
      router.replace("/login");
    } else {
      setChecking(false);
    }
  }, [isAuthenticated, initialized, router]);

  if (!initialized || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-xs tracking-tight text-white animate-pulse">
            TS
          </div>
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <Sidebar className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col" />
      <MobileNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
