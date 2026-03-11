"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Trash2, Pencil } from "lucide-react";
import { formatDuration, formatCurrency, calculateEarnings } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TimerPageProps {
  timeEntries: any[];
}

function groupEntriesByDate(entries: any[]) {
  const groups: Record<string, any[]> = {};
  for (const entry of entries) {
    const date = entry.started_at.split("T")[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(entry);
  }
  return groups;
}

function formatGroupDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Aujourd'hui";
  if (isYesterday(date)) return "Hier";
  return format(date, "EEEE d MMMM", { locale: fr });
}

export function TimerPage({ timeEntries }: TimerPageProps) {
  const supabase = createClient();
  const [entries, setEntries] = useState(timeEntries);

  const handleDeleteEntry = useCallback(async (id: string) => {
    await supabase.from("time_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, [supabase]);

  const grouped = groupEntriesByDate(entries);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Time entries list */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([date, dayEntries]) => {
          const totalSeconds = dayEntries.reduce((acc, entry) => {
            const duration = (new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime()) / 1000;
            return acc + duration;
          }, 0);

          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Date header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-sm font-bold text-[var(--brand-dark)] capitalize">
                  {formatGroupDate(date)}
                </span>
                <span className="text-sm font-mono font-semibold text-gray-500">
                  {formatDuration(Math.floor(totalSeconds))}
                </span>
              </div>

              {/* Entries */}
              <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
                {dayEntries.map((entry, idx) => {
                  const duration = (new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime()) / 1000;
                  const earnings = entry.tasks?.daily_rate
                    ? calculateEarnings(duration, entry.tasks.daily_rate)
                    : null;

                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 group hover:bg-gray-50 transition-colors",
                        idx < dayEntries.length - 1 && "border-b border-gray-50"
                      )}
                    >
                      {/* Project color */}
                      {entry.projects?.color && (
                        <div
                          className="w-1 h-8 rounded-full shrink-0"
                          style={{ backgroundColor: entry.projects.color }}
                        />
                      )}

                      {/* Description */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--brand-dark)] truncate">
                          {entry.tasks?.name || entry.description || (
                            <span className="text-gray-400 italic">Sans titre</span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {entry.projects && (
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${entry.projects.color}20`,
                                color: entry.projects.color,
                              }}
                            >
                              {entry.projects.name}
                            </span>
                          )}
                          {entry.projects?.clients?.name && (
                            <span className="text-xs text-gray-400">
                              {entry.projects.clients.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Earnings */}
                      {earnings !== null && (
                        <span className="text-xs font-semibold text-[var(--brand-green)] hidden sm:block">
                          {formatCurrency(earnings)}
                        </span>
                      )}

                      {/* Duration */}
                      <span className="text-sm font-mono font-bold text-[var(--brand-dark)] w-20 text-right">
                        {formatDuration(Math.floor(duration))}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        {entries.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Play size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucune entrée pour l&apos;instant</p>
            <p className="text-sm mt-1">Démarrez votre premier timer ci-dessus</p>
          </div>
        )}
      </div>
    </div>
  );
}
