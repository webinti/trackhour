"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

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
  projects: Project;
}

interface TasksPageProps {
  teamId?: string;
}

export function TasksPage({ teamId }: TasksPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    project_id: "",
    hourly_rate: "",
  });

  const supabase = createClient();

  useEffect(() => {
    if (teamId) {
      fetchProjectsAndTasks();
    }
  }, [teamId]);

  async function fetchProjectsAndTasks() {
    if (!teamId) return;
    setLoading(true);

    const [projectsRes, tasksRes] = await Promise.all([
      supabase.from("projects").select("id, name, color").eq("team_id", teamId),
      supabase
        .from("tasks")
        .select("*, projects(id, name, color)")
        .in(
          "project_id",
          (
            await supabase
              .from("projects")
              .select("id")
              .eq("team_id", teamId)
          ).data?.map((p) => p.id) || []
        ),
    ]);

    if (projectsRes.error) {
      toast.error("Erreur lors de la récupération des projets");
    } else {
      setProjects(projectsRes.data || []);
    }

    if (tasksRes.error) {
      toast.error("Erreur lors de la récupération des tâches");
    } else {
      setTasks(tasksRes.data || []);
    }

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId || !formData.name.trim() || !formData.project_id) return;

    try {
      if (editingId) {
        const { error } = await supabase
          .from("tasks")
          .update({
            name: formData.name,
            hourly_rate: formData.hourly_rate
              ? parseFloat(formData.hourly_rate)
              : null,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Tâche modifiée avec succès");
      } else {
        const { error } = await supabase.from("tasks").insert([
          {
            project_id: formData.project_id,
            name: formData.name,
            hourly_rate: formData.hourly_rate
              ? parseFloat(formData.hourly_rate)
              : null,
          },
        ]);

        if (error) throw error;
        toast.success("Tâche créée avec succès");
      }

      setFormData({ name: "", project_id: "", hourly_rate: "" });
      setEditingId(null);
      setShowForm(false);
      fetchProjectsAndTasks();
    } catch (error) {
      toast.error("Erreur lors de l'opération");
      console.error(error);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) throw error;
      toast.success("Tâche supprimée");
      fetchProjectsAndTasks();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  }

  async function handleEdit(task: Task) {
    setFormData({
      name: task.name,
      project_id: task.project_id,
      hourly_rate: task.hourly_rate?.toString() || "",
    });
    setEditingId(task.id);
    setShowForm(true);
  }

  if (!teamId) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Veuillez sélectionner une équipe</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[var(--brand-dark)]">Tâches</h1>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ name: "", project_id: "", hourly_rate: "" });
          }}
          className="gap-2"
        >
          <Plus size={18} />
          Nouvelle tâche
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl border border-gray-200 p-6 mb-8"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Projet
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) =>
                    setFormData({ ...formData, project_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
                >
                  <option value="">Sélectionner un projet</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la tâche
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Intégration frontend"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taux horaire (€/h)
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 75"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourly_rate: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" variant="green">
                  {editingId ? "Modifier" : "Créer"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  variant="secondary"
                >
                  Annuler
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          Aucune tâche pour le moment
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: task.projects?.color }}
                />
                <div>
                  <h3 className="font-medium text-[var(--brand-dark)]">
                    {task.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {task.projects?.name}
                    {task.hourly_rate && ` • ${task.hourly_rate}€/h`}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleEdit(task)}
                >
                  <Edit2 size={16} />
                </Button>
                {deleteConfirmId === task.id ? (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(task.id)}
                    >
                      Confirmer
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setDeleteConfirmId(null)}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setDeleteConfirmId(task.id)}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
