"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleButton } from "@/components/ui/google-button";
import { createClient } from "@/lib/supabase/client";

export default function InscriptionPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 rounded-full bg-[var(--brand-green)]/10 flex items-center justify-center mx-auto mb-4">
          <Mail size={28} className="text-[var(--brand-green)]" />
        </div>
        <h2 className="text-2xl font-extrabold text-[var(--brand-dark)] mb-2">
          Vérifiez vos emails !
        </h2>
        <p className="text-gray-500">
          Un lien de confirmation a été envoyé à{" "}
          <span className="font-semibold text-[var(--brand-dark)]">{email}</span>.
          <br />
          Cliquez dessus pour activer votre compte.
        </p>
        <Link href="/connexion" className="mt-6 inline-block text-sm font-semibold text-[var(--brand-blue)] hover:underline">
          ← Retour à la connexion
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--brand-dark)]">
          Créer un compte 🚀
        </h1>
        <p className="text-gray-500 mt-2">
          Gratuit, sans carte bancaire requise
        </p>
      </div>

      {/* Google OAuth */}
      <GoogleButton label="S'inscrire avec Google" />

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">ou par email</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom complet"
          type="text"
          placeholder="Jean Dupont"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          icon={<User size={16} />}
        />

        <Input
          label="Email"
          type="email"
          placeholder="vous@exemple.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          icon={<Mail size={16} />}
        />

        <div className="relative">
          <Input
            label="Mot de passe"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 caractères"
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

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3"
          >
            {error}
          </motion.p>
        )}

        <p className="text-xs text-gray-400">
          En créant un compte, vous acceptez nos{" "}
          <Link href="/cgu" className="text-[var(--brand-blue)] hover:underline">CGU</Link>{" "}
          et notre{" "}
          <Link href="/confidentialite" className="text-[var(--brand-blue)] hover:underline">politique de confidentialité</Link>.
        </p>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Créer mon compte gratuit →
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-semibold text-[var(--brand-blue)] hover:underline">
          Se connecter
        </Link>
      </p>
    </motion.div>
  );
}
