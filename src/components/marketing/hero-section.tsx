"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock } from "lucide-react";

const mockUI = {
  date: "11 Mars 2026",
  project: "Créer une app pour un client",
  tag: "Backend",
  tagColor: "#3333FF",
  tasks: 16,
  plan: "BUSINESS",
};

const swatchColors = ["#FBBF24", "#FF6EB4", "#FF6B35", "#7B3FE4"];

export function HeroSection() {
  return (
    <section className="relative bg-[#F2F2F2] overflow-hidden min-h-[85vh] flex items-center">
      <div className="max-w-6xl mx-auto px-8 py-20 w-full">
        <div className="flex flex-col md:flex-row items-center gap-16 lg:gap-24">

          {/* ── Texte gauche ── */}
          <div className="flex-1 min-w-0 space-y-8 text-center md:text-left z-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100"
            >
              <div className="w-2 h-2 rounded-full bg-[var(--brand-green)] animate-pulse" />
              <span className="text-xs font-semibold text-gray-600">
                Suivez vos heures. Facturez sans friction.
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-[var(--brand-dark)] leading-[1.1]"
            >
              Un logiciel de gestion du travail pour{" "}
              <span className="gradient-text">tous types</span>{" "}
              d&apos;entreprises
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto md:mx-0"
            >
              Estimez le temps passé par projet et invitez vos collaborateurs
              dans votre équipe avec TrackHour.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start"
            >
              <Button asChild variant="dark" size="lg">
                <Link href="/inscription">Créez un compte gratuit →</Link>
              </Button>
              <Link
                href="/tarifs"
                className="text-sm font-medium text-gray-500 hover:text-[var(--brand-dark)] transition-colors"
              >
                Voir les tarifs
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-center md:justify-start"
            >
              {[
                "Gratuit jusqu'à 10 projets",
                "Sans carte bancaire",
                "100% en français",
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[var(--brand-green)] shrink-0" />
                  <span className="text-xs text-gray-500">{item}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Visuel droite ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex-shrink-0 w-full md:w-[420px] lg:w-[480px] relative"
          >
            {/* Background blob */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#3333FF] to-[#7B3FE4] rounded-3xl" />

            {/* Floating shapes */}
            <motion.div
              animate={{ y: [0, -14, 0], rotate: [12, 20, 12] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-6 right-8 w-14 h-14 bg-[#FBBF24] rounded-2xl z-10"
            />
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4.5, delay: 1, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-10 right-6 w-10 h-10 bg-[#7B3FE4]/80 rounded-xl z-10"
            />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[45%] right-4 w-4 h-4 bg-[#FF6EB4] rounded-full z-10"
            />
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 3.5, delay: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[30%] left-10 w-3 h-3 bg-[#FBBF24] rounded-full z-10"
            />

            {/* Mock UI Card + swatches */}
            <div className="relative z-10 py-12 px-16 w-full">
              {/* Color swatches */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2.5">
                {swatchColors.map((color) => (
                  <motion.div
                    key={color}
                    whileHover={{ scale: 1.15, x: 5 }}
                    className="w-10 h-10 rounded-xl shadow-lg cursor-pointer"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-4">
                <p className="text-xs text-gray-400 font-medium">{mockUI.date}</p>
                <p className="font-semibold text-[var(--brand-dark)] text-sm leading-snug">
                  {mockUI.project}
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mockUI.tagColor }} />
                  <span className="text-xs font-semibold" style={{ color: mockUI.tagColor }}>
                    {mockUI.tag}
                  </span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3.5">
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-gray-400" />
                    <span className="text-sm font-medium text-[var(--brand-dark)]">Tâches</span>
                  </div>
                  <span className="bg-[var(--brand-blue)] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {mockUI.tasks}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 rounded bg-gray-300" />
                    <span className="text-sm font-medium text-[var(--brand-dark)]">Abonnement</span>
                  </div>
                  <span className="bg-[var(--brand-yellow)] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {mockUI.plan}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
