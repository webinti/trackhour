"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";

const FEATURES = [
  {
    id: "simplifier",
    color: "#3333FF",
    label: "Simplifier",
    bubble: {
      keyword: "simplicité",
      text: "des actions à mener",
      prefix: "Votre succès dépend de la",
    },
  },
  {
    id: "collaborer",
    color: "#FF6EB4",
    label: "Collaborer",
    bubble: {
      keyword: "collaboration",
      text: "avec des experts",
      prefix: "Votre succès dépend d'une",
    },
  },
  {
    id: "automatiser",
    color: "#7B3FE4",
    label: "Automatiser",
    bubble: {
      keyword: "automatisation",
      text: "de vos processus répétitifs",
      prefix: "Votre succès dépend de l'",
    },
  },
  {
    id: "planifier",
    color: "#F5A623",
    label: "Planifier",
    bubble: {
      keyword: "planification",
      text: "intelligente de vos projets",
      prefix: "Votre succès dépend de la",
    },
  },
];

const DEFAULT_BUBBLE = {
  prefix: "Votre succès dépend d'une",
  keyword: "collaboration",
  text: "avec des experts",
};

// Position de la queue selon la carte survolée
// simplifier = top-left  → queue en haut à gauche de la bulle
// collaborer  = top-right → queue en haut à droite
// automatiser = bot-left  → queue en bas à gauche
// planifier   = bot-right → queue en bas à droite
const TAIL_CONFIG: Record<string, {
  top?: string; bottom?: string;
  left?: string; right?: string;
  rotate: string;
}> = {
  simplifier:  { top: "-22px",    left: "20%",  rotate: "0deg"    },
  collaborer:  { top: "-22px",    right: "20%", rotate: "0deg"    },
  automatiser: { bottom: "-22px", left: "20%",  rotate: "180deg"  },
  planifier:   { bottom: "-22px", right: "20%", rotate: "180deg"  },
};

export function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hovered, setHovered] = useState<string | null>(null);

  const activeFeature = FEATURES.find((f) => f.id === hovered);
  const bubbleContent = activeFeature?.bubble ?? DEFAULT_BUBBLE;
  const tailCfg = hovered ? TAIL_CONFIG[hovered] : null;

  return (
    <section className="py-28 bg-[#F2F2F2]" ref={ref}>
      <div className="max-w-5xl mx-auto px-6">
        {/* Top text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <h2 className="text-4xl font-extrabold text-[var(--brand-dark)] leading-tight">
            Réalisez vos plus belles idées,{" "}
            <span className="gradient-text">sans effort</span>
          </h2>
          <p className="text-gray-500 mt-4 text-base">
            Permettez à toutes vos équipes de se concentrer sur les tâches qui
            développent vos activités.
          </p>
        </motion.div>

        {/* 2×2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              onHoverStart={() => setHovered(feature.id)}
              onHoverEnd={() => setHovered(null)}
              className="rounded-3xl px-10 py-12 flex items-start cursor-default relative overflow-hidden group min-h-[200px]"
              style={{ backgroundColor: feature.color }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity duration-300 rounded-3xl bg-[radial-gradient(circle_at_30%_30%,white,transparent_60%)]" />
              <h3 className="text-3xl font-extrabold text-white relative z-10">
                {feature.label}
              </h3>
            </motion.div>
          ))}

          {/* ── Centre bubble ── */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-72">
            {/* Tail SVG */}
            <AnimatePresence>
              {tailCfg && (
                <motion.div
                  key={hovered}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute pointer-events-none"
                  style={{
                    top: tailCfg.top,
                    bottom: tailCfg.bottom,
                    left: tailCfg.left,
                    right: tailCfg.right,
                  }}
                >
                  <svg
                    width="44"
                    height="28"
                    viewBox="0 0 44 28"
                    fill="none"
                    style={{ transform: `rotate(${tailCfg.rotate})` }}
                  >
                    <path
                      d="M22 0 C22 0 10 18 0 28 L44 28 C34 18 22 0 22 0Z"
                      fill="white"
                    />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bubble */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-[32px] shadow-xl px-8 py-7 text-center"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={hovered ?? "default"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="text-base font-bold text-[var(--brand-dark)] leading-snug"
                >
                  {bubbleContent.prefix}{" "}
                  <span className="text-[var(--brand-pink)]">
                    {bubbleContent.keyword}
                  </span>{" "}
                  {bubbleContent.text}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
