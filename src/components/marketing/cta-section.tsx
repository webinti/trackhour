"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 bg-white" ref={ref}>
      <div className="max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-[#3333FF] to-[#7B3FE4] rounded-3xl p-14 text-white relative overflow-hidden"
        >
          {/* Background shapes */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-20 translate-x-20" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-16 -translate-x-16" />

          <h2 className="text-4xl font-extrabold mb-4 relative z-10">
            Prêt à tracker vos heures ?
          </h2>
          <p className="text-white/70 text-lg mb-8 relative z-10">
            Rejoignez les équipes qui gagnent du temps avec TrackHour.
            <br />
            Commencez gratuitement, sans carte bancaire.
          </p>
          <div className="flex items-center justify-center gap-4 relative z-10">
            <Button asChild size="lg" className="bg-white text-[var(--brand-blue)] hover:bg-gray-50 font-bold">
              <Link href="/inscription">Créer mon compte gratuit</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10">
              <Link href="/tarifs">Voir les tarifs</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
