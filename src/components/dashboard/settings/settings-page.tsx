"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  User, ChevronDown, ChevronUp, Check, Zap, Building2,
  ExternalLink, UserCircle, CreditCard, TriangleAlert,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { PhoneInputField } from "@/components/ui/phone-input";
import type { Profile, Team } from "@/lib/supabase/types";

interface SettingsPageProps {
  profile: Profile | null;
  email: string;
  team: Team | null;
}

type Tab = "profil" | "entreprise" | "abonnement" | "danger";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "profil", label: "Profil", icon: UserCircle },
  { key: "entreprise", label: "Entreprise", icon: Building2 },
  { key: "abonnement", label: "Abonnement", icon: CreditCard },
  { key: "danger", label: "Danger Zone", icon: TriangleAlert },
];

const PLANS = [
  {
    key: "free" as const,
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    borderColor: "border-gray-200",
    icon: null,
    features: ["10 projets", "5 clients", "1 membre", "Pas d'export PDF"],
  },
  {
    key: "premium" as const,
    name: "Premium",
    monthlyPrice: 4.5,
    yearlyPrice: 4.05,
    borderColor: "border-[var(--brand-blue)]",
    icon: Zap,
    priceIds: { monthly: "premium_monthly", yearly: "premium_yearly" } as const,
    features: ["20 projets", "15 clients", "2 membres", "Export PDF ✓"],
  },
  {
    key: "business" as const,
    name: "Business",
    monthlyPrice: 15,
    yearlyPrice: 12,
    borderColor: "border-[var(--brand-purple)]",
    icon: Building2,
    priceIds: { monthly: "business_monthly", yearly: "business_yearly" } as const,
    features: ["Projets illimités", "Clients illimités", "Membres illimités", "Export PDF ✓"],
  },
];

