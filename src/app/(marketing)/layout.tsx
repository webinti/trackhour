import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: {
    default: "TrackHour — Logiciel de gestion du temps pour équipes",
    template: "%s | TrackHour",
  },
  description:
    "TrackHour est un logiciel de suivi du temps et de gestion de projets pour freelances et agences. Suivez vos heures par projet, client et équipe. Exportez vos rapports en PDF.",
  keywords: [
    "logiciel suivi temps",
    "time tracking",
    "gestion projet",
    "facturation freelance",
    "tracker heures travail",
    "timesheet",
    "toggl alternative française",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "TrackHour",
    title: "TrackHour — Logiciel de gestion du temps pour équipes",
    description:
      "Suivez vos heures, gérez vos projets et facturez vos clients avec TrackHour.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrackHour",
    description: "Logiciel de suivi du temps et gestion de projets",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
