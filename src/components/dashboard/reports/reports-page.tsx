"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { subDays, subMonths, parseISO, isAfter, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, TrendingUp, FolderKanban, Banknote } from "lucide-react";
import { formatDuration, formatCurrency, calculateEarnings } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Period = "7j" | "30j" | "3m" | "12m";

const PERIODS: { label: string; value: Period }[] = [
  { label: "7 jours", value: "7j" },
  { label: "30 jours", value: "30j" },
  { label: "3 mois", value: "3m" },
  { label: "12 mois", value: "12m" },
];

function getPeriodStart(period: Period): Date {
  const now = new Date();
  switch (period) {
    case "7j": return subDays(now, 7);
    case "30j": return subDays(now, 30);
    case "3m": return subMonths(now, 3);
    case "12m": return subMonths(now, 12);
  }
}

function entryDuration(entry: any): number {
  const rawMs = new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime();
  return Math.max(0, rawMs / 1000 - (entry.paused_duration || 0));
}

interface ReportsPageProps {
  timeEntries: any[];
}

export function ReportsPage({ timeEntries }: ReportsPageProps) {
  const [period, setPeriod] = useState<Period>("30j");

  const filteredEntries = useMemo(() => {
    const start = getPeriodStart(period);
    return timeEntries.filter((e) => isAfter(parseISO(e.started_at), start));
  }, [timeEntries, period]);

  const totalSeconds = useMemo(
    () => filteredEntries.reduce((acc, e) => acc + entryDuration(e), 0),
    [filteredEntries]
  );

  const totalEarnings = useMemo(
    () => filteredEntries.reduce((acc, e) => {
      const rate = e.hourly_rate ?? e.tasks?.hourly_rate;
      if (!rate) return acc;
      return acc + calculateEarnings(entryDuration(e), rate);
    }, 0),
    [filteredEntries]
  );

  const activeProjects = useMemo(() => {
    const ids = new Set(filteredEntries.map((e) => e.project_id).filter(Boolean));
    return ids.size;
  }, [filteredEntries]);

  const avgRate = useMemo(() => {
    const withRate = filteredEntries.filter((e) => e.hourly_rate ?? e.tasks?.hourly_rate);
    if (withRate.length === 0) return 0;
    const sum = withRate.reduce((acc, e) => acc + (e.hourly_rate ?? e.tasks?.hourly_rate), 0);
    return sum / withRate.length;
  }, [filteredEntries]);

  // Bar chart — by day (7j/30j) or by month (3m/12m)
  const chartData = useMemo(() => {
    if (period === "7j" || period === "30j") {
      const days = period === "7j" ? 7 : 30;
      return Array.from({ length: days }, (_, i) => {
        const date = subDays(new Date(), days - 1 - i);
        const dayStr = format(date, "yyyy-MM-dd");
        const seconds = filteredEntries
          .filter((e) => e.started_at.startsWith(dayStr))
          .reduce((acc, e) => acc + entryDuration(e), 0);
        return {
          label: format(date, period === "7j" ? "EEE" : "dd/MM", { locale: fr }),
          heures: Math.round((seconds / 3600) * 100) / 100,
        };
      });
    } else {
      const months = period === "3m" ? 3 : 12;
      return Array.from({ length: months }, (_, i) => {
        const date = subMonths(new Date(), months - 1 - i);
        const monthStr = format(date, "yyyy-MM");
        const seconds = filteredEntries
          .filter((e) => e.started_at.startsWith(monthStr))
          .reduce((acc, e) => acc + entryDuration(e), 0);
        return {
          label: format(date, "MMM", { locale: fr }),
          heures: Math.round((seconds / 3600) * 100) / 100,
        };
      });
    }
  }, [filteredEntries, period]);

  // By project
  const projectStats = useMemo(() => {
    const map: Record<string, { name: string; color: string; seconds: number; earnings: number }> = {};
    for (const entry of filteredEntries) {
      const key = entry.project_id || "__none__";
      const name = entry.projects?.name || "Sans projet";
      const color = entry.projects?.color || "#9CA3AF";
      const seconds = entryDuration(entry);
      const rate = entry.hourly_rate ?? entry.tasks?.hourly_rate;
      const earnings = rate ? calculateEarnings(seconds, rate) : 0;
      if (!map[key]) map[key] = { name, color, seconds: 0, earnings: 0 };
      map[key].seconds += seconds;
      map[key].earnings += earnings;
    }
    return Object.values(map).sort((a, b) => b.seconds - a.seconds);
  }, [filteredEntries]);

  const maxProjectSeconds = projectStats[0]?.seconds || 1;

  const STAT_CARDS = [
    {
      label: "Heures travaillées",
      value: formatDuration(Math.floor(totalSeconds)),
      icon: Clock,
      color: "text-[var(--brand-blue)]",
      bg: "bg-blue-50",
    },
    {
      label: "Revenus générés",
      value: formatCurrency(totalEarnings),
      icon: TrendingUp,
      color: "text-[var(--brand-green)]",
      bg: "bg-emerald-50",
    },
    {
      label: "Projets actifs",
      value: String(activeProjects),
      icon: FolderKanban,
      color: "text-[var(--brand-purple)]",
      bg: "bg-purple-50",
    },
    {
      label: "Taux moyen",
      value: avgRate > 0 ? `${Math.round(avgRate)}€/h` : "—",
      icon: Banknote,
      color: "text-[var(--brand-pink)]",
      bg: "bg-pink-50",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[var(--brand-dark)]">Rapports</h1>
        <div className="flex items-center gap-1 bg-white border border-[var(--border)] rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                period === p.value
                  ? "bg-[var(--brand-dark)] text-white"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-[var(--border)] p-5"
          >
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", card.bg)}>
              <card.icon size={18} className={card.color} />
            </div>
            <p className="text-2xl font-bold text-[var(--brand-dark)] font-mono">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[var(--border)] p-6">
          <h2 className="text-sm font-bold text-[var(--brand-dark)] mb-5">
            Heures par {period === "7j" || period === "30j" ? "jour" : "mois"}
          </h2>
          {filteredEntries.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
              Aucune donnée pour cette période
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={period === "12m" ? 16 : 24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}h`}
                />
                <Tooltip
                  formatter={(value) => [`${value}h`, "Heures"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #E5E5E5", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  cursor={{ fill: "#F2F2F2" }}
                />
                <Bar dataKey="heures" fill="var(--brand-blue)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By project */}
        <div className="bg-white rounded-2xl border border-[var(--border)] p-6">
          <h2 className="text-sm font-bold text-[var(--brand-dark)] mb-5">Par projet</h2>
          {projectStats.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="space-y-4">
              {projectStats.map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-xs font-medium text-[var(--brand-dark)] truncate max-w-[110px]">
                        {p.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-gray-500">
                      {formatDuration(Math.floor(p.seconds))}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(p.seconds / maxProjectSeconds) * 100}%`,
                        backgroundColor: p.color,
                      }}
                    />
                  </div>
                  {p.earnings > 0 && (
                    <p className="text-xs text-right text-[var(--brand-green)] mt-0.5">
                      {formatCurrency(p.earnings)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
