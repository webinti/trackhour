"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Square, Pause, Folder, Tag, ChevronDown, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDuration, formatCurrency, calculateEarnings, PROJECT_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function HeaderTimer() {
  const supabase = createClient();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [activeTimer, setActiveTimer] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pause state
  const [isPaused, setIsPaused] = useState(false);
  const [pausedDuration, setPausedDuration] = useState(0); // accumulated past pauses in seconds
  const [pausedAtMs, setPausedAtMs] = useState<number | null>(null); // ms when current pause started

  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [manualRate, setManualRate] = useState<string>("");
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({ name: "", color: "#3333FF", client_id: "", is_private: false });
  const [newProjectLoading, setNewProjectLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [primaryTeamId, setPrimaryTeamId] = useState<string | null>(null);

  const projectPickerRef = useRef<HTMLDivElement>(null);
  const taskPickerRef = useRef<HTMLDivElement>(null);

  // Close pickers on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (projectPickerRef.current && !projectPickerRef.current.contains(e.target as Node)) {
        setShowProjectPicker(false);
      }
      if (taskPickerRef.current && !taskPickerRef.current.contains(e.target as Node)) {
        setShowTaskPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Init: fetch user, active timer, projects
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Active timer
      const { data: timer } = await supabase
        .from("time_entries")
        .select("*, projects(id, name, color, tasks(id, name, hourly_rate)), tasks(id, name, hourly_rate)")
        .eq("user_id", user.id)
        .is("ended_at", null)
        .maybeSingle();

      if (timer) {
        setActiveTimer(timer);
        setRunning(true);
        setDescription(timer.description || "");
        setSelectedProject(timer.projects || null);
        setSelectedTask(timer.tasks || null);
        const rate = timer.hourly_rate ?? timer.tasks?.hourly_rate;
        if (rate) setManualRate(rate.toString());

        const accumulatedPause = timer.paused_duration || 0;
        setPausedDuration(accumulatedPause);

        if (timer.paused_at) {
          // Timer is currently paused
          const pauseStartMs = new Date(timer.paused_at).getTime();
          setIsPaused(true);
          setPausedAtMs(pauseStartMs);
          // Show elapsed at the moment of pause
          const elapsedAtPause = Math.floor(
            (pauseStartMs - new Date(timer.started_at).getTime()) / 1000 - accumulatedPause
          );
          setElapsed(Math.max(0, elapsedAtPause));
        }
      }

      // Projects (owned teams + member teams)
      const [{ data: ownedTeams }, { data: memberTeams }] = await Promise.all([
        supabase.from("teams").select("id").eq("owner_id", user.id),
        supabase.from("team_members").select("team_id").eq("user_id", user.id).eq("status", "active"),
      ]);

      const allTeamIds = [
        ...new Set([
          ...((ownedTeams || []).map((t: any) => t.id)),
          ...((memberTeams || []).map((m: any) => m.team_id)),
        ]),
      ];

      if (allTeamIds.length > 0) {
        const teamId = (ownedTeams?.[0]?.id) || allTeamIds[0];
        setPrimaryTeamId(teamId);

        const { data: projs } = await supabase
          .from("projects")
          .select("*, clients(id, name), tasks(id, name, hourly_rate)")
          .in("team_id", allTeamIds)
          .or(`is_private.eq.false,created_by.eq.${user.id}`)
          .order("name");
        setProjects(projs || []);
      }
    }

    init();
  }, []);

  // Tick — only when running and not paused
  useEffect(() => {
    if (!running || !activeTimer || isPaused) return;
    const startedAt = new Date(activeTimer.started_at).getTime();
    const update = () => {
      const totalElapsed = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(Math.max(0, totalElapsed - pausedDuration));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [running, activeTimer, isPaused, pausedDuration]);

  const handleStart = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const currentRate = parseFloat(manualRate);
    const { data, error } = await supabase
      .from("time_entries")
      .insert({
        user_id: userId,
        description: description || null,
        project_id: selectedProject?.id || null,
        task_id: selectedTask?.id || null,
        hourly_rate: currentRate > 0 ? currentRate : null,
        started_at: new Date().toISOString(),
      })
      .select("*, projects(id, name, color, tasks(id, name, hourly_rate)), tasks(id, name, hourly_rate)")
      .single();

    if (error) {
      toast.error("Impossible de démarrer le timer");
      console.error("Start error:", error);
      setLoading(false);
      return;
    }

    if (data) {
      setActiveTimer(data);
      setRunning(true);
      setElapsed(0);
      setPausedDuration(0);
      setIsPaused(false);
      setPausedAtMs(null);
    }
    setLoading(false);
    router.refresh();
  }, [userId, description, selectedProject, selectedTask, manualRate, supabase, router]);

  const handlePause = useCallback(async () => {
    if (!activeTimer || !running || isPaused) return;
    const pausedAt = new Date().toISOString();
    const { error } = await supabase
      .from("time_entries")
      .update({ paused_at: pausedAt })
      .eq("id", activeTimer.id);

    if (error) {
      toast.error("Impossible de mettre en pause");
      return;
    }

    setIsPaused(true);
    setPausedAtMs(Date.now());
  }, [activeTimer, running, isPaused, supabase]);

  const handleResume = useCallback(async () => {
    if (!activeTimer || !isPaused || pausedAtMs === null) return;
    const additionalPause = Math.floor((Date.now() - pausedAtMs) / 1000);
    const newPausedDuration = pausedDuration + additionalPause;

    const { error } = await supabase
      .from("time_entries")
      .update({ paused_at: null, paused_duration: newPausedDuration })
      .eq("id", activeTimer.id);

    if (error) {
      toast.error("Impossible de reprendre le timer");
      return;
    }

    setPausedDuration(newPausedDuration);
    setPausedAtMs(null);
    setIsPaused(false);
  }, [activeTimer, isPaused, pausedAtMs, pausedDuration, supabase]);

  const handleStop = useCallback(async () => {
    if (!activeTimer) return;
    setLoading(true);

    // If currently paused, add current pause to accumulated total
    let finalPausedDuration = pausedDuration;
    if (isPaused && pausedAtMs !== null) {
      finalPausedDuration += Math.floor((Date.now() - pausedAtMs) / 1000);
    }

    const { error } = await supabase
      .from("time_entries")
      .update({
        ended_at: new Date().toISOString(),
        paused_at: null,
        paused_duration: finalPausedDuration,
      })
      .eq("id", activeTimer.id);

    if (error) {
      toast.error("Impossible d'arrêter le timer");
      console.error("Stop error:", error);
      setLoading(false);
      return;
    }

    setRunning(false);
    setIsPaused(false);
    setPausedDuration(0);
    setPausedAtMs(null);
    setElapsed(0);
    setActiveTimer(null);
    setDescription("");
    setSelectedProject(null);
    setSelectedTask(null);
    setManualRate("");
    setLoading(false);
    router.refresh();
  }, [activeTimer, supabase, router, isPaused, pausedAtMs, pausedDuration]);

  const openNewProject = useCallback(async () => {
    setShowProjectPicker(false);
    setShowNewProject(true);
    if (primaryTeamId && clients.length === 0) {
      const { data } = await supabase.from("clients").select("id, name").eq("team_id", primaryTeamId).order("name");
      setClients(data || []);
    }
  }, [primaryTeamId, clients.length, supabase]);

  const handleCreateProject = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryTeamId || !userId || !newProjectForm.name.trim()) return;
    setNewProjectLoading(true);

    const { data, error } = await supabase
      .from("projects")
      .insert({
        team_id: primaryTeamId,
        client_id: newProjectForm.client_id || null,
        name: newProjectForm.name,
        color: newProjectForm.color,
        is_private: newProjectForm.is_private,
        created_by: userId,
      })
      .select("*, clients(id, name), tasks(id, name, hourly_rate)")
      .single();

    if (!error && data) {
      setProjects((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedProject(data);
      setSelectedTask(null);
      setManualRate("");
      setShowNewProject(false);
      setNewProjectForm({ name: "", color: "#3333FF", client_id: "", is_private: false });
    }
    setNewProjectLoading(false);
  }, [primaryTeamId, userId, newProjectForm, supabase]);

  const tasks = selectedProject?.tasks || [];
  const rate = parseFloat(manualRate);
  const earnings = running && !isPaused && !isNaN(rate) && rate > 0
    ? calculateEarnings(elapsed, rate)
    : null;

  return (
    <div className="flex items-center gap-2 flex-1 mx-6">
      {/* Description input */}
      <input
        type="text"
        placeholder="Quelle tâche faites-vous actuellement ?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={running}
        onKeyDown={(e) => e.key === "Enter" && !running && handleStart()}
        className="flex-1 text-sm text-[var(--brand-dark)] placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--brand-blue)] focus:ring-1 focus:ring-[var(--brand-blue)] transition-all disabled:bg-transparent disabled:border-transparent disabled:cursor-default"
        suppressHydrationWarning
      />

      {/* Project picker */}
      <div className="relative" ref={projectPickerRef}>
        <button
          onClick={() => {
            if (running) return;
            setShowProjectPicker(!showProjectPicker);
            setShowTaskPicker(false);
          }}
          title="Choisir un projet"
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all h-9",
            selectedProject
              ? "text-white"
              : "border border-gray-200 text-gray-500 hover:border-gray-300 bg-gray-50",
            running && !selectedProject && "opacity-50 cursor-default"
          )}
          style={selectedProject ? { backgroundColor: selectedProject.color } : {}}
        >
          <Folder size={13} />
          <span className="hidden sm:inline max-w-[80px] truncate">
            {selectedProject ? selectedProject.name : "Projet"}
          </span>
          {!running && <ChevronDown size={11} />}
        </button>

        <AnimatePresence>
          {showProjectPicker && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden"
            >
              <div className="p-2 space-y-0.5 max-h-52 overflow-y-auto">
                <button
                  onClick={() => { setSelectedProject(null); setSelectedTask(null); setManualRate(""); setShowProjectPicker(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 rounded-lg"
                >
                  Aucun projet
                </button>
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => { setSelectedProject(project); setSelectedTask(null); setShowProjectPicker(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--brand-dark)] hover:bg-gray-50 rounded-lg"
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                    <span className="truncate">{project.name}</span>
                    {project.clients?.name && (
                      <span className="text-gray-400 truncate ml-auto shrink-0">{project.clients.name}</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-50 p-2">
                <button
                  onClick={openNewProject}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--brand-blue)] hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus size={13} />
                  Nouveau projet
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task picker */}
      {selectedProject && tasks.length > 0 && (
        <div className="relative" ref={taskPickerRef}>
          <button
            onClick={() => {
              if (running) return;
              setShowTaskPicker(!showTaskPicker);
              setShowProjectPicker(false);
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 hover:border-gray-300 bg-gray-50 transition-all h-9",
              running && "opacity-50 cursor-default"
            )}
          >
            <Tag size={13} />
            <span className="hidden sm:inline max-w-[80px] truncate">
              {selectedTask ? selectedTask.name : "Tâche"}
            </span>
            {!running && <ChevronDown size={11} />}
          </button>

          <AnimatePresence>
            {showTaskPicker && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden"
              >
                <div className="p-2 space-y-0.5">
                  <button
                    onClick={() => { setSelectedTask(null); setManualRate(""); setShowTaskPicker(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 rounded-lg"
                  >
                    Aucune tâche
                  </button>
                  {tasks.map((task: any) => (
                    <button
                      key={task.id}
                      onClick={() => { setSelectedTask(task); setManualRate(task.hourly_rate ? task.hourly_rate.toString() : ""); setShowTaskPicker(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-[var(--brand-dark)] hover:bg-gray-50 rounded-lg"
                    >
                      {task.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Rate input */}
      <div className={cn(
        "hidden sm:flex items-center gap-1 border rounded-lg bg-gray-50 h-9 px-2.5 transition-all w-20 shrink-0",
        running ? "border-gray-100 bg-transparent" : "border-gray-200 focus-within:border-[var(--brand-blue)] focus-within:ring-1 focus-within:ring-[var(--brand-blue)]"
      )}>
        <input
          type="number"
          placeholder="75"
          min="0"
          step="0.5"
          suppressHydrationWarning
          value={manualRate}
          onChange={(e) => !running && setManualRate(e.target.value)}
          disabled={running}
          className="w-full text-xs text-[var(--brand-dark)] bg-transparent focus:outline-none disabled:cursor-default placeholder:text-gray-300"
        />
        <span className="text-xs text-gray-400 shrink-0">€/h</span>
      </div>

      {/* Earnings live */}
      {earnings !== null && (
        <span className="hidden md:block text-xs font-semibold text-[var(--brand-green)] shrink-0">
          {formatCurrency(earnings)}
        </span>
      )}

      {/* Slide-over nouveau projet */}
      <AnimatePresence>
        {showNewProject && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewProject(false)}
              className="fixed inset-0 bg-black/20 z-40"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-[var(--brand-dark)]">Nouveau projet</h2>
                <button
                  onClick={() => setShowNewProject(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateProject} className="flex flex-col flex-1 p-6 gap-5 overflow-y-auto">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Nom du projet</label>
                  <input
                    type="text"
                    placeholder="Ex: Refonte site web"
                    value={newProjectForm.name}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                    autoFocus
                    className="w-full text-sm text-[var(--brand-dark)] border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--brand-blue)] focus:ring-1 focus:ring-[var(--brand-blue)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Couleur</label>
                  <div className="flex flex-wrap gap-2">
                    {PROJECT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewProjectForm({ ...newProjectForm, color })}
                        className={cn(
                          "w-7 h-7 rounded-full transition-transform hover:scale-110",
                          newProjectForm.color === color && "ring-2 ring-offset-2 ring-gray-400 scale-110"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {clients.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Client (optionnel)</label>
                    <select
                      value={newProjectForm.client_id}
                      onChange={(e) => setNewProjectForm({ ...newProjectForm, client_id: e.target.value })}
                      className="w-full text-sm text-[var(--brand-dark)] border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--brand-blue)] focus:ring-1 focus:ring-[var(--brand-blue)] bg-white"
                    >
                      <option value="">Aucun client</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <Toggle
                  id="new_project_private"
                  checked={newProjectForm.is_private}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, is_private: e.target.checked })}
                  label="Projet privé"
                  description="Visible uniquement par vous"
                />

                <div className="mt-auto flex gap-2">
                  <button
                    type="submit"
                    disabled={!newProjectForm.name.trim() || newProjectLoading}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--brand-blue)] hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {newProjectLoading ? "Création..." : "Créer le projet"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewProject(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Pause / Resume button — visible only when running */}
      <AnimatePresence>
        {running && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={isPaused ? handleResume : handlePause}
            disabled={loading}
            title={isPaused ? "Reprendre" : "Pause"}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-lg transition-colors shrink-0",
              isPaused
                ? "bg-[var(--brand-green)] hover:bg-emerald-500 text-white"
                : "bg-amber-100 hover:bg-amber-200 text-amber-600"
            )}
          >
            {isPaused ? <Play size={14} fill="white" /> : <Pause size={14} />}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Timer button (Stop / Start) */}
      <button
        onClick={running ? handleStop : handleStart}
        disabled={loading}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold font-mono transition-all h-9 shrink-0",
          running
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-[var(--brand-blue)] hover:bg-blue-700 text-white"
        )}
      >
        {running ? (
          <>
            <Square size={13} fill="white" />
            <span className={cn(isPaused && "opacity-60")}>{formatDuration(elapsed)}</span>
          </>
        ) : (
          <>
            <Play size={13} fill="white" />
            <span className="hidden sm:inline">Démarrer</span>
          </>
        )}
      </button>
    </div>
  );
}
