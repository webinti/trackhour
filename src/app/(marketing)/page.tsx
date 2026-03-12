import type { Metadata } from "next";
import { HeroSection } from "@/components/marketing/hero-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works";
import { PricingSection } from "@/components/marketing/pricing-section";
import { CTASection } from "@/components/marketing/cta-section";

export const metadata: Metadata = {
  title: "TrackHour — Logiciel de suivi du temps et gestion de projets",
  description:
    "Suivez vos heures par projet, gérez vos clients et facturez-les facilement. TrackHour est l'outil de time tracking conçu pour les freelances et agences françaises.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <div id="fonctionnalites"><FeaturesSection /></div>
      <HowItWorksSection />
      <div id="tarifs"><PricingSection /></div>
      <CTASection />
    </>
  );
}
