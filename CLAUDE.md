# TrackHour — Instructions pour Claude

## Contexte projet
SaaS de time tracking (alternative française à Toggl Track) pour freelances et agences.
App uniquement en **français**. Pas de i18n pour l'instant.

## Stack technique
- **Next.js 16** (App Router, `src/` dir, alias `@/*`)
- **Supabase** — Auth + PostgreSQL + Realtime (timer persistant)
- **Stripe** — abonnements, facturation par siège (owner paye pour ses membres)
- **Tailwind CSS** + **Framer Motion** (animations)
- **shadcn/ui** installé manuellement dans `src/components/ui/`
- **Recharts** — graphiques stats
- **React PDF** — export PDF client
- **Zustand** — state global (timer, session)
- **lucide-react** — icônes
- **date-fns** + locale `fr`
- **sonner** — toasts
- **Vercel** — déploiement cible

## Plans tarifaires Stripe
| Plan | Prix mensuel | Projets | Clients | Membres | PDF export |
|---|---|---|---|---|---|
| `free` | 0€ | 10 | 5 | 1 | ❌ |
| `premium` | 4.5€ | 20 | 15 | 2 | ✅ |
| `business` | 15€ | ∞ | ∞ | ∞ | ✅ |

Remises annuelles : Premium -10%, Business -20%.
Les limites sont définies dans `src/lib/utils.ts` → `PLAN_LIMITS`.

## Palette de couleurs (brand)
```
--brand-blue:      #3333FF   (primary, actions)
--brand-pink:      #FF6EB4   (accent, prix)
--brand-purple:    #7B3FE4   (secondary)
--brand-yellow:    #F5A623   (warning, Business plan)
--brand-green:     #00D68F   (success, timer actif, CTA)
--brand-dark:      #1A0B2E   (textes principaux)
--brand-card-dark: #2D1B4E   (cards pricing)
--background:      #F2F2F2   (fond global)
```

## Architecture des routes
```
src/app/
├── (marketing)/          ← Landing page publique (layout avec Navbar + Footer)
│   ├── page.tsx          ← Home (Hero + Features + HowItWorks + Pricing + CTA)
│   ├── fonctionnalites/
│   └── tarifs/
├── (auth)/               ← Layout split 50/50 (branding gauche, form droite)
│   ├── connexion/
│   └── inscription/
├── (dashboard)/          ← Layout avec Sidebar + TopBar (auth-gated)
│   ├── dashboard/        ← Vue d'ensemble semaine
│   ├── timer/            ← Timer Toggl-like + liste entrées
│   ├── projets/          ← CRUD projets
│   ├── clients/          ← CRUD clients
│   ├── equipes/          ← CRUD équipes + invitations
│   ├── rapports/         ← Stats + export PDF
│   └── parametres/       ← Profil + abonnement Stripe
└── api/
    ├── auth/callback/    ← Supabase OAuth callback
    ├── stripe/
    │   ├── webhook/      ← Écoute événements Stripe
    │   └── checkout/     ← Créer session checkout
    ├── timer/start|stop|current/
    ├── teams/ clients/ projects/ tasks/ time-entries/
    └── reports/pdf/
```

## Schema base de données (Supabase)
Tables : `profiles`, `teams`, `team_members`, `clients`, `projects`, `tasks`, `time_entries`

**Points clés :**
- `time_entries.ended_at IS NULL` = timer en cours
- Index unique : 1 seul timer actif par user (`one_running_timer_per_user`)
- `projects.is_private` = visible uniquement par le créateur (sauf owner de l'équipe)
- RLS activé sur toutes les tables
- Trigger `handle_new_user()` : crée automatiquement un `profile` à l'inscription
- Migration complète dans `supabase/migrations/001_initial_schema.sql`

## Rôles utilisateurs
- `owner` — crée l'équipe, paye l'abonnement, voit toutes les stats d'équipe
- `admin` — gère membres et projets
- `member` — voit uniquement ses propres stats
- Les invitations passent par email → `team_members.invitation_token`

## Fichiers clés à connaître
```
src/lib/supabase/client.ts     → createClient() côté browser
src/lib/supabase/server.ts     → createClient() + createServiceClient() côté serveur
src/lib/supabase/types.ts      → Types DB (à régénérer quand Supabase est connecté)
src/lib/utils.ts               → formatDuration, formatCurrency, calculateEarnings,
                                  PLAN_LIMITS, PROJECT_COLORS
src/middleware.ts               → Auth guard (routes protégées / publiques)
src/components/ui/             → Composants shadcn (Button, Input, Card, ...)
src/components/marketing/      → Landing page components
src/components/dashboard/      → Sidebar, TopBar, DashboardOverview
src/components/timer/          → TimerPage
```

## Variables d'environnement requises (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PREMIUM_MONTHLY_PRICE_ID
STRIPE_PREMIUM_YEARLY_PRICE_ID
STRIPE_BUSINESS_MONTHLY_PRICE_ID
STRIPE_BUSINESS_YEARLY_PRICE_ID
NEXT_PUBLIC_APP_URL
```

## Conventions de code
- **Composants page** : Server Components par défaut, `"use client"` seulement si besoin d'état/events
- **Animations** : toujours Framer Motion (`motion.div`, `AnimatePresence`), jamais CSS keyframes seul pour les interactions
- **Forms** : état local React (pas de lib externe), validation manuelle en français
- **Erreurs** : toasts via `sonner`, messages d'erreur en français
- **Types Supabase** : actuellement `any` (à régénérer avec `supabase gen types` quand le projet est connecté)
- **Imports** : toujours alias `@/` jamais de chemins relatifs `../../`
- **Pas de `useEffect` pour le fetch** : utiliser les Server Components + `supabase` serveur

## Fonctionnalités à construire (par ordre de priorité)
- [x] Landing page
- [x] Auth (connexion / inscription)
- [x] Layout dashboard (sidebar + topbar)
- [x] Dashboard overview
- [x] Timer (start/stop persistant, groupé par date)
- [ ] CRUD Projets (liste, modale création/édition, couleur picker, visibilité)
- [ ] CRUD Clients (liste, modale, couleur)
- [ ] CRUD Équipes (créer équipe, inviter par email, accepter invitation)
- [ ] CRUD Tâches (dans les projets, avec TJM)
- [ ] Rapports (Recharts : par heure, projet, mois, équipe)
- [ ] Export PDF (par client, format rapport de facturation)
- [ ] Stripe (checkout, webhook, plan gating, portail client)
- [ ] Paramètres (profil, avatar, danger zone)
- [ ] PWA (manifest + service worker pour "lancer au démarrage")

## Notes importantes
- L'utilisateur vient de **Bubble** (nocode) — faire des parallèles si besoin pour expliquer
- Timer doit être **persistant** : démarrer sur appareil A, voir sur appareil B
- PDF export = rapport de facturation par client (heures × TJM)
- Stats : owner voit toute l'équipe, member voit seulement ses propres données
- Stripe : l'owner de l'équipe paye pour tous les membres inclus dans son plan
- PWA : `next-pwa` ou manifest manuel pour permettre l'installation sur mobile/desktop
