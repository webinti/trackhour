"use client";

import { useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "free",
    name: "Gratuit",
    description: "Pour 1 utilisateur",
    monthlyPrice: 0,
    yearlyPrice: 0,
    badge: null,
    features: [
      "Time tracker",
      "10 projets",
      "5 clients",
      "1 membre par équipe",
    ],
    cta: "Choisir",
    highlight: false,
  },
  {
    id: "premium",
    name: "Premium",
    description: "Idéal pour les solopreneurs",
    monthlyPrice: 4.5,
    yearlyPrice: 4.5 * 12 * 0.9,
    badge: "-10 %",
    badgeColor: "bg-[var(--brand-green)]",
    features: [
      "Time tracker",
      "20 Projets",
      "15 Clients",
      "2 membres d'équipe",
      "Exporter vos tâches en PDF",
    ],
    cta: "Choisir",
    highlight: false,
  },
  {
    id: "business",
    name: "Business",
    description: "Idéal pour les agences",
    monthlyPrice: 15,
    yearlyPrice: 15 * 12 * 0.8,
    badge: "-20 %",
    badgeColor: "bg-[var(--brand-green)]",
    features: [
      "Time tracker",
      "Projets illimités",
      "Clients illimités",
      "Membres illimités",
      "Exporter vos tâches en PDF",
    ],
    cta: "Choisir",
    highlight: true,
  },
];

export function PricingSection() {
  const [yearly, setYearly] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="tarifs" className="py-24 bg-[#F2F2F2]" ref={ref}>
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-10"
        >
          <h2 className="text-4xl font-extrabold text-[var(--brand-dark)]">
            Nos tarifs
          </h2>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <span
              className={cn(
                "text-sm font-semibold transition-colors",
                !yearly ? "text-[var(--brand-dark)]" : "text-gray-400"
              )}
            >
              Mensuel
            </span>
            <button
              onClick={() => setYearly(!yearly)}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none",
                yearly ? "bg-[var(--brand-green)]" : "bg-gray-300"
              )}
            >
              <motion.div
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                animate={{ x: yearly ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span
              className={cn(
                "text-sm font-semibold transition-colors",
                yearly ? "text-[var(--brand-dark)]" : "text-gray-400"
              )}
            >
              Annuel
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => {
            const price = yearly ? plan.yearlyPrice / 12 : plan.monthlyPrice;
            const badge = yearly ? plan.badge : null;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-3xl p-8 flex flex-col gap-6 bg-[var(--brand-card-dark)] text-white relative overflow-hidden"
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <AnimatePresence>
                      {badge && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className={cn(
                            "text-xs font-bold px-3 py-1 rounded-full text-white",
                            plan.badgeColor
                          )}
                        >
                          {badge}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <p className="text-white/60 text-sm">{plan.description}</p>
                </div>

                <div className="h-px bg-white/10" />

                {/* Price */}
                <div className="flex items-end gap-1">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`${plan.id}-${yearly}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="text-4xl font-extrabold text-[var(--brand-pink)]"
                    >
                      {price === 0 ? "0 €" : `${price.toFixed(2)} €`}
                    </motion.span>
                  </AnimatePresence>
                  {price > 0 && (
                    <span className="text-white/50 text-sm mb-1">/ mois</span>
                  )}
                </div>

                {/* CTA */}
                {plan.highlight ? (
                  <Link
                    href="/inscription"
                    className="relative overflow-hidden block w-full rounded-lg py-2.5 bg-[var(--brand-purple)] hover:bg-purple-700 text-white text-sm font-semibold text-center transition-colors"
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
                    <span className="relative">{plan.cta} →</span>
                  </Link>
                ) : (
                  <Button
                    asChild
                    variant="secondary"
                    className="bg-white text-[var(--brand-dark)] hover:bg-gray-100"
                  >
                    <Link href="/inscription">{plan.cta} →</Link>
                  </Button>
                )}

                <div className="h-px bg-white/10" />

                {/* Features */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Les fonctionnalités offertes :
                  </p>
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2.5">
                      <Check
                        size={14}
                        className="shrink-0 text-[var(--brand-green)]"
                      />
                      <span className="text-sm text-white/80">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
