"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--brand-blue)] flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--brand-dark)] mb-2">Pas de connexion</h1>
        <p className="text-gray-500 mb-6">Vérifiez votre connexion internet et réessayez.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-[var(--brand-blue)] text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
