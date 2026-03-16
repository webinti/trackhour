import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F2F2F2] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#3333FF] to-[#7B3FE4] flex-col justify-between p-12 relative overflow-hidden">
        {/* Shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-3xl rotate-12" />
        <div className="absolute bottom-32 left-12 w-20 h-20 bg-[var(--brand-pink)]/30 rounded-full" />
        <div className="absolute top-1/2 right-8 w-14 h-14 bg-[var(--brand-yellow)]/40 rounded-2xl rotate-45" />

        <Link href="/" className="flex items-center gap-2 relative z-10">
          <Image src="/icon.svg" alt="TrackHour" width={22} height={22} className="brightness-0 invert" />
          <span className="font-bold text-xl text-white">TrackHour</span>
        </Link>

        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Chaque heure compte.
            <br />
            <span className="text-white/60">Trackez-les toutes.</span>
          </h2>
          <p className="text-white/60 text-lg">
            Rejoignez les équipes qui pilotent leur temps et leurs revenus avec TrackHour.
          </p>
        </div>

        <div className="flex gap-6 relative z-10">
          {[
            { value: "10k+", label: "Utilisateurs" },
            { value: "500k+", label: "Heures trackées" },
            { value: "4.9/5", label: "Note moyenne" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-extrabold text-white">{stat.value}</div>
              <div className="text-white/50 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 lg:hidden mb-8">
            <Image src="/icon.svg" alt="TrackHour" width={22} height={22} />
            <span className="font-bold text-[var(--brand-dark)]">TrackHour</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
