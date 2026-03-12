"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const NAV_LINKS = [
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#tarifs", label: "Tarifs" },
];

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50 flex justify-center px-4 py-4"
    >
      <nav className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-white/80 px-5 py-3 w-full max-w-5xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/icon.svg"
            alt="TrackHour logo"
            width={22}
            height={22}
            className="shrink-0"
          />
          <span className="font-bold text-lg text-[var(--brand-dark)] group-hover:text-[var(--brand-blue)] transition-colors">
            TrackHour
          </span>
        </Link>

        {/* Nav Links — masqués sur mobile */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-[var(--brand-dark)] transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          {!loading && user ? (
            <>
              <span className="hidden md:block text-sm font-medium text-gray-600">
                {user.email}
              </span>
              <Button asChild variant="green" size="sm">
                <Link href="/dashboard">Mon Dashboard →</Link>
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden md:block text-sm font-medium text-gray-600 hover:text-[var(--brand-dark)] transition-colors"
              >
                Connexion
              </Link>
              <Button asChild variant="green" size="sm">
                <Link href="/signup">Votre espace →</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </motion.header>
  );
}