export function SettingsPage({ profile, email, team }: SettingsPageProps) {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>("profil");

  // Profil
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phoneNumber, setPhoneNumber] = useState((profile as any)?.phone_number || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showEmailSection, setShowEmailSection] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Entreprise
  const [companyName, setCompanyName] = useState(team?.company_name || "");
  const [companyAddress, setCompanyAddress] = useState(team?.company_address || "");
  const [companyEmail, setCompanyEmail] = useState(team?.company_email || "");
  const [savingCompany, setSavingCompany] = useState(false);

  // Danger Zone
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Abonnement
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const currentPlan = team?.plan || "free";

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("Abonnement activé ! Merci 🎉");
      setActiveTab("abonnement");
      router.replace("/parametres");
    }
  }, [searchParams, router]);

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[var(--brand-dark)] focus:outline-none focus:border-[var(--brand-blue)] focus:ring-1 focus:ring-[var(--brand-blue)] transition-all";

  // --- Handlers Profil ---
  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName || null, phone_number: phoneNumber || null, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    if (error) toast.error("Erreur lors de la sauvegarde");
    else toast.success("Profil mis à jour");
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${profile.id}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error(`Upload échoué : ${uploadError.message}`);
      setUploadingAvatar(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
    setAvatarUrl(url);
    toast.success("Photo mise à jour");
    setUploadingAvatar(false);
  };

  const handleDeleteAvatar = async () => {
    if (!profile) return;
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", profile.id);
    setAvatarUrl("");
    toast.success("Photo supprimée");
  };

  const handleChangeEmail = async () => {
    if (!newEmail) return;
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) toast.error(error.message);
    else {
      toast.success(`Lien de confirmation envoyé à ${newEmail}`);
      setNewEmail("");
      setShowEmailSection(false);
    }
    setEmailLoading(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { toast.error("Les mots de passe ne correspondent pas"); return; }
    if (newPassword.length < 8) { toast.error("Minimum 8 caractères"); return; }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success("Mot de passe mis à jour");
      setNewPassword(""); setConfirmPassword(""); setShowPasswordSection(false);
    }
    setPasswordLoading(false);
  };

  // --- Handlers Entreprise ---
  const handleSaveCompany = async () => {
    setSavingCompany(true);
    if (team) {
      const { error } = await supabase
        .from("teams")
        .update({
          company_name: companyName || null,
          company_address: companyAddress || null,
          company_email: companyEmail || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", team.id);
      if (error) toast.error("Erreur lors de la sauvegarde");
      else toast.success("Informations entreprise mises à jour");
    } else {
      // Créer une équipe si elle n'existe pas encore
      const { error } = await supabase.from("teams").insert({
        name: companyName || "Mon équipe",
        owner_id: profile!.id,
        company_name: companyName || null,
        company_address: companyAddress || null,
        company_email: companyEmail || null,
      });
      if (error) toast.error("Erreur lors de la création");
      else toast.success("Entreprise créée");
    }
    setSavingCompany(false);
  };

  // --- Handler Danger Zone ---
  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") return;
    setDeleting(true);
    const res = await fetch("/api/account/delete", { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Erreur lors de la suppression");
      setDeleting(false);
      return;
    }
    await supabase.auth.signOut();
    router.push("/");
  };

  // --- Handlers Abonnement ---
  const handleUpgrade = async (priceKey: string) => {
    setCheckoutLoading(priceKey);
    const [planKey, period] = priceKey.split("_") as [string, string];
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, period }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error("Erreur lors de la création du paiement");
    } catch { toast.error("Erreur réseau"); }
    setCheckoutLoading(null);
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error("Erreur lors de l'ouverture du portail");
    } catch { toast.error("Erreur réseau"); }
    setPortalLoading(false);
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--brand-dark)] mb-5 md:mb-6">Paramètres</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-[var(--border)] rounded-xl p-1 w-fit mb-6 md:mb-8 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab.key === "danger"
                ? activeTab === "danger"
                  ? "bg-red-500 text-white shadow-sm"
                  : "text-red-400 hover:text-red-600"
                : activeTab === tab.key
                  ? "bg-[var(--brand-dark)] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
            )}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl">
        {/* ---- PROFIL ---- */}
        {activeTab === "profil" && (
          <motion.div key="profil" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Avatar */}
            <div className="bg-white rounded-2xl border border-[var(--border)] p-6">
              <h2 className="text-sm font-bold text-[var(--brand-dark)] mb-4">Photo de profil</h2>
              <div className="flex items-center gap-5">
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-purple)] flex items-center justify-center overflow-hidden shrink-0">
                  {avatarUrl
                    ? <Image src={avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
                    : <User size={28} className="text-white" />
                  }
                </div>
                <div className="space-y-1">
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
                    className="block text-sm font-medium text-[var(--brand-blue)] hover:underline disabled:opacity-50">
                    {uploadingAvatar ? "Chargement..." : "Modifier"}
                  </button>
                  {avatarUrl && (
                    <button onClick={handleDeleteAvatar}
                      className="block text-sm font-medium text-[var(--brand-pink)] hover:underline">
                      Supprimer
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </div>
              </div>
            </div>

            {/* Infos + sécurité */}
            <div className="bg-white rounded-2xl border border-[var(--border)] p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--brand-dark)] mb-2">Nom et prénom</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--brand-dark)] mb-2">Téléphone</label>
                <PhoneInputField value={phoneNumber} onChange={setPhoneNumber} />
              </div>

              {/* Email accordion */}
              <div className="border-t border-gray-100 pt-4">
                <button onClick={() => setShowEmailSection(!showEmailSection)}
                  className="w-full flex items-center justify-between text-sm font-medium text-[var(--brand-dark)] py-1">
                  <span>Changer mon adresse mail</span>
                  {showEmailSection ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                <AnimatePresence>
                  {showEmailSection && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="pt-3 space-y-3">
                        <p className="text-xs text-gray-400">Actuelle : <span className="font-medium text-gray-600">{email}</span></p>
                        <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Nouvelle adresse mail" className={inputClass} />
                        <button onClick={handleChangeEmail} disabled={!newEmail || emailLoading}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--brand-blue)] hover:bg-blue-700 disabled:opacity-40 transition-colors">
                          {emailLoading ? "Envoi..." : "Envoyer le lien de confirmation"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Password accordion */}
              <div className="border-t border-gray-100 pt-4">
                <button onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="w-full flex items-center justify-between text-sm font-medium text-[var(--brand-dark)] py-1">
                  <span>Changer mon mot de passe</span>
                  {showPasswordSection ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                <AnimatePresence>
                  {showPasswordSection && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="pt-3 space-y-3">
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nouveau mot de passe" className={inputClass} />
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirmer le mot de passe" className={inputClass} />
                        <button onClick={handleChangePassword} disabled={!newPassword || !confirmPassword || passwordLoading}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--brand-blue)] hover:bg-blue-700 disabled:opacity-40 transition-colors">
                          {passwordLoading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <button onClick={handleSaveProfile} disabled={saving}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[var(--brand-green)] hover:bg-emerald-500 disabled:opacity-40 transition-colors">
                  {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ---- ENTREPRISE ---- */}
        {activeTab === "entreprise" && (
          <motion.div key="entreprise" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-2xl border border-[var(--border)] p-6 space-y-4">
              <p className="text-xs text-gray-400">
                Ces informations apparaîtront sur vos rapports PDF et factures.
              </p>
              <div>
                <label className="block text-sm font-medium text-[var(--brand-dark)] mb-2">Nom de l'entreprise</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex : Studio Dupont" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--brand-dark)] mb-2">Adresse</label>
                <AddressAutocomplete
                  value={companyAddress}
                  onChange={setCompanyAddress}
                  placeholder="12 rue de la Paix, 75001 Paris"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--brand-dark)] mb-2">Email de contact</label>
                <input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="contact@monentreprise.fr" className={inputClass} />
              </div>
              <div className="border-t border-gray-100 pt-4">
                <button onClick={handleSaveCompany} disabled={savingCompany}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[var(--brand-green)] hover:bg-emerald-500 disabled:opacity-40 transition-colors">
                  {savingCompany ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ---- ABONNEMENT ---- */}
        {activeTab === "abonnement" && (
          <motion.div key="abonnement" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-2xl border border-[var(--border)] p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-[var(--brand-dark)]">Votre plan</h2>
                <span className={cn(
                  "text-xs font-semibold px-2.5 py-1 rounded-full",
                  currentPlan === "free" && "bg-gray-100 text-gray-600",
                  currentPlan === "premium" && "bg-blue-50 text-[var(--brand-blue)]",
                  currentPlan === "business" && "bg-purple-50 text-[var(--brand-purple)]",
                )}>
                  Plan {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                </span>
              </div>

              {team?.plan_period_end && currentPlan !== "free" && (
                <p className="text-xs text-gray-400 mb-1">
                  Renouvellement le {new Date(team.plan_period_end).toLocaleDateString("fr-FR")}
                </p>
              )}

              {/* Billing toggle */}
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1 w-fit mb-5 mt-4">
                <button onClick={() => setBillingPeriod("monthly")}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    billingPeriod === "monthly" ? "bg-white text-[var(--brand-dark)] shadow-sm" : "text-gray-500")}>
                  Mensuel
                </button>
                <button onClick={() => setBillingPeriod("yearly")}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    billingPeriod === "yearly" ? "bg-white text-[var(--brand-dark)] shadow-sm" : "text-gray-500")}>
                  Annuel <span className="text-[var(--brand-green)] font-semibold">-10%</span>
                </button>
              </div>

              {/* Plan cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PLANS.map((plan) => {
                  const isCurrent = currentPlan === plan.key;
                  const price = billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
                  const priceKey = plan.priceIds ? `${plan.key}_${billingPeriod}` : null;

                  return (
                    <div key={plan.key} className={cn(
                      "rounded-xl border-2 p-4 transition-all",
                      isCurrent ? plan.borderColor : "border-gray-100",
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {plan.icon && (
                            <plan.icon size={16} className={cn(
                              plan.key === "premium" && "text-[var(--brand-blue)]",
                              plan.key === "business" && "text-[var(--brand-purple)]",
                            )} />
                          )}
                          <span className="text-sm font-semibold text-[var(--brand-dark)]">{plan.name}</span>
                          {isCurrent && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Actuel</span>}
                        </div>
                        <span className="text-sm font-bold text-[var(--brand-dark)]">
                          {plan.monthlyPrice === 0 ? "Gratuit" : `${price}€/mois`}
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Check size={11} className="text-[var(--brand-green)] shrink-0" />{f}
                          </li>
                        ))}
                      </ul>
                      {!isCurrent && priceKey && (
                        <button onClick={() => handleUpgrade(priceKey)} disabled={!!checkoutLoading}
                          className={cn(
                            "relative overflow-hidden mt-3 w-full py-2 rounded-xl text-xs font-semibold text-white transition-colors disabled:opacity-40",
                            plan.key === "premium" && "bg-[var(--brand-blue)] hover:bg-blue-700",
                            plan.key === "business" && "bg-[var(--brand-purple)] hover:bg-purple-700",
                          )}>
                          {plan.key === "business" && (
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
                          )}
                          <span className="relative">
                            {checkoutLoading === priceKey ? "Chargement..." : `Passer au plan ${plan.name}`}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {team?.stripe_customer_id && currentPlan !== "free" && (
                <button onClick={handlePortal} disabled={portalLoading}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-40">
                  <ExternalLink size={14} />
                  {portalLoading ? "Ouverture..." : "Gérer mon abonnement"}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ---- DANGER ZONE ---- */}
        {activeTab === "danger" && (
          <motion.div key="danger" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-2xl border-2 border-red-200 p-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <TriangleAlert size={20} className="text-red-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-red-600">Supprimer mon compte</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Cette action est <span className="font-semibold text-red-500">irréversible</span>. Toutes vos données (projets, clients, temps enregistrés, équipes) seront définitivement supprimées.
                  </p>
                </div>
              </div>

              {currentPlan !== "free" ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-amber-700">
                    Vous avez un abonnement actif (Plan {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}).
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Veuillez d'abord résilier votre abonnement depuis l'onglet <button onClick={() => setActiveTab("abonnement")} className="underline font-semibold">Abonnement</button> avant de supprimer votre compte.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="text-sm text-red-600">
                      Pour confirmer la suppression, tapez <span className="font-mono font-bold">DELETE</span> dans le champ ci-dessous.
                    </p>
                  </div>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="Tapez DELETE pour confirmer"
                    className="w-full border-2 border-red-200 rounded-xl px-4 py-2.5 text-sm font-mono text-red-700 placeholder-red-300 focus:outline-none focus:border-red-400 transition-all bg-red-50"
                  />
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteInput !== "DELETE" || deleting}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {deleting ? "Suppression en cours..." : "Supprimer définitivement mon compte"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
