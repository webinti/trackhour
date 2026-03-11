"use client";

import { motion } from "framer-motion";
import { Clock, FolderKanban, Users, TrendingUp, Play, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { formatDuration, formatDurationHuman } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface DashboardOverviewProps {
  teams: any[];
  activeTimer: any;
  recentEntries: any[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{label}</p>
              <p className="text-2xl font-extrabold text-[var(--brand-dark)]">{value}</p>
            </div>
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${color}18` }}
            >
              <Icon size={20} style={{ color }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardOverview({
  teams,
  activeTimer,
  recentEntries,
}: DashboardOverviewProps) {
  const [elapsed, setElapsed] = useState(0);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [localTeams, setLocalTeams] = useState(teams);
  const supabase = createClient();

  useEffect(() => {
    setLocalTeams(teams);
  }, [teams]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setLoadingTeam(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Utilisateur non authentifié");
        return;
      }

      const { data, error } = await supabase
        .from("teams")
        .insert([{ name: teamName, owner_id: user.id }])
        .select();

      if (error) throw error;

      toast.success("Équipe créée avec succès !");
      setLocalTeams([...localTeams, data[0]]);
      setTeamName("");
      setShowCreateTeam(false);
    } catch (error) {
      toast.error("Erreur lors de la création de l'équipe");
      console.error(error);
    } finally {
      setLoadingTeam(false);
    }
  };

  // Calculate stats from recent entries
  const totalSecondsThisWeek = recentEntries.reduce((acc: number, entry: any) => {
    if (!entry.ended_at) return acc;
    const duration = (new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime()) / 1000;
    return acc + duration;
  }, 0);

  const uniqueProjects = new Set(recentEntries.map((e: any) => e.project_id)).size;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-extrabold text-[var(--brand-dark)]">
          Tableau de bord
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Votre activité de la semaine
        </p>
      </motion.div>

      {/* Active Timer Banner */}
      {activeTimer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-purple)] rounded-2xl p-5 text-white flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[var(--brand-green)] animate-pulse" />
            </div>
            <div>
              <p className="text-sm text-white/70">Timer en cours</p>
              <p className="font-bold">
                {activeTimer.tasks?.name || activeTimer.description || "Sans titre"}
              </p>
              {activeTimer.projects && (
                <p className="text-xs text-white/60 mt-0.5">
                  {activeTimer.projects.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-mono font-extrabold tracking-wider">
              {formatDuration(elapsed)}
            </span>
            <Button asChild size="sm" className="bg-white text-[var(--brand-blue)] hover:bg-gray-100">
              <Link href="/timer">Voir le timer</Link>
            </Button>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label="Heures cette semaine"
          value={formatDurationHuman(Math.floor(totalSecondsThisWeek))}
          color="#3333FF"
          delay={0.05}
        />
        <StatCard
          icon={FolderKanban}
          label="Projets actifs"
          value={String(uniqueProjects)}
          color="#7B3FE4"
          delay={0.1}
        />
        <StatCard
          icon={Users}
          label="Équipes"
          value={String(teams.length)}
          color="#FF6EB4"
          delay={0.15}
        />
        <StatCard
          icon={TrendingUp}
          label="Sessions cette semaine"
          value={String(recentEntries.length)}
          color="#F5A623"
          delay={0.2}
        />
      </div>

      {/* Quick Actions + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Button asChild variant="default" className="w-full justify-start gap-3">
                <Link href="/timer">
                  <Play size={15} />
                  Démarrer un timer
                </Link>
              </Button>
              <Button asChild variant="secondary" className="w-full justify-start gap-3">
                <Link href="/projects/new">
                  <FolderKanban size={15} />
                  Nouveau projet
                </Link>
              </Button>
              <Button asChild variant="secondary" className="w-full justify-start gap-3">
                <Link href="/clients/new">
                  <Users size={15} />
                  Nouveau client
                </Link>
              </Button>
              <Button asChild variant="secondary" className="w-full justify-start gap-3">
                <Link href="/reports">
                  <TrendingUp size={15} />
                  Voir les rapports
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Entries */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle>Entrées récentes</CardTitle>
              <Link href="/timer" className="text-xs text-[var(--brand-blue)] hover:underline font-medium">
                Tout voir
              </Link>
            </CardHeader>
            <CardContent>
              {recentEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aucune entrée cette semaine</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link href="/timer">Démarrer maintenant →</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentEntries.slice(0, 6).map((entry: any) => {
                    const duration =
                      (new Date(entry.ended_at).getTime() -
                        new Date(entry.started_at).getTime()) /
                      1000;
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                entry.projects?.color || "#3333FF",
                            }}
                          />
                          <div>
                            <p className="text-sm font-medium text-[var(--brand-dark)]">
                              {entry.tasks?.name ||
                                entry.description ||
                                "Sans titre"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {entry.projects?.name || "Sans projet"}
                              {entry.projects?.clients?.name
                                ? ` · ${entry.projects.clients.name}`
                                : ""}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-mono font-semibold text-[var(--brand-dark)]">
                          {formatDuration(Math.floor(duration))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Teams */}
      {localTeams.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Mes équipes</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/teams">Gérer →</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {localTeams.map((team: any) => (
                  <Link
                    key={team.id}
                    href={`/equipes/${team.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[var(--brand-blue)] hover:bg-blue-50/50 transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-purple)] flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">
                        {team.name[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--brand-dark)]">
                        {team.name}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">
                        Plan {team.plan}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* No teams CTA */}
      {localTeams.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card className="border-2 border-dashed">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100/50 flex items-center justify-center mx-auto mb-4">
                  <Users size={32} className="text-[var(--brand-blue)]" />
                </div>
                <h3 className="font-bold text-lg text-[var(--brand-dark)] mb-2">
                  Créez votre première équipe
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Invitez vos collaborateurs et commencez à tracker ensemble
                </p>

                {!showCreateTeam ? (
                  <Button
                    onClick={() => setShowCreateTeam(true)}
                    className="gap-2"
                  >
                    <Plus size={18} />
                    Créer une équipe
                  </Button>
                ) : (
                  <form onSubmit={handleCreateTeam} className="space-y-4 max-w-xs mx-auto">
                    <div>
                      <Input
                        type="text"
                        placeholder="Nom de l'équipe"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        disabled={loadingTeam}
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button
                        type="submit"
                        variant="green"
                        disabled={loadingTeam || !teamName.trim()}
                      >
                        {loadingTeam ? "Création..." : "Créer"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowCreateTeam(false);
                          setTeamName("");
                        }}
                      >
                        <X size={18} />
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
