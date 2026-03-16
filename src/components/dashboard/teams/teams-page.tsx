"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, UserPlus, X, Crown, Clock, Copy, Check, Lock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PLAN_LIMITS } from "@/lib/utils";
import type { Plan } from "@/lib/utils";

interface TeamMember {
  id: string;
  invited_email: string;
  role: string;
  status: string;
  user_id?: string;
  invitation_token?: string;
  profiles?: { full_name: string | null; email?: string | null };
}

interface Team {
  id: string;
  name: string;
  owner_id: string;
  plan: string;
  profiles?: { full_name: string | null };
}

interface TeamsPageProps {
  teamId?: string;
  plan?: Plan;
}

export function TeamsPage({ teamId, plan = "free" }: TeamsPageProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [membersMap, setMembersMap] = useState<Record<string, TeamMember[]>>({});
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel("team_members_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_members" },
        () => { fetchAll(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchAll() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setCurrentUserId(user.id);

    const [{ data: ownedTeams }, { data: memberTeamIds }] = await Promise.all([
      supabase.from("teams").select("*, profiles(full_name)").eq("owner_id", user.id),
      supabase.from("team_members").select("team_id").eq("user_id", user.id).eq("status", "active"),
    ]);

    let allTeams = ownedTeams || [];

    if (memberTeamIds && memberTeamIds.length > 0) {
      const ids = memberTeamIds.map((m: any) => m.team_id);
      const { data: memberTeams } = await supabase
        .from("teams").select("*, profiles(full_name)").in("id", ids);
      if (memberTeams) {
        allTeams = [
          ...allTeams,
          ...memberTeams.filter((t: any) => !allTeams.some((e: any) => e.id === t.id)),
        ];
      }
    }

    setTeams(allTeams);

    // Fetch members for all teams
    if (allTeams.length > 0) {
      const allTeamIds = allTeams.map((t: any) => t.id);
      const { data: members } = await supabase
        .from("team_members")
        .select("*, profiles(full_name)")
        .in("team_id", allTeamIds);

      const map: Record<string, TeamMember[]> = {};
      for (const t of allTeams) {
        map[t.id] = (members || []).filter((m: any) => m.team_id === t.id);
      }
      setMembersMap(map);
    }

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (editingId) {
        const { error } = await supabase.from("teams").update({ name: formData.name }).eq("id", editingId);
        if (error) throw error;
        toast.success("Équipe modifiée");
      } else {
        const { error } = await supabase.from("teams").insert([{ name: formData.name, owner_id: user.id }]);
        if (error) throw error;
        toast.success("Équipe créée");
      }
      setFormData({ name: "" });
      setEditingId(null);
      setShowForm(false);
      fetchAll();
    } catch {
      toast.error("Erreur lors de l'opération");
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) { toast.error("Erreur lors de la suppression"); return; }
    toast.success("Équipe supprimée");
    fetchAll();
  }

  async function handleInviteMember(e: React.FormEvent, teamId: string) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    // Guard: check member limit for the team's plan (owner counts as 1)
    const currentTeam = teams.find((t) => t.id === teamId);
    const teamPlan = ((currentTeam?.plan || "free") as Plan);
    const maxExtra = PLAN_LIMITS[teamPlan].members - 1;
    const currentMembers = membersMap[teamId] || [];
    if (currentMembers.length >= maxExtra) {
      toast.error("Limite de membres atteinte. Passez à un plan supérieur pour inviter plus de collaborateurs.");
      return;
    }

    setInviteLoading(true);
    const token = crypto.randomUUID();

    try {
      const { error } = await supabase.from("team_members").insert([{
        team_id: teamId,
        invited_email: inviteEmail.trim(),
        role: inviteRole,
        status: "pending",
        invitation_token: token,
      }]);

      if (error) throw error;
      toast.success("Invitation créée — copiez le lien ci-dessous");
      setInviteEmail("");
      setInviteRole("member");
      fetchAll();
    } catch {
      toast.error("Erreur lors de l'invitation");
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    const { error } = await supabase.from("team_members").delete().eq("id", memberId);
    if (error) { toast.error("Erreur lors de la suppression"); return; }
    toast.success("Membre retiré");
    fetchAll();
  }

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/invitation/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success("Lien copié !");
    setTimeout(() => setCopiedToken(null), 2000);
  }

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      owner: "bg-yellow-100 text-yellow-700",
      admin: "bg-blue-100 text-[var(--brand-blue)]",
      member: "bg-gray-100 text-gray-600",
    };
    const labels: Record<string, string> = { owner: "Propriétaire", admin: "Admin", member: "Membre" };
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[role] || map.member}`}>
        {labels[role] || role}
      </span>
    );
  };

  const statusBadge = (status: string) => {
    if (status === "active") return <span className="text-xs text-green-600 font-medium">Actif</span>;
    return <span className="text-xs text-amber-500 font-medium">En attente</span>;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--brand-dark)]">Équipes</h1>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: "" }); }} className="gap-2">
          <Plus size={18} />
          <span className="hidden sm:inline">Nouvelle équipe</span>
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'équipe</label>
                <Input
                  type="text"
                  placeholder="Ex: Agence Digitale"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="green">{editingId ? "Modifier" : "Créer"}</Button>
                <Button type="button" onClick={() => setShowForm(false)} variant="secondary">Annuler</Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {teams.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-4">Aucune équipe pour le moment</p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus size={16} /> Créer une équipe
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {teams.map((team) => {
            const members = membersMap[team.id] || [];
            const isOwner = team.owner_id === currentUserId;

            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-200 p-6"
              >
                {/* Team header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-purple)] flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">{team.name[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[var(--brand-dark)]">{team.name}</h2>
                      <p className="text-sm text-gray-500 capitalize">Plan {team.plan}</p>
                    </div>
                  </div>
                  {isOwner && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => { setFormData({ name: team.name }); setEditingId(team.id); setShowForm(true); }}>
                        <Edit2 size={15} />
                      </Button>
                      {deleteConfirmId === team.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(team.id)}>Confirmer</Button>
                          <Button size="sm" variant="secondary" onClick={() => setDeleteConfirmId(null)}>Annuler</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => setDeleteConfirmId(team.id)}>
                          <Trash2 size={15} className="text-red-500" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Members list */}
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-sm font-semibold text-[var(--brand-dark)] mb-3">
                    Membres ({members.length + 1})
                  </h3>

                  <div className="space-y-2 mb-5">
                    {/* Owner row */}
                    <div className="flex items-center justify-between bg-yellow-50 border border-yellow-100 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-yellow)] to-orange-400 flex items-center justify-center shrink-0">
                          <Crown size={14} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--brand-dark)]">
                            {team.profiles?.full_name || "Propriétaire"}
                            {isOwner && <span className="text-gray-400 font-normal"> (vous)</span>}
                          </p>
                          <p className="text-xs text-gray-500">Propriétaire de l'équipe</p>
                        </div>
                      </div>
                      {roleBadge("owner")}
                    </div>

                    {/* Other members */}
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-purple)] flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold">
                              {(member.profiles?.full_name || member.invited_email)[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--brand-dark)]">
                              {member.profiles?.full_name || member.invited_email}
                            </p>
                            <div className="flex items-center gap-2">
                              {statusBadge(member.status)}
                              {member.status === "pending" && member.invitation_token && (
                                <button
                                  onClick={() => copyInviteLink(member.invitation_token!)}
                                  className="flex items-center gap-1 text-xs text-[var(--brand-blue)] hover:underline"
                                >
                                  {copiedToken === member.invitation_token ? <Check size={11} /> : <Copy size={11} />}
                                  Copier le lien
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {roleBadge(member.role)}
                          {isOwner && (
                            <Button size="sm" variant="secondary" onClick={() => handleRemoveMember(member.id)}>
                              <X size={14} className="text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Invite form — owner only */}
                  {isOwner && (() => {
                    const teamPlan = ((team.plan || "free") as Plan);
                    const maxExtra = PLAN_LIMITS[teamPlan].members - 1;
                    const atLimit = members.length >= maxExtra;

                    if (atLimit) {
                      return (
                        <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 p-4 rounded-xl">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                            <Lock size={14} className="text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-purple-800">
                              Limite de membres atteinte
                            </p>
                            <p className="text-xs text-purple-600 mt-0.5">
                              {teamPlan === "free"
                                ? "Le plan Gratuit n'autorise pas d'invitations. Passez à Premium pour 2 membres."
                                : "Passez au plan Business pour des membres illimités."}
                            </p>
                          </div>
                          <Link
                            href="/settings?tab=abonnement"
                            className="relative overflow-hidden shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--brand-purple)] hover:opacity-90 transition-all"
                          >
                            <motion.span
                              className="pointer-events-none absolute inset-0"
                              style={{
                                background:
                                  "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.45) 50%, transparent 65%)",
                              }}
                              initial={{ x: "-100%" }}
                              animate={{ x: "200%" }}
                              transition={{
                                duration: 0.7,
                                ease: "easeInOut",
                                repeat: Infinity,
                                repeatDelay: 3.3,
                              }}
                            />
                            <span className="relative">
                              {teamPlan === "free" ? "Passer à Premium" : "Passer à Business"}
                            </span>
                          </Link>
                        </div>
                      );
                    }

                    return (
                      <form onSubmit={(e) => handleInviteMember(e, team.id)} className="space-y-3 bg-gray-50 border border-gray-100 p-4 rounded-xl">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Inviter un collaborateur</p>
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="flex-1"
                          />
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-[var(--brand-dark)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]"
                          >
                            <option value="member">Membre</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <Button type="submit" className="w-full gap-2" disabled={inviteLoading || !inviteEmail.trim()}>
                          <UserPlus size={15} />
                          {inviteLoading ? "Création..." : "Générer le lien d'invitation"}
                        </Button>
                      </form>
                    );
                  })()}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
