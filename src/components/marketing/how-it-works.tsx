"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Users, FolderKanban, Clock, FileText } from "lucide-react";

const STEPS = [
  {
    icon: Users,
    color: "#3333FF",
    bg: "#EEF0FF",
    step: "01",
    title: "Créez votre équipe",
    description:
      "Donnez un nom à votre équipe et invitez vos collaborateurs par email. Ils reçoivent une invitation et rejoignent en un clic.",
  },
  {
    icon: FolderKanban,
    color: "#7B3FE4",
    bg: "#F3EEFF",
    step: "02",
    title: "Ajoutez vos clients & projets",
    description:
      "Créez vos clients, assignez-les à une équipe. Puis créez autant de projets que vous voulez avec une couleur identifiable.",
  },
  {
    icon: Clock,
    color: "#FF6EB4",
    bg: "#FFF0F8",
    step: "03",
    title: "Trackez vos tâches",
    description:
      "Lancez le chronomètre sur une tâche. Il tourne en arrière-plan même si vous fermez le navigateur. Stop = temps enregistré.",
  },
  {
    icon: FileText,
    color: "#F5A623",
    bg: "#FFF8EE",
    step: "04",
    title: "Exportez & facturez",
    description:
      "Consultez vos rapports par client, projet ou équipe. Exportez en PDF pour envoyer directement à votre client.",
  },
];

export function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 bg-white" ref={ref}>
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-extrabold text-[var(--brand-dark)]">
            Comment ça marche ?
          </h2>
          <p className="text-gray-500 mt-3 text-lg">
            De la création du compte à la facture, en 4 étapes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-5 p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 group"
              >
                <div
                  className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                  style={{ backgroundColor: step.bg }}
                >
                  <Icon size={22} style={{ color: step.color }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-bold"
                      style={{ color: step.color }}
                    >
                      {step.step}
                    </span>
                    <h3 className="font-bold text-[var(--brand-dark)]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
