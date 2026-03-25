"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Trash2, Pencil, Check, X, ChevronDown, Clock } from "lucide-react";
import { formatDuration, formatCurrency, calculateEarnings } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TimerPageProps {
  timeEntries: any[];
  userId: string;
}

type FilterType = "all" | "paid" | "unpaid";

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

export function TimerPage({ timeEntries, userId }: TimerPageProps) {
  const supabase = createClient();
  const [entries, setEntries] = useState(timeEntries);

  useEffect(() => {
    const channel = supabase
      .channel("timer-entries-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "time_entries", filter: `user_id=eq.${userId}` },
        async () => {
          const { data } = await supabase
            .from("time_entries")
            .select(`*, projects(id, name, color, clients(name)), tasks(id, name, hourly_rate)`)
            .eq("user_id", userId)
            .not("ended_at", "is", null)
            .order("started_at", { ascending: false })
            .limit(50);
          if (data) setEntries(data);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase]);

  const [filter, setFilter] = useState<FilterType>("all");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editRate, setEditRate] = useState<string>("");
  const [editStartedAt, setEditStartedAt] = useState<string>("");
  const [editEndedAt, setEditEndedAt] = useState<string>("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteEntry = useCallback(async (id: string) => {
    await supabase.from("time_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setConfirmDeleteId(null);
  }, [supabase]);

  const toLocalDatetime = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleStartEdit = useCallback((entry: any) => {
    setEditingId(entry.id);
    setEditDescription(entry.description || "");
    const rate = entry.hourly_rate ?? entry.tasks?.hourly_rate ?? null;
    setEditRate(rate != null ? rate.toString() : "");
    setEditStartedAt(toLocalDatetime(entry.started_at));
    setEditEndedAt(toLocalDatetime(entry.ended_at));
    setTimeout(() => editInputRef.current?.focus(), 0);
  }, []);

  const handleSaveEdit = useCallback(async (id: string) => {
    const parsedRate = parseFloat(editRate);
    const hourly_rate = !isNaN(parsedRate) && parsedRate > 0 ? parsedRate : null;
    const started_at = editStartedAt ? new Date(editStartedAt).toISOString() : undefined;
    const ended_at = editEndedAt ? new Date(editEndedAt).toISOString() : undefined;
    if (started_at && ended_at && new Date(ended_at) <= new Date(started_at)) return;
    const updates: Record<string, any> = { description: editDescription || null, hourly_rate };
    if (started_at) updates.started_at = started_at;
    if (ended_at) updates.ended_at = ended_at;
    await supabase.from("time_entries").update(updates).eq("id", id);
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, ...updates } : e));
    setEditingId(null);
  }, [supabase, editDescription, editRate, editStartedAt, editEndedAt]);

  const handleCancelEdit = useCallback(() => { setEditingId(null); }, []);

  const handleTogglePaid = useCallback(async (id: string, currentValue: boolean) => {
    const newValue = !currentValue;
    await supabase.from("time_entries").update({ is_paid: newValue }).eq("id", id);
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, is_paid: newValue } : e));
  }, [supabase]);

  const projects = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string }>();
    for (const e of entries) {
      if (e.projects && !map.has(e.projects.id)) map.set(e.projects.id, e.projects);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [entries]);

  const filteredEntries = entries.filter((e) => {
    if (filter === "paid" && e.is_paid !== true) return false;
    if (filter === "unpaid" && e.is_paid === true) return false;
    if (projectFilter && e.projects?.id !== projectFilter) return false;
    return true;
  });

  const grouped = groupEntriesByDate(filteredEntries);

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: "all", label: "Tous" },
    { key: "unpaid", label: "Non payés" },
    { key: "paid", label: "Payés" },
  ];

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {filterButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              filter === key
                ? "bg-[var(--brand-blue)] text-white shadow-sm"
                : "bg-white text-gray-500 border border-[var(--border)] hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
            )}
          >
            {key === "paid" && <span className="inline-block w-2 h-2 rounded-full bg-[var(--brand-green)] mr-1.5 align-middle" />}
            {key === "unpaid" && <span className="inline-block w-2 h-2 rounded-full bg-gray-300 mr-1.5 align-middle" />}
            {label}
          </button>
        ))}

        {projects.length > 0 && <span className="w-px h-5 bg-gray-200 mx-1" />}

        {projects.length > 0 && (
          <div className="relative">
            <select
              value={projectFilter ?? ""}
              onChange={(e) => setProjectFilter(e.target.value || null)}
              className={cn(
                "appearance-none pl-3 pr-7 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer focus:outline-none",
                projectFilter
                  ? "border-[var(--brand-blue)] text-[var(--brand-blue)] bg-blue-50"
                  : "border-[var(--border)] text-gray-500 bg-white hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
              )}
            >
              <option value="">Tous les projets</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            {projectFilter && (
              <span
                className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                style={{ backgroundColor: projects.find((p) => p.id === projectFilter)?.color ?? "var(--brand-blue)" }}
              />
            )}
          </div>
        )}
      </div>

      {/* Time entries list */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {Object.entries(grouped).map(([date, dayEntries]) => {
            const totalSeconds = dayEntries.reduce((acc, entry) => {
              const rawMs = new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime();
              return acc + Math.max(0, rawMs / 1000 - (entry.paused_duration || 0));
            }, 0);
            const totalEarnings = dayEntries.reduce((acc, entry) => {
              const rate = entry.hourly_rate ?? entry.tasks?.hourly_rate;
              if (!rate) return acc;
              const rawMs = new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime();
              const duration = Math.max(0, rawMs / 1000 - (entry.paused_duration || 0));
              return acc + calculateEarnings(duration, rate);
            }, 0);

            return (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                layout
              >
                {/* Date header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-sm font-bold text-[var(--brand-dark)] capitalize">
                    {formatGroupDate(date)}
                  </span>
                  <div className="flex items-center gap-3">
                    {totalEarnings > 0 && (
                      <span className="text-sm font-semibold text-[var(--brand-green)]">
                        {formatCurrency(totalEarnings)}
                      </span>
                    )}
                    <span className="text-sm font-mono font-semibold text-gray-400">
                      {formatDuration(Math.floor(totalSeconds))}
                    </span>
                  </div>
                </div>

                {/* Entries */}
                <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden divide-y divide-gray-50">
                  {dayEntries.map((entry) => {
                    const rawMs = new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime();
                    const duration = Math.max(0, rawMs / 1000 - (entry.paused_duration || 0));
                    const entryRate = entry.hourly_rate ?? entry.tasks?.hourly_rate ?? null;
                    const earnings = entryRate ? calculateEarnings(duration, entryRate) : null;
                    const isPaid = entry.is_paid === true;
                    const isEditing = editingId === entry.id;
                    const isConfirmDelete = confirmDeleteId === entry.id;

                    return (
                      <motion.div key={entry.id} layout className="group">
                        <div className="flex items-stretch gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors">
                          {/* Project color bar */}
                          {entry.projects?.color && (
                            <div
                              className="w-1 rounded-full shrink-0 self-stretch"
                              style={{ backgroundColor: entry.projects.color }}
                            />
                          )}

                          {/* Main content */}
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              /* Edit mode */
                              <div className="space-y-2">
                                <input
                                  ref={editInputRef}
                                  type="text"
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveEdit(entry.id);
                                    if (e.key === "Escape") handleCancelEdit();
                                  }}
                                  placeholder="Description..."
                                  className="w-full text-sm font-medium text-[var(--brand-dark)] bg-gray-50 border border-[var(--brand-blue)] rounded-lg px-3 py-1.5 focus:outline-none"
                                />
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5">
                                    <Clock size={12} className="text-gray-400 shrink-0" />
                                    <input
                                      type="datetime-local"
                                      value={editStartedAt}
                                      onChange={(e) => setEditStartedAt(e.target.value)}
                                      className="text-xs text-[var(--brand-dark)] bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[var(--brand-blue)]"
                                    />
                                    <span className="text-xs text-gray-400">→</span>
                                    <input
                                      type="datetime-local"
                                      value={editEndedAt}
                                      onChange={(e) => setEditEndedAt(e.target.value)}
                                      className="text-xs text-[var(--brand-dark)] bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[var(--brand-blue)]"
                                    />
                                    {editStartedAt && editEndedAt && new Date(editEndedAt) > new Date(editStartedAt) && (
                                      <span className="text-xs font-mono text-gray-400">
                                        {formatDuration(Math.floor((new Date(editEndedAt).getTime() - new Date(editStartedAt).getTime()) / 1000))}
                                      </span>
                                    )}
                                    {editStartedAt && editEndedAt && new Date(editEndedAt) <= new Date(editStartedAt) && (
                                      <span className="text-xs text-red-500">Fin doit être après début</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 w-28">
                                    <input
                                      type="number"
                                      value={editRate}
                                      onChange={(e) => setEditRate(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSaveEdit(entry.id);
                                        if (e.key === "Escape") handleCancelEdit();
                                      }}
                                      placeholder="75"
                                      min="0"
                                      step="0.5"
                                      className="w-full text-xs text-[var(--brand-dark)] bg-transparent focus:outline-none placeholder:text-gray-300"
                                    />
                                    <span className="text-xs text-gray-400 shrink-0">€/h</span>
                                  </div>
                                  <button
                                    onClick={() => handleSaveEdit(entry.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--brand-blue)] text-white text-xs font-medium"
                                  >
                                    <Check size={12} /> Sauvegarder
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* View mode — 2 rows */
                              <>
                                {/* Row 1: title + duration */}
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-semibold text-[var(--brand-dark)] leading-snug">
                                    {entry.tasks?.name || entry.description || (
                                      <span className="text-gray-400 italic font-normal">Sans titre</span>
                                    )}
                                  </p>
                                  <span className="text-sm font-mono font-bold text-[var(--brand-dark)] shrink-0 tabular-nums">
                                    {formatDuration(Math.floor(duration))}
                                  </span>
                                </div>

                                {/* Row 2: metadata + earnings + controls */}
                                <div className="flex items-center justify-between gap-2 mt-1.5">
                                  {/* Left: project + client + rate */}
                                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                    {entry.projects && (
                                      <span
                                        className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                                        style={{
                                          backgroundColor: `${entry.projects.color}20`,
                                          color: entry.projects.color,
                                        }}
                                      >
                                        {entry.projects.name}
                                      </span>
                                    )}
                                    {entry.projects?.clients?.name && (
                                      <span className="text-xs text-gray-400 truncate">
                                        {entry.projects.clients.name}
                                      </span>
                                    )}
                                    {entryRate && (
                                      <span className="text-xs text-gray-300 shrink-0">{entryRate}€/h</span>
                                    )}
                                  </div>

                                  {/* Right: earnings + paid toggle + actions */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    {earnings !== null && (
                                      <span className="text-xs font-semibold text-[var(--brand-green)]">
                                        {formatCurrency(earnings)}
                                      </span>
                                    )}

                                    {/* Paid toggle */}
                                    <button
                                      onClick={() => handleTogglePaid(entry.id, isPaid)}
                                      title={isPaid ? "Marquer comme non payé" : "Marquer comme payé"}
                                      className={cn(
                                        "flex items-center w-8 h-[18px] rounded-full px-0.5 shrink-0 transition-colors duration-200",
                                        isPaid ? "bg-[var(--brand-green)] justify-end" : "bg-gray-200 hover:bg-gray-300 justify-start"
                                      )}
                                    >
                                      <span className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                                    </button>

                                    {/* Actions */}
                                    {isConfirmDelete ? (
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-red-500 font-medium">Suppr. ?</span>
                                        <button
                                          onClick={() => handleDeleteEntry(entry.id)}
                                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-50 text-red-500"
                                        >
                                          <Check size={11} />
                                        </button>
                                        <button
                                          onClick={() => setConfirmDeleteId(null)}
                                          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
                                        >
                                          <X size={11} />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className={cn(
                                        "flex items-center gap-0.5 transition-opacity",
                                        "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                      )}>
                                        <button
                                          onClick={() => handleStartEdit(entry)}
                                          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                          <Pencil size={12} />
                                        </button>
                                        <button
                                          onClick={() => setConfirmDeleteId(entry.id)}
                                          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredEntries.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Play size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">
              {filter === "paid"
                ? "Aucune entrée payée"
                : filter === "unpaid"
                ? "Aucune entrée non payée"
                : "Aucune entrée pour l'instant"}
              {projectFilter && ` pour ce projet`}
            </p>
            {filter === "all" && !projectFilter && (
              <p className="text-sm mt-1">Démarrez votre premier timer ci-dessus</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
