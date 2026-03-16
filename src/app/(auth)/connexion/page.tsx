"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleButton } from "@/components/ui/google-button";
import { createClient } from "@/lib/supabase/client";

function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--brand-dark)]">
          Bon retour 👋
        </h1>
        <p className="text-gray-500 mt-2">
          Connectez-vous à votre espace TrackHour
        </p>
      </div>

      {/* Google OAuth */}
      <GoogleButton label="Continuer avec Google" />

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">ou par email</span>
        <div className="flex-1 h-px bg-gray-200" />
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

        <div className="relative">
          <Input
            label="Mot de passe"
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

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3"
          >
            {error}
          </motion.p>
        )}

        <div className="flex items-center justify-end">
          <Link href="/mot-de-passe-oublie" className="text-sm text-[var(--brand-blue)] hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Se connecter
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Pas encore de compte ?{" "}
        <Link
          href={redirectTo !== "/dashboard" ? `/inscription?redirectTo=${encodeURIComponent(redirectTo)}` : "/inscription"}
          className="font-semibold text-[var(--brand-blue)] hover:underline"
        >
          Créer un compte gratuit
        </Link>
      </p>
    </motion.div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-2xl" />}>
      <ConnexionForm />
    </Suspense>
  );
}
