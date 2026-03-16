"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Lock, Clock, Euro } from "lucide-react";
import { toast } from "sonner";
import { PLAN_LIMITS, formatDuration, formatCurrency } from "@/lib/utils";
import type { Plan } from "@/lib/utils";
import { UpgradeBanner } from "@/components/ui/upgrade-banner";

interface Client {
  id: string;
  name: string;
  color: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
  client_id: string;
  is_private: boolean;
  clients: Client;
}

interface ProjectsPageProps {
  teamId?: string;
  plan?: Plan;
}

interface ProjectStats {
  totalSeconds: number;
  monthEarnings: number;
}

export function ProjectsPage({ teamId, plan = "free" }: ProjectsPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projectStats, setProjectStats] = useState<Record<string, ProjectStats>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#3333FF",
    client_id: "",
    is_private: false,
  });

  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (teamId) {
      fetchClientsAndProjects();
    }
  }, [teamId]);

  async function fetchClientsAndProjects() {
    if (!teamId) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [clientsRes, projectsRes, entriesRes] = await Promise.all([
      supabase.from("clients").select("*").eq("team_id", teamId),
      supabase.from("projects").select("*").eq("team_id", teamId).order("created_at", { ascending: false }),
      user
        ? supabase
            .from("time_entries")
            .select("project_id, started_at, ended_at, paused_duration, hourly_rate, tasks(hourly_rate)")
            .eq("user_id", user.id)
            .not("ended_at", "is", null)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (clientsRes.error) {
      toast.error("Erreur lors de la récupération des clients");
    } else {
      setClients(clientsRes.data || []);
    }

    if (projectsRes.error) {
      toast.error("Erreur lors de la récupération des projets");
    } else {
      setProjects(projectsRes.data || []);
    }

    // Compute per-project stats
    const stats: Record<string, ProjectStats> = {};
    for (const entry of (entriesRes.data || []) as any[]) {
      if (!entry.project_id) continue;
      const rawMs = new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime();
      const seconds = Math.max(0, rawMs / 1000 - (entry.paused_duration || 0));
      const rate = entry.hourly_rate ?? entry.tasks?.hourly_rate ?? 0;
      if (!stats[entry.project_id]) stats[entry.project_id] = { totalSeconds: 0, monthEarnings: 0 };
      stats[entry.project_id].totalSeconds += seconds;
      if (new Date(entry.started_at) >= monthStart) {
        stats[entry.project_id].monthEarnings += rate ? (seconds / 3600) * rate : 0;
      }
    }
    setProjectStats(stats);

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId || !formData.name.trim() || !formData.client_id) return;

    // Plan gating
    if (!editingId && projects.length >= PLAN_LIMITS[plan].projects) {
      toast.error(`Limite atteinte — passez au plan supérieur pour créer plus de projets (max ${PLAN_LIMITS[plan].projects} sur le plan ${plan})`);
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("projects")
          .update({
            name: formData.name,
            color: formData.color,
            is_private: formData.is_private,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Projet modifié avec succès");
      } else {
        const { data: insertedData, error } = await supabase.from("projects").insert([
          {
            team_id: teamId,
            client_id: formData.client_id,
            name: formData.name,
            color: formData.color,
            is_private: formData.is_private,
            created_by: userId,
          },
        ]).select();

        if (error) throw error;
        console.log("Project created:", insertedData);
        toast.success("Projet créé avec succès");
      }

      setFormData({
        name: "",
        color: "#3333FF",
        client_id: "",
        is_private: false,
      });
      setEditingId(null);
      setShowForm(false);
      fetchClientsAndProjects();
    } catch (error) {
      toast.error("Erreur lors de l'opération");
      console.error(error);
    }
  }

  async function handleDelete(id: string) {
    try {
      console.log("Deleting project:", id);
      const { error } = await supabase.from("projects").delete().eq("id", id);

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }
      toast.success("Projet supprimé");
      fetchClientsAndProjects();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error("Full error:", error);
    }
  }

  async function handleEdit(project: Project) {
    setFormData({
      name: project.name,
      color: project.color,
      client_id: project.client_id,
      is_private: project.is_private,
    });
    setEditingId(project.id);
    setShowForm(true);
  }

  if (!teamId) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-gray-600">Veuillez sélectionner une équipe</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--brand-dark)]">Projets</h1>
        {projects.length >= PLAN_LIMITS[plan].projects ? (
          <Button
            onClick={() => toast.error(`Limite de ${PLAN_LIMITS[plan].projects} projets atteinte — upgradez votre plan dans les Paramètres`)}
            variant="secondary"
            className="gap-2 opacity-60"
          >
            <Lock size={16} />
            Limite atteinte
          </Button>
        ) : (
          <Button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({ name: "", color: "#3333FF", client_id: "", is_private: false });
            }}
            className="gap-2"
          >
            <Plus size={18} />
            Nouveau projet
          </Button>
        )}
      </div>

      {/* Upsell banner */}
      {plan === "free" && projects.length >= Math.floor(PLAN_LIMITS.free.projects * 0.7) && (
        <UpgradeBanner
          variant="limit"
          message={
            projects.length >= PLAN_LIMITS.free.projects
              ? `Limite atteinte — ${PLAN_LIMITS.free.projects} projets sur ${PLAN_LIMITS.free.projects}. Passez à Premium pour en créer jusqu'à 20.`
              : `${projects.length} projets sur ${PLAN_LIMITS.free.projects} utilisés — bientôt à la limite du plan Gratuit.`
          }
          className="mb-6"
        />
      )}

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
                  Client
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) =>
                    setFormData({ ...formData, client_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du projet
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Refonte site web"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="h-10 w-20 cursor-pointer rounded border border-gray-200"
                  />
                  <span className="text-sm text-gray-600 self-center">
                    {formData.color}
                  </span>
                </div>
              </div>

              <Toggle
                id="is_private"
                checked={formData.is_private}
                onChange={(e) =>
                  setFormData({ ...formData, is_private: e.target.checked })
                }
                label="Projet privé"
                description="Seuls les membres de l'équipe peuvent voir ce projet"
              />

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
      ) : projects.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          Aucun projet pour le moment
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <div>
                  <h3 className="font-medium text-[var(--brand-dark)]">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {clients.find(c => c.id === project.client_id)?.name}{" "}
                    {project.is_private && "• Privé"}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {projectStats[project.id]?.totalSeconds > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={11} />
                        {formatDuration(Math.floor(projectStats[project.id].totalSeconds))}
                      </span>
                    )}
                    {projectStats[project.id]?.monthEarnings > 0 && (
                      <span className="flex items-center gap-1 text-xs font-medium text-[var(--brand-green)]">
                        <Euro size={11} />
                        {formatCurrency(projectStats[project.id].monthEarnings)} ce mois
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleEdit(project)}
                >
                  <Edit2 size={16} />
                </Button>
                {deleteConfirmId === project.id ? (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(project.id)}
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
                    onClick={() => setDeleteConfirmId(project.id)}
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
