"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent("/nouveau-mot-de-passe")}`,
    });

    if (error) {
      setError("Impossible d'envoyer l'email. Réessayez dans quelques minutes.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="w-16 h-16 bg-[var(--brand-green)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail size={28} className="text-[var(--brand-green)]" />
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--brand-dark)] mb-3">Email envoyé</h1>
        <p className="text-gray-500 mb-8">
          Si un compte existe pour <span className="font-semibold text-[var(--brand-dark)]">{email}</span>, vous recevrez
          un lien pour choisir un nouveau mot de passe. Pensez à vérifier vos spams.
        </p>
        <Link href="/connexion" className="text-sm font-semibold text-[var(--brand-blue)] hover:underline">
          Retour à la connexion
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--brand-dark)]">Mot de passe oublié</h1>
        <p className="text-gray-500 mt-2">
          Indiquez votre email, nous vous enverrons un lien pour le réinitialiser.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="vous@exemple.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          icon={<Mail size={16} />}
        />

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3"
          >
            {error}
          </motion.p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Envoyer le lien
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        <Link href="/connexion" className="font-semibold text-[var(--brand-blue)] hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </motion.div>
  );
}
