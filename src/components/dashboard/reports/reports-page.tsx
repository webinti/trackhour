"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  subMonths, parseISO, isAfter, isBefore, format, eachDayOfInterval, eachMonthOfInterval,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, TrendingUp, FolderKanban, Banknote, Download, Lock, Calendar, CircleDollarSign } from "lucide-react";
import { formatDuration, formatCurrency, calculateEarnings } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/utils";
import { UpgradeBanner } from "@/components/ui/upgrade-banner";

type Period = "semaine" | "mois" | "trimestre" | "annee" | "custom";
type PaidFilter = "all" | "paid" | "unpaid";

const PERIODS: { label: string; value: Period }[] = [
  { label: "Semaine", value: "semaine" },
  { label: "Mois", value: "mois" },
  { label: "Trimestre", value: "trimestre" },
  { label: "Année", value: "annee" },
];

function getPeriodRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case "semaine":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case "mois":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "trimestre": {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      const quarterStart = new Date(now.getFullYear(), quarterMonth, 1);
      const quarterEnd = endOfMonth(new Date(now.getFullYear(), quarterMonth + 2, 1));
      return { start: quarterStart, end: quarterEnd };
    }
    case "annee":
      return { start: startOfYear(now), end: endOfYear(now) };
    case "custom":
      return { start: now, end: now };
  }
}

function entryDuration(entry: any): number {
  const rawMs = new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime();
  return Math.max(0, rawMs / 1000 - (entry.paused_duration || 0));
}

interface ReportsPageProps {
  timeEntries: any[];
  plan?: Plan;
}

