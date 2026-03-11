"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Timer,
  FolderKanban,
  Building2,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/supabase/types";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/timer", icon: Timer, label: "Timer" },
  { href: "/projects", icon: FolderKanban, label: "Projets" },
  { href: "/clients", icon: Building2, label: "Clients" },
  { href: "/tasks", icon: CheckSquare, label: "Tâches" },
  { href: "/teams", icon: Users, label: "Équipes" },
  { href: "/reports", icon: BarChart3, label: "Rapports" },
];

interface SidebarProps {
  profile: Profile | null;
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex flex-col bg-[var(--brand-dark)] h-full shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="shrink-0">
          <Image src="/icon.svg" alt="TrackHour" width={22} height={22} className="brightness-0 invert" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="font-bold text-white text-lg whitespace-nowrap"
            >
              TrackHour
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/50 hover:text-white hover:bg-white/8"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-white/10 rounded-xl"
                  transition={{ duration: 0.2 }}
                />
              )}
              <Icon
                size={18}
                className={cn(
                  "shrink-0 relative z-10 transition-colors",
                  isActive ? "text-white" : "text-white/50 group-hover:text-white"
                )}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm font-medium whitespace-nowrap relative z-10"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-3 bg-[var(--brand-dark)] text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-3">
        <Link
          href="/parametres"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group",
            pathname === "/parametres"
              ? "bg-white/15 text-white"
              : "text-white/50 hover:text-white hover:bg-white/8"
          )}
        >
          <Settings size={18} className="shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                Paramètres
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 group"
        >
          <LogOut size={18} className="shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                Se déconnecter
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
      >
        {collapsed ? (
          <ChevronRight size={12} className="text-gray-500" />
        ) : (
          <ChevronLeft size={12} className="text-gray-500" />
        )}
      </button>
    </motion.aside>
  );
}
