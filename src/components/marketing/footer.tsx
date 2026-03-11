import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-[var(--brand-dark)] text-white py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Image src="/icon.svg" alt="TrackHour" width={28} height={28} className="brightness-0 invert" />
              <span className="font-bold text-white">TrackHour</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              Le logiciel de suivi du temps conçu pour les équipes françaises.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-white/80">Produit</h4>
            <ul className="space-y-2">
              {["Fonctionnalités", "Tarifs", "Changelog"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-white/80">Légal</h4>
            <ul className="space-y-2">
              {["Mentions légales", "Politique de confidentialité", "CGU"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-white/80">Compte</h4>
            <ul className="space-y-2">
              {[
                { label: "Se connecter", href: "/connexion" },
                { label: "Créer un compte", href: "/inscription" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-white/50 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="h-px bg-white/10 mb-6" />
        <div className="flex items-center justify-between text-white/30 text-xs">
          <p>© {new Date().getFullYear()} TrackHour. Tous droits réservés.</p>
          <p>Fait avec ❤️ en France</p>
        </div>
      </div>
    </footer>
  );
}