export function ReportsPage({ timeEntries, plan = "free" }: ReportsPageProps) {
  const [period, setPeriod] = useState<Period>("mois");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [paidFilter, setPaidFilter] = useState<PaidFilter>("all");
  const [exporting, setExporting] = useState(false);
  const [customStart, setCustomStart] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [customEnd, setCustomEnd] = useState(() => format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const projects = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string }>();
    for (const e of timeEntries) {
      if (e.project_id && e.projects?.name && !map.has(e.project_id)) {
        map.set(e.project_id, { id: e.project_id, name: e.projects.name, color: e.projects.color || "#9CA3AF" });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [timeEntries]);

  async function handleExportPDF() {
    setExporting(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { PDFReport } = await import("./pdf-document");
      const { format } = await import("date-fns");
      const { fr } = await import("date-fns/locale");

      const now = new Date();
      const periodLabels: Record<Period, string> = {
        "semaine": `Semaine du ${format(startOfWeek(now, { weekStartsOn: 1 }), "dd MMM", { locale: fr })} au ${format(endOfWeek(now, { weekStartsOn: 1 }), "dd MMM yyyy", { locale: fr })}`,
        "mois": format(now, "MMMM yyyy", { locale: fr }),
        "trimestre": `T${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`,
        "annee": `Année ${now.getFullYear()}`,
        "custom": `Du ${format(parseISO(customStart), "dd/MM/yyyy")} au ${format(parseISO(customEnd), "dd/MM/yyyy")}`,
      };

      const projectName = selectedProjectId !== "all"
        ? projects.find((p) => p.id === selectedProjectId)?.name
        : undefined;

      const blob = await pdf(
        <PDFReport
          entries={filteredEntries}
          periodLabel={periodLabels[period]}
          generatedAt={format(new Date(), "dd MMMM yyyy", { locale: fr })}
          projectLabel={projectName}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trackhour-rapport-${period}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF export error:", e);
    } finally {
      setExporting(false);
    }
  }

  const dateRange = useMemo(() => {
    if (period === "custom") {
      return {
        start: parseISO(customStart),
        end: new Date(parseISO(customEnd).getTime() + 86400000 - 1), // end of day
      };
    }
    return getPeriodRange(period);
  }, [period, customStart, customEnd]);

  const filteredEntries = useMemo(() => {
    return timeEntries.filter((e) => {
      const date = parseISO(e.started_at);
      if (isBefore(date, dateRange.start) || isAfter(date, dateRange.end)) return false;
      if (selectedProjectId !== "all" && e.project_id !== selectedProjectId) return false;
      if (paidFilter === "paid" && e.is_paid !== true) return false;
      if (paidFilter === "unpaid" && e.is_paid === true) return false;
      return true;
    });
  }, [timeEntries, dateRange, selectedProjectId, paidFilter]);

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

  // Bar chart — by day (semaine/mois/custom short) or by month (trimestre/annee/custom long)
  const chartData = useMemo(() => {
    const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / 86400000);
    const useMonths = daysDiff > 62;

    if (useMonths) {
      const months = eachMonthOfInterval({ start: dateRange.start, end: dateRange.end });
      return months.map((date) => {
        const monthStr = format(date, "yyyy-MM");
        const seconds = filteredEntries
          .filter((e) => e.started_at.startsWith(monthStr))
          .reduce((acc, e) => acc + entryDuration(e), 0);
        return {
          label: format(date, "MMM", { locale: fr }),
          heures: Math.round((seconds / 3600) * 100) / 100,
        };
      });
    } else {
      const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
      return days.map((date) => {
        const dayStr = format(date, "yyyy-MM-dd");
        const seconds = filteredEntries
          .filter((e) => e.started_at.startsWith(dayStr))
          .reduce((acc, e) => acc + entryDuration(e), 0);
        return {
          label: format(date, daysDiff <= 7 ? "EEE" : "dd/MM", { locale: fr }),
          heures: Math.round((seconds / 3600) * 100) / 100,
        };
      });
    }
  }, [filteredEntries, dateRange]);

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
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--brand-dark)]">Rapports</h1>
          <div className="flex flex-wrap items-center gap-2">
            {projects.length > 0 && (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="h-9 px-3 rounded-xl border border-[var(--border)] bg-white text-sm text-[var(--brand-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
              >
                <option value="all">Tous les projets</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
            {plan === "free" ? (
              <a
                href="/settings?tab=abonnement"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-400 bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-colors"
                title="Export PDF réservé au plan Premium"
              >
                <Lock size={15} />
                PDF
              </a>
            ) : (
              <button
                onClick={handleExportPDF}
                disabled={exporting || filteredEntries.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[var(--brand-blue)] hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Download size={15} />
                {exporting ? "Export..." : "PDF"}
              </button>
            )}
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period pills */}
          <div className="flex items-center gap-1 bg-white border border-[var(--border)] rounded-xl p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  period === p.value && period !== "custom"
                    ? "bg-[var(--brand-dark)] text-white"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date range */}
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            <input
              type="date"
              value={customStart}
              onChange={(e) => { setCustomStart(e.target.value); setPeriod("custom"); }}
              className={cn(
                "h-9 px-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]",
                period === "custom"
                  ? "border-[var(--brand-blue)] bg-blue-50 text-[var(--brand-dark)]"
                  : "border-[var(--border)] bg-white text-gray-500"
              )}
            />
            <span className="text-xs text-gray-400">→</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => { setCustomEnd(e.target.value); setPeriod("custom"); }}
              className={cn(
                "h-9 px-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]",
                period === "custom"
                  ? "border-[var(--brand-blue)] bg-blue-50 text-[var(--brand-dark)]"
                  : "border-[var(--border)] bg-white text-gray-500"
              )}
            />
          </div>

          {/* Paid/Unpaid filter */}
          <div className="flex items-center gap-1 bg-white border border-[var(--border)] rounded-xl p-1 ml-auto">
            <CircleDollarSign size={14} className="text-gray-400 ml-1.5" />
            {([
              { value: "all" as PaidFilter, label: "Tous" },
              { value: "paid" as PaidFilter, label: "Payé" },
              { value: "unpaid" as PaidFilter, label: "Non payé" },
            ]).map((f) => (
              <button
                key={f.value}
                onClick={() => setPaidFilter(f.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  paidFilter === f.value
                    ? f.value === "paid"
                      ? "bg-emerald-500 text-white"
                      : f.value === "unpaid"
                        ? "bg-amber-500 text-white"
                        : "bg-[var(--brand-dark)] text-white"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PDF upsell for free users */}
      {plan === "free" && (
        <UpgradeBanner
          variant="feature"
          message="Export PDF réservé au plan Premium — téléchargez vos rapports de facturation en un clic."
          className="mb-6"
        />
      )}

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
            Heures par {(() => {
              const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / 86400000);
              return daysDiff > 62 ? "mois" : "jour";
            })()}
          </h2>
          {filteredEntries.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
              Aucune donnée pour cette période
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={period === "annee" ? 16 : 24}>
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
