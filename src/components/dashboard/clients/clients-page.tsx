"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, FolderOpen, Clock, Lock } from "lucide-react";
import { toast } from "sonner";
import { formatDurationHuman, PLAN_LIMITS } from "@/lib/utils";
import type { Plan } from "@/lib/utils";
import { UpgradeBanner } from "@/components/ui/upgrade-banner";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { PhoneInputField } from "@/components/ui/phone-input";

interface TimeEntry {
  started_at: string;
  ended_at: string | null;
}

interface Project {
  id: string;
  time_entries: TimeEntry[];
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  projects?: Project[];
}

interface ClientsPageProps {
  teamId?: string;
  plan?: Plan;
}

export function ClientsPage({ teamId, plan = "free" }: ClientsPageProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    company_name: "",
    email: "",
    phone: "",
    address: "",
  });

  const supabase = createClient();

  useEffect(() => {
    if (teamId) {
      fetchClients();
    }
  }, [teamId]);

  async function fetchClients() {
    if (!teamId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*, projects(id, time_entries(started_at, ended_at))")
      .eq("team_id", teamId);

    if (error) {
      toast.error("Erreur lors de la récupération des clients");
      console.error(error);
    } else {
      setClients(data || []);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId || !formData.company_name.trim()) return;

    // Plan gating
    if (!editingId && clients.length >= PLAN_LIMITS[plan].clients) {
      toast.error(`Limite atteinte — passez au plan supérieur pour créer plus de clients (max ${PLAN_LIMITS[plan].clients} sur le plan ${plan})`);
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("clients")
          .update({
            name: formData.company_name,
            ...formData,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Client modifié avec succès");
      } else {
        const { error } = await supabase.from("clients").insert([
          {
            team_id: teamId,
            name: formData.company_name, // Utiliser company_name comme name
            ...formData,
          },
        ]);

        if (error) throw error;
        toast.success("Client créé avec succès");
      }

      setFormData({
        first_name: "",
        last_name: "",
        company_name: "",
        email: "",
        phone: "",
        address: "",
      });
      setEditingId(null);
      setShowForm(false);
      fetchClients();
    } catch (error) {
      toast.error("Erreur lors de l'opération");
      console.error(error);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from("clients").delete().eq("id", id);

      if (error) throw error;
      toast.success("Client supprimé");
      fetchClients();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  }

  async function handleEdit(client: Client) {
    setFormData({
      first_name: client.first_name,
      last_name: client.last_name,
      company_name: client.company_name,
      email: client.email,
      phone: client.phone,
      address: client.address,
    });
    setEditingId(client.id);
    setShowForm(true);
  }

  function getClientStats(client: Client) {
    const projects = client.projects ?? [];
    const projectCount = projects.length;
    const totalSeconds = projects.reduce((acc, project) => {
      return acc + project.time_entries.reduce((s, entry) => {
        if (!entry.ended_at) return s;
        return s + Math.floor((new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime()) / 1000);
      }, 0);
    }, 0);
    return { projectCount, totalSeconds };
  }

  if (!teamId) {
    return (
      <div>
        <p className="text-gray-600">Veuillez sélectionner une équipe</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--brand-dark)]">Clients</h1>
        {clients.length >= PLAN_LIMITS[plan].clients ? (
          <Button
            onClick={() => toast.error(`Limite de ${PLAN_LIMITS[plan].clients} clients atteinte — upgradez votre plan dans les Paramètres`)}
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
              setFormData({ first_name: "", last_name: "", company_name: "", email: "", phone: "", address: "" });
            }}
            className="gap-2"
          >
            <Plus size={18} />
            Nouveau client
          </Button>
        )}
      </div>

      {/* Upsell banner */}
      {plan === "free" && clients.length >= Math.floor(PLAN_LIMITS.free.clients * 0.7) && (
        <UpgradeBanner
          variant="limit"
          message={
            clients.length >= PLAN_LIMITS.free.clients
              ? `Limite atteinte — ${PLAN_LIMITS.free.clients} clients sur ${PLAN_LIMITS.free.clients}. Passez à Premium pour en gérer jusqu'à 15.`
              : `${clients.length} clients sur ${PLAN_LIMITS.free.clients} utilisés — bientôt à la limite du plan Gratuit.`
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom
                  </label>
                  <Input
                    type="text"
                    placeholder="Jean"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <Input
                    type="text"
                    placeholder="Dupont"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom d'entreprise *
                </label>
                <Input
                  type="text"
                  placeholder="Acme Corp"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(val) => setFormData({ ...formData, address: val })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="contact@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <PhoneInputField
                    value={formData.phone}
                    onChange={(val) => setFormData({ ...formData, phone: val })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  variant="green"
                  disabled={!formData.company_name.trim() || !teamId}
                >
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
      ) : clients.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          Aucun client pour le moment
        </div>
      ) : (
        <div className="grid gap-4">
          {clients.map((client) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-[var(--brand-dark)]">
                    {client.company_name}
                  </h3>
                  {(client.first_name || client.last_name) && (
                    <p className="text-sm text-gray-600">
                      {client.first_name} {client.last_name}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEdit(client)}
                  >
                    <Edit2 size={16} />
                  </Button>
                  {deleteConfirmId === client.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(client.id)}
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
                      onClick={() => setDeleteConfirmId(client.id)}
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  )}
                </div>
              </div>

              {(() => {
                const { projectCount, totalSeconds } = getClientStats(client);
                return (
                  <div className="flex gap-4 mb-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <FolderOpen size={14} className="text-[var(--brand-blue)]" />
                      <span>{projectCount} projet{projectCount !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Clock size={14} className="text-[var(--brand-green)]" />
                      <span>{totalSeconds > 0 ? formatDurationHuman(totalSeconds) : "0min"}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2 text-sm text-gray-600">
                {client.email && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium w-20">Email:</span>
                    <a href={`mailto:${client.email}`} className="text-[var(--brand-blue)] hover:underline">
                      {client.email}
                    </a>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium w-20">Tél:</span>
                    <a href={`tel:${client.phone}`} className="text-[var(--brand-blue)] hover:underline">
                      {client.phone}
                    </a>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-2">
                    <span className="font-medium w-20">Adresse:</span>
                    <span>{client.address}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
