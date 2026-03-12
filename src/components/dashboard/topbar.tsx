"use client";

import type { Profile } from "@/lib/supabase/types";
import { HeaderTimer } from "@/components/dashboard/header-timer";

interface TopBarProps {
  profile: Profile | null;
}

export function TopBar({ profile }: TopBarProps) {
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 3)
    .join("")
    .toUpperCase() || "?";

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 shrink-0 gap-4">
      {/* Timer central */}
      <HeaderTimer />

      {/* Right side */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-purple)] flex items-center justify-center">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-[var(--brand-dark)] leading-none">
              {profile?.full_name || "Utilisateur"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
