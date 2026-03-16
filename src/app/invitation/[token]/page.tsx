"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<"loading" | "found" | "accepted" | "error" | "already_used">("loading");
  const [invitation, setInvitation] = useState<any>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    async function checkInvitation() {
      const res = await fetch(`/api/invitation/${token}`);
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data = await res.json();
      if (data.status === "active") {
        setStatus("already_used");
        return;
      }
      setInvitation(data);
      setStatus("found");
    }

    if (token) checkInvitation();
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/connexion?redirectTo=/invitation/${token}`);
      return;
    }

    const res = await fetch(`/api/invitation/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });

    if (!res.ok) {
      const data = await res.json();
      if (data.error === "Déjà acceptée") {
        setStatus("already_used");
      } else {
        setStatus("error");
      }
      setAccepting(false);
      return;
    }

    setStatus("accepted");
    setTimeout(() => router.push("/dashboard"), 2500);
  }

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center"
      >
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Image src="/icon.svg" alt="TrackHour" width={24} height={24} />
          <span className="font-bold text-lg text-[var(--brand-dark)]">TrackHour</span>
        </Link>

        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <Loader2 size={36} className="text-[var(--brand-blue)] animate-spin" />
            <p className="text-gray-500 text-sm">Vérification de l'invitation...</p>
          </div>
        )}

        {status === "found" && invitation && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-purple)] flex items-center justify-center mx-auto mb-5">
              <span className="text-white text-2xl font-bold">
                {invitation.teams?.name?.[0]?.toUpperCase()}
              </span>
            </div>
            <h1 className="text-xl font-bold text-[var(--brand-dark)] mb-2">Vous êtes invité !</h1>
            <p className="text-gray-500 text-sm mb-2">Vous avez été invité à rejoindre l'équipe</p>
            <p className="font-bold text-[var(--brand-dark)] text-lg mb-1">{invitation.teams?.name}</p>
            <p className="text-xs text-gray-400 mb-8 capitalize">
              Rôle : {invitation.role === "admin" ? "Administrateur" : "Membre"}
            </p>
            <Button onClick={handleAccept} disabled={accepting} className="w-full gap-2" variant="green">
              {accepting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              {accepting ? "Acceptation..." : "Accepter l'invitation"}
            </Button>
            <p className="text-xs text-gray-400 mt-4">
              Vous devrez vous connecter ou créer un compte si ce n'est pas déjà fait.
            </p>
          </>
        )}

        {status === "accepted" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <CheckCircle2 size={48} className="text-[var(--brand-green)]" />
            <h1 className="text-xl font-bold text-[var(--brand-dark)]">Invitation acceptée !</h1>
            <p className="text-gray-500 text-sm">Redirection vers votre tableau de bord...</p>
          </div>
        )}

        {status === "already_used" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <CheckCircle2 size={48} className="text-[var(--brand-blue)]" />
            <h1 className="text-xl font-bold text-[var(--brand-dark)]">Invitation déjà acceptée</h1>
            <p className="text-gray-500 text-sm">Ce lien a déjà été utilisé.</p>
            <Button asChild className="mt-2"><Link href="/dashboard">Aller au dashboard →</Link></Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <XCircle size={48} className="text-red-400" />
            <h1 className="text-xl font-bold text-[var(--brand-dark)]">Lien invalide</h1>
            <p className="text-gray-500 text-sm">Ce lien d'invitation est invalide ou a expiré.</p>
            <Button asChild variant="secondary" className="mt-2"><Link href="/">Retour à l'accueil</Link></Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
