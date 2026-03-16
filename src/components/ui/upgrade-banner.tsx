"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpgradeBannerProps {
  variant: "limit" | "feature";
  message: string;
  /** Texte du bouton CTA, défaut "Passer à Premium" */
  cta?: string;
  className?: string;
}

/**
 * Bannière contextuelle d'upsell pour les utilisateurs Free.
 * - variant "limit"   : approche ou atteint une limite (fond ambre)
 * - variant "feature" : fonctionnalité réservée (fond violet)
 */
export function UpgradeBanner({
  variant,
  message,
  cta = "Passer à Premium",
  className,
}: UpgradeBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm",
        variant === "limit"
          ? "bg-amber-50 border-amber-200"
          : "bg-purple-50 border-purple-200",
        className
      )}
    >
      <span
        className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
          variant === "limit" ? "bg-amber-100" : "bg-purple-100"
        )}
      >
        {variant === "limit" ? (
          <Zap size={14} className="text-amber-600" />
        ) : (
          <Lock size={14} className="text-purple-600" />
        )}
      </span>

      <p
        className={cn(
          "flex-1 font-medium",
          variant === "limit" ? "text-amber-800" : "text-purple-800"
        )}
      >
        {message}
      </p>

      <Link
        href="/parametres?tab=abonnement"
        className={cn(
          "relative overflow-hidden shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
          variant === "limit"
            ? "bg-amber-500 hover:bg-amber-600 text-white"
            : "bg-[var(--brand-purple)] hover:opacity-90 text-white"
        )}
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
        <span className="relative">{cta}</span>
      </Link>
    </div>
  );
}
