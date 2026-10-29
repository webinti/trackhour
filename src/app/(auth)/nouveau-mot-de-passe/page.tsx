"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function NouveauMotDePassePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionState, setSessionState] = useState<"checking" | "ok" | "missing">("checking");

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setSessionState(data.user ? "ok" : "missing"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("Impossible de modifier le mot de passe. Le lien a peut-être expiré.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (sessionState === "missing") {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-2xl font-extrabold text-[var(--brand-dark)] mb-3">Lien invalide ou expiré</h1>
        <p className="text-gray-500 mb-8">Demandez un nouveau lien de réinitialisation pour continuer.</p>
        <Link href="/mot-de-passe-oublie" className="text-sm font-semibold text-[var(--brand-blue)] hover:underline">
          Recevoir un nouveau lien
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--brand-dark)]">Nouveau mot de passe</h1>
        <p className="text-gray-500 mt-2">Choisissez un mot de passe d&apos;au moins 8 caractères.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            label="Nouveau mot de passe"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            icon={<Lock size={16} />}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <Input
          label="Confirmer le mot de passe"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          icon={<Lock size={16} />}
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

        <Button type="submit" className="w-full" size="lg" loading={loading} disabled={sessionState !== "ok"}>
          Enregistrer le mot de passe
        </Button>
      </form>
    </motion.div>
  );
}
