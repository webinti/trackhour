"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
import type { Plan } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord", countKey: null },
  { href: "/timer", icon: Timer, label: "Timer", countKey: "timers" },
  { href: "/projects", icon: FolderKanban, label: "Projets", countKey: "projects" },
  { href: "/clients", icon: Building2, label: "Clients", countKey: "clients" },
  { href: "/tasks", icon: CheckSquare, label: "Tâches", countKey: "tasks" },
  { href: "/teams", icon: Users, label: "Équipes", countKey: "members" },
  { href: "/reports", icon: BarChart3, label: "Rapports", countKey: null },
] as const;

interface SidebarCounts {
  timers: number;
  projects: number;
  clients: number;
  tasks: number;
  members: number;
}

interface SidebarProps {
  profile: Profile | null;
  counts?: SidebarCounts;
  plan?: Plan;
}

export function Sidebar({ profile, counts, plan = "free" }: SidebarProps) {
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
      className="relative hidden md:flex flex-col bg-[var(--brand-dark)] h-full shrink-0 overflow-hidden"
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
                    className="text-sm font-medium whitespace-nowrap relative z-10 flex-1"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {!collapsed && item.countKey && counts && counts[item.countKey] > 0 && (
                <span className={cn(
                  "relative z-10 text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center",
                  isActive ? "bg-white/20 text-white" : "bg-white/10 text-white/60"
                )}>
                  {counts[item.countKey]}
                </span>
              )}

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

      {/* Upgrade card — free plan only */}
      <AnimatePresence>
        {!collapsed && plan === "free" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="mx-3 mb-3"
          >
            <div className="rounded-xl p-3 bg-gradient-to-br from-[var(--brand-purple)] to-[var(--brand-blue)] text-white">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70 mb-1">Plan Gratuit</p>
              <p className="text-xs text-white/80 mb-3 leading-snug">
                Débloquez les exports PDF, plus de projets et de clients.
              </p>
              <Link href="/settings?tab=abonnement" className="block w-full">
                <div className="relative overflow-hidden rounded-lg py-1.5 bg-white/20 hover:bg-white/30 transition-colors">
                  {/* Shimmer sweep toutes les 4s */}
                  <motion.span
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.5) 50%, transparent 65%)",
                    }}
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{
                      duration: 0.7,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatDelay: 3.3,
                    }}
                  />
                  <span className="relative block text-center text-xs font-bold text-white">
                    Passer à Premium ✦
                  </span>
                </div>
              </Link>
            </div>
          </motion.div>
        )}
        {!collapsed && plan !== "free" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-3 mb-3"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <span className={cn("w-2 h-2 rounded-full shrink-0", plan === "business" ? "bg-[var(--brand-yellow)]" : "bg-[var(--brand-green)]")} />
              <span className={cn("text-xs font-semibold capitalize", plan === "business" ? "text-[var(--brand-yellow)]" : "text-white/70")}>Plan {plan}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group",
            pathname === "/settings"
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
