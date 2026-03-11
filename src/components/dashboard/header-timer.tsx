"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Square, Folder, Tag, ChevronDown, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDuration, formatCurrency, calculateEarnings } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function HeaderTimer() {
  const supabase = createClient();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [activeTimer, setActiveTimer] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);

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
        .select("*, projects(id, name, color, tasks(id, name, daily_rate)), tasks(id, name, daily_rate)")
        .eq("user_id", user.id)
        .is("ended_at", null)
        .maybeSingle();

      if (timer) {
        setActiveTimer(timer);
        setRunning(true);
        setDescription(timer.description || "");
        setSelectedProject(timer.projects || null);
        setSelectedTask(timer.tasks || null);
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
        const { data: projs } = await supabase
          .from("projects")
          .select("*, clients(id, name), tasks(id, name, daily_rate)")
          .in("team_id", allTeamIds)
          .or(`is_private.eq.false,created_by.eq.${user.id}`)
          .order("name");
        setProjects(projs || []);
      }
    }

    init();
  }, []);

  // Tick
  useEffect(() => {
    if (!running || !activeTimer) return;
    const startedAt = new Date(activeTimer.started_at).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [running, activeTimer]);

  const handleStart = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("time_entries")
      .insert({
        user_id: userId,
        description: description || null,
        project_id: selectedProject?.id || null,
        task_id: selectedTask?.id || null,
        started_at: new Date().toISOString(),
      })
      .select("*, projects(id, name, color, tasks(id, name, daily_rate)), tasks(id, name, daily_rate)")
      .single();

    if (!error && data) {
      setActiveTimer(data);
      setRunning(true);
      setElapsed(0);
    }
    setLoading(false);
    router.refresh();
  }, [userId, description, selectedProject, selectedTask, supabase, router]);

  const handleStop = useCallback(async () => {
    if (!activeTimer) return;
    setLoading(true);
    await supabase
      .from("time_entries")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", activeTimer.id);

    setRunning(false);
    setElapsed(0);
    setActiveTimer(null);
    setDescription("");
    setSelectedProject(null);
    setSelectedTask(null);
    setLoading(false);
    router.refresh();
  }, [activeTimer, supabase, router]);

  const tasks = selectedProject?.tasks || [];
  const earnings = selectedTask?.daily_rate && running
    ? calculateEarnings(elapsed, selectedTask.daily_rate)
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
                  onClick={() => { setSelectedProject(null); setSelectedTask(null); setShowProjectPicker(false); }}
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
                    onClick={() => { setSelectedTask(null); setShowTaskPicker(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 rounded-lg"
                  >
                    Aucune tâche
                  </button>
                  {tasks.map((task: any) => (
                    <button
                      key={task.id}
                      onClick={() => { setSelectedTask(task); setShowTaskPicker(false); }}
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

      {/* Earnings */}
      {earnings !== null && (
        <div className="flex items-center gap-1 text-xs font-semibold text-[var(--brand-green)] hidden md:flex">
          <DollarSign size={13} />
          {formatCurrency(earnings)}
        </div>
      )}

      {/* Timer button */}
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
            <span>{formatDuration(elapsed)}</span>
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
