"use client";

import { X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} role="button" aria-label="Close navigation" tabIndex={-1} />
      <div className="fixed inset-y-0 left-0 w-64 animate-in slide-in-from-left">
        <div className="relative h-full">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-3 text-white hover:bg-slate-800 z-10"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </Button>
          <Sidebar className="h-full" />
        </div>
      </div>
    </div>
  );
}
