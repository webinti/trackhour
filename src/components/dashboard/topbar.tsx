"use client";

import Image from "next/image";
import Link from "next/link";
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

  const Avatar = () => (
    <Link href="/parametres">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-purple)] flex items-center justify-center shrink-0">
        <span className="text-white text-xs font-bold">{initials}</span>
      </div>
    </Link>
  );

  return (
    <header className="bg-white border-b border-gray-100 shrink-0">
      {/* Mobile: logo row */}
      <div className="flex md:hidden items-center justify-between px-4 h-12 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <Image src="/icon.svg" alt="TrackHour" width={18} height={18} />
          <span className="font-bold text-sm text-[var(--brand-dark)]">TrackHour</span>
        </div>
        <Avatar />
      </div>

      {/* Timer row — full width on mobile, with desktop avatar on right */}
      <div className="flex items-center h-14 md:h-16 px-2 md:px-4 gap-2">
        <HeaderTimer />
        {/* Desktop-only avatar */}
        <div className="hidden md:flex items-center gap-2 shrink-0 pl-2">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-[var(--brand-dark)] leading-none">
              {profile?.full_name || "Utilisateur"}
            </p>
          </div>
          <Avatar />
        </div>
      </div>
    </header>
  );
}
