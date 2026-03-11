"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, User, X } from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  invited_email: string;
  role: string;
  status: string;
  user_id?: string;
}

interface Team {
  id: string;
  name: string;
  owner_id: string;
  plan: string;
}

interface TeamsPageProps {
  teamId?: string;
}

export function TeamsPage({ teamId }: TeamsPageProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  const supabase = createClient();

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("User:", user?.id);

      if (!user) {
        console.log("No user found");
        setLoading(false);
        return;
      }

      // Fetch teams where user is owner
      const { data: userTeams, error: ownerError } = await supabase
        .from("teams")
        .select("*")
        .eq("owner_id", user.id);

      console.log("User Teams:", userTeams, "Error:", ownerError);

      let allTeams = userTeams || [];

      // Also fetch teams where user is a member
      const { data: memberTeamsIds, error: memberError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .eq("status", "active");

      console.log("Member Team IDs:", memberTeamsIds, "Error:", memberError);

      if (memberTeamsIds && memberTeamsIds.length > 0) {
        const teamIds = memberTeamsIds.map((m: any) => m.team_id);
        
        const { data: memberTeams, error: memberTeamsError } = await supabase
          .from("teams")
          .select("*")
          .in("id", teamIds);

        console.log("Member Teams Data:", memberTeams, "Error:", memberTeamsError);

        if (memberTeams) {
          allTeams = [
            ...allTeams,
            ...memberTeams.filter(
              (t: any) => !allTeams.some((existing: any) => existing.id === t.id)
            ),
          ];
        }
      }

      console.log("All Teams:", allTeams);

      if (ownerError || memberError) {
        toast.error("Erreur lors de la récupération des équipes");
      } else {
        setTeams(allTeams);
        if (allTeams && allTeams.length > 0) {
          setCurrentTeam(allTeams[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Erreur lors de la récupération des équipes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchMembers(teamId: string) {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId);

    if (error) {
      toast.error("Erreur lors de la récupération des membres");
    } else {
      setMembers(data || []);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      if (editingId) {
        const { error } = await supabase
          .from("teams")
          .update({ name: formData.name })
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Équipe modifiée avec succès");
      } else {
        const { error } = await supabase.from("teams").insert([
          {
            name: formData.name,
            owner_id: user.id,
          },
        ]);

        if (error) throw error;
        toast.success("Équipe créée avec succès");
      }

      setFormData({ name: "" });
      setEditingId(null);
      setShowForm(false);
      fetchTeams();
    } catch (error) {
      toast.error("Erreur lors de l'opération");
      console.error(error);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from("teams").delete().eq("id", id);

      if (error) throw error;
      toast.success("Équipe supprimée");
      fetchTeams();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  }

  async function handleEdit(team: Team) {
    setFormData({ name: team.name });
    setEditingId(team.id);
    setShowForm(true);
  }

  async function handleInviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!currentTeam || !inviteEmail.trim()) return;

    try {
      const { error } = await supabase.from("team_members").insert([
        {
          team_id: currentTeam.id,
          invited_email: inviteEmail,
          role: inviteRole,
          status: "pending",
        },
      ]);

      if (error) throw error;
      toast.success("Invitation envoyée");
      setInviteEmail("");
      setInviteRole("member");
      fetchMembers(currentTeam.id);
    } catch (error) {
      toast.error("Erreur lors de l'invitation");
      console.error(error);
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      toast.success("Membre supprimé");
      if (currentTeam) {
        fetchMembers(currentTeam.id);
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-4">
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
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[var(--brand-dark)]">Équipes</h1>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ name: "" });
          }}
          className="gap-2"
        >
          <Plus size={18} />
          Nouvelle équipe
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
                  Nom de l'équipe
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Agence Digitale"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
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

      {teams.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          Aucune équipe pour le moment
        </div>
      ) : (
        <div className="grid gap-6">
          {teams.map((team) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[var(--brand-dark)]">
                    {team.name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Plan: <span className="capitalize">{team.plan}</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEdit(team)}
                  >
                    <Edit2 size={16} />
                  </Button>
                  {deleteConfirmId === team.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(team.id)}
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
                      onClick={() => setDeleteConfirmId(team.id)}
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  )}
                </div>
              </div>

              {currentTeam?.id === team.id && (
                <>
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-[var(--brand-dark)] mb-4">
                      Membres ({members.length})
                    </h3>

                    {members.length === 0 ? (
                      <p className="text-sm text-gray-600 mb-4">
                        Aucun membre pour le moment
                      </p>
                    ) : (
                      <div className="space-y-2 mb-6">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {member.invited_email}
                              </p>
                              <p className="text-xs text-gray-500">
                                {member.role} • {member.status}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <X size={16} className="text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <form
                      onSubmit={handleInviteMember}
                      className="space-y-3 bg-gray-50 p-4 rounded-lg"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Inviter un membre
                        </label>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>

                      <div>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="member">Membre</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <Button type="submit" size="sm" className="w-full gap-2">
                        <User size={16} />
                        Envoyer invitation
                      </Button>
                    </form>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
