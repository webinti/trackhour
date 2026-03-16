"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Users, FolderKanban, Building2, Timer, CheckCircle2, ChevronRight, X } from "lucide-react";

interface OnboardingBannerProps {
  hasTeam: boolean;
  hasProject: boolean;
  hasClient: boolean;
  hasTimer: boolean;
  onCreateTeam?: () => void;
}

const STEPS = [
  {
    key: "team",
    icon: Users,
    title: "Créer votre équipe",
    description: "L'équipe est le point de départ — elle regroupe vos projets et clients.",
    href: "/equipes",
    cta: "Créer une équipe →",
    color: "#7B3FE4",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  {
    key: "client",
    icon: Building2,
    title: "Ajouter un client",
    description: "Associez vos projets à des clients pour mieux organiser votre facturation.",
    href: "/clients",
    cta: "Ajouter un client →",
    color: "#3333FF",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    key: "project",
    icon: FolderKanban,
    title: "Créer un projet",
    description: "Regroupez vos entrées de temps sous un même projet.",
    href: "/projets",
    cta: "Créer un projet →",
    color: "#F5A623",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    key: "timer",
    icon: Timer,
    title: "Démarrer votre premier timer",
    description: "Lancez le chrono et commencez à suivre votre temps !",
    href: "/timer",
    cta: "Aller au Timer →",
    color: "#00D68F",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
] as const;

export function OnboardingBanner({ hasTeam, hasProject, hasClient, hasTimer, onCreateTeam }: OnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const stepDone: Record<string, boolean> = {
    team: hasTeam,
    client: hasClient,
    project: hasProject,
    timer: hasTimer,
  };

  const completedCount = Object.values(stepDone).filter(Boolean).length;
  const allDone = completedCount === STEPS.length;

  // Hide if all done or dismissed
  if (allDone || dismissed) return null;

  // Next step to do
  const nextStep = STEPS.find((s) => !stepDone[s.key]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-base font-bold text-[var(--brand-dark)]">
              Bienvenue sur TrackHour 👋
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Suivez ces étapes pour démarrer — {completedCount}/{STEPS.length} complétées
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Fermer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-5 pb-4">
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / STEPS.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full bg-[var(--brand-green)]"
            />
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-gray-100">
          {STEPS.map((step, idx) => {
            const done = stepDone[step.key];
            const isNext = nextStep?.key === step.key;
            const Icon = step.icon;

            return (
              <div
                key={step.key}
                className={`relative flex flex-col gap-2 p-4 ${idx < STEPS.length - 1 ? "border-b sm:border-b-0 sm:border-r border-gray-100" : ""}`}
              >
                {/* Step icon + status */}
                <div className="flex items-center justify-between">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${done ? "bg-emerald-100" : `${step.bg}`}`}
                  >
                    {done ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <Icon size={16} style={{ color: step.color }} />
                    )}
                  </div>
                  {isNext && !done && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--brand-blue)] text-white">
                      Suivant
                    </span>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${done ? "text-gray-400 line-through" : "text-[var(--brand-dark)]"}`}>
                    {step.title}
                  </p>
                  {!done && (
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                  )}
                </div>

                {/* CTA */}
                {!done && (
                  step.key === "team" && onCreateTeam ? (
                    <button
                      onClick={onCreateTeam}
                      className={`inline-flex items-center gap-1 text-xs font-semibold mt-1 transition-opacity text-left ${isNext ? "opacity-100" : "opacity-40 hover:opacity-80"}`}
                      style={{ color: step.color }}
                    >
                      {step.cta}
                    </button>
                  ) : (
                    <Link
                      href={step.href}
                      className={`inline-flex items-center gap-1 text-xs font-semibold mt-1 transition-opacity ${isNext ? "opacity-100" : "opacity-40 hover:opacity-80"}`}
                      style={{ color: step.color }}
                    >
                      {step.cta}
                    </Link>
                  )
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
