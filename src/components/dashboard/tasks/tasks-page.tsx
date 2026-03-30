"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, X, Check, GripVertical, Filter } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "todo" | "in_progress" | "done";

interface Project {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  name: string;
  hourly_rate?: number;
  project_id: string;
  status: Status;
  projects: Project;
}

interface TasksPageProps {
  teamId?: string;
}

// ─── Kanban config ────────────────────────────────────────────────────────────

const COLUMNS: { id: Status; label: string; color: string; bg: string; border: string }[] = [
  {
    id: "todo",
    label: "À faire",
    color: "#6B7280",
    bg: "bg-gray-50",
    border: "border-gray-200",
  },
  {
    id: "in_progress",
    label: "En cours",
    color: "#F5A623",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    id: "done",
    label: "Terminé",
    color: "#00D68F",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function TasksPage({ teamId }: TasksPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    project_id: "",
    status: "todo" as Status,
  });

  // Filter state
  const [filterProjectId, setFilterProjectId] = useState<string>("");

  // Drag state
  const draggingId = useRef<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    if (teamId) fetchProjectsAndTasks();
  }, [teamId]);

  async function fetchProjectsAndTasks() {
    if (!teamId) return;
    setLoading(true);

    const projectIds = (
      await supabase.from("projects").select("id").eq("team_id", teamId)
    ).data?.map((p) => p.id) || [];

    const [projectsRes, tasksRes] = await Promise.all([
      supabase.from("projects").select("id, name, color").eq("team_id", teamId),
      projectIds.length > 0
        ? supabase
            .from("tasks")
            .select("*, projects(id, name, color)")
            .in("project_id", projectIds)
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (!projectsRes.error) setProjects(projectsRes.data || []);
    if (!tasksRes.error) setTasks((tasksRes.data as Task[]) || []);
    setLoading(false);
  }

  // ── Form submit ──────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId || !formData.name.trim() || !formData.project_id) return;

    try {
      if (editingId) {
        const { error } = await supabase
          .from("tasks")
          .update({ name: formData.name, status: formData.status })
          .eq("id", editingId);
        if (error) throw error;
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editingId ? { ...t, name: formData.name, status: formData.status } : t
          )
        );
        toast.success("Tâche modifiée");
      } else {
        const { data, error } = await supabase
          .from("tasks")
          .insert([{ project_id: formData.project_id, name: formData.name, status: formData.status, created_by: userId }])
          .select("*, projects(id, name, color)")
          .single();
        if (error?.code || error?.message) throw error;
        if (data) {
          setTasks((prev) => [...prev, data as Task]);
        } else {
          await fetchProjectsAndTasks();
        }
        toast.success("Tâche créée");
      }

      setFormData({ name: "", project_id: "", status: "todo" });
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      console.error("Task submit error:", err);
      toast.error("Erreur lors de l'opération");
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) { toast.error("Erreur lors de la suppression"); return; }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setDeleteConfirmId(null);
    toast.success("Tâche supprimée");
  }

  // ── Edit ─────────────────────────────────────────────────────────────────────

  function handleEdit(task: Task) {
    setFormData({
      name: task.name,
      project_id: task.project_id,
      status: task.status,
    });
    setEditingId(task.id);
    setShowForm(true);
  }

  // ── Drag & Drop (HTML5 native) ────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, taskId: string) {
    draggingId.current = taskId;
    setDraggingTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    draggingId.current = null;
    setDraggingTaskId(null);
    setDragOverCol(null);
  }

  function handleDragOver(e: React.DragEvent, colId: Status) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colId);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if leaving the column entirely (not entering a child)
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDragOverCol(null);
    }
  }

  async function handleDrop(e: React.DragEvent, colId: Status) {
    e.preventDefault();
    setDragOverCol(null);
    const id = draggingId.current;
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === colId) return;

    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: colId } : t)));
    const { error } = await supabase.from("tasks").update({ status: colId }).eq("id", id);
    if (error) {
      toast.error("Erreur lors du déplacement");
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: task.status } : t)));
    }
  }

  // ── Empty state ───────────────────────────────────────────────────────────────

  if (!teamId) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-gray-600">Veuillez sélectionner une équipe</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 md:mb-8 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--brand-dark)]">Tâches</h1>
          <Button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({ name: "", project_id: "", status: "todo" });
            }}
            className="gap-2"
          >
            <Plus size={18} />
            Nouvelle tâche
          </Button>
        </div>

        {/* Filtre par projet */}
        {projects.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-gray-400 shrink-0" />
            <button
              onClick={() => setFilterProjectId("")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                filterProjectId === ""
                  ? "bg-[var(--brand-dark)] text-white border-transparent"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              )}
            >
              Tous
            </button>
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setFilterProjectId(filterProjectId === p.id ? "" : p.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all border truncate max-w-[150px]",
                  filterProjectId === p.id
                    ? "text-white border-transparent"
                    : "bg-white border-gray-200 hover:border-gray-300"
                )}
                style={
                  filterProjectId === p.id
                    ? { backgroundColor: p.color, color: "#fff" }
                    : { color: p.color }
                }
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shrink-0"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Projet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Projet</label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] text-sm"
                  >
                    <option value="">Sélectionner un projet</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Statut */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] text-sm"
                  >
                    {COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>{col.label}</option>
                    ))}
                  </select>
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de la tâche</label>
                  <Input
                    type="text"
                    placeholder="Ex: Intégration frontend"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

              </div>

              <div className="flex gap-2 pt-1">
                <Button type="submit" variant="green">
                  {editingId ? "Modifier" : "Créer"}
                </Button>
                <Button type="button" onClick={() => setShowForm(false)} variant="secondary">
                  Annuler
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban board */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 min-h-[200px]">
              <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0 overflow-x-auto">
          {COLUMNS.map((col) => {
            const filtered = filterProjectId
              ? tasks.filter((t) => t.project_id === filterProjectId)
              : tasks;
            const colTasks = filtered.filter((t) => t.status === col.id);
            const isOver = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={cn(
                  "rounded-xl border-2 transition-all duration-150 flex flex-col min-h-[300px]",
                  col.bg, col.border,
                  isOver && "border-dashed scale-[1.01] shadow-md"
                )}
                style={isOver ? { borderColor: col.color } : {}}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-4 py-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: col.color }}
                    />
                    <span className="text-sm font-bold text-[var(--brand-dark)]">{col.label}</span>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${col.color}20`, color: col.color }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 px-3 pb-3 flex-1">
                  <AnimatePresence>
                    {colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isDragging={draggingTaskId === task.id}
                        isDeleteConfirm={deleteConfirmId === task.id}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onEdit={handleEdit}
                        onDeleteRequest={(id) => setDeleteConfirmId(id)}
                        onDeleteConfirm={handleDelete}
                        onDeleteCancel={() => setDeleteConfirmId(null)}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Drop hint */}
                  {isOver && draggingId.current && (
                    <div
                      className="rounded-lg border-2 border-dashed h-14 flex items-center justify-center text-xs font-medium opacity-60"
                      style={{ borderColor: col.color, color: col.color }}
                    >
                      Déposer ici
                    </div>
                  )}

                  {colTasks.length === 0 && !isOver && (
                    <p className="text-xs text-gray-400 text-center py-6 italic">Aucune tâche</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  isDragging: boolean;
  isDeleteConfirm: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onEdit: (task: Task) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}

function TaskCard({
  task,
  isDragging,
  isDeleteConfirm,
  onDragStart,
  onDragEnd,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: TaskCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, task.id)}
      onDragEnd={onDragEnd}
      className={cn(
        "bg-white rounded-xl border border-gray-100 px-3 py-3 group cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all select-none",
        isDragging && "opacity-40 scale-95"
      )}
    >
      {/* Drag handle + name */}
      <div className="flex items-start gap-2">
        <GripVertical
          size={14}
          className="text-gray-300 group-hover:text-gray-400 mt-0.5 shrink-0 transition-colors"
        />
        <p className="text-sm font-medium text-[var(--brand-dark)] flex-1 leading-snug">
          {task.name}
        </p>
      </div>

      {/* Project + rate */}
      <div className="flex items-center gap-2 mt-2 ml-5">
        {task.projects && (
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded-full truncate max-w-[120px]"
            style={{
              backgroundColor: `${task.projects.color}20`,
              color: task.projects.color,
            }}
          >
            {task.projects.name}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 mt-2">
        {isDeleteConfirm ? (
          <>
            <span className="text-xs text-red-500 font-medium mr-1">Supprimer ?</span>
            <button
              onClick={() => onDeleteConfirm(task.id)}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Check size={12} />
            </button>
            <button
              onClick={onDeleteCancel}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X size={12} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onEdit(task)}
              className="w-6 h-6 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={() => onDeleteRequest(task.id)}
              className="w-6 h-6 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
