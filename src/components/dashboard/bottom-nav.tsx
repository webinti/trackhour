"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Timer, FolderKanban, Building2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const BOTTOM_NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Accueil" },
  { href: "/timer", icon: Timer, label: "Timer" },
  { href: "/projects", icon: FolderKanban, label: "Projets" },
  { href: "/clients", icon: Building2, label: "Clients" },
  { href: "/parametres", icon: Settings, label: "Réglages" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden bg-white border-t border-gray-100 safe-area-inset-bottom">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors",
              isActive ? "text-[var(--brand-blue)]" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
