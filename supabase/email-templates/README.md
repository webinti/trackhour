# Modèles d'emails Supabase (français)

À coller dans Supabase → Authentication → Emails → Templates. Pour chaque modèle : remplacer le **Subject** et le **Message body** (source HTML), puis Save.

| Fichier | Modèle Supabase | Sujet |
|---|---|---|
| `confirm-signup.html` | Confirm sign up | Bienvenue sur TrackHour, confirmez votre email |
| `recovery.html` | Reset password | Réinitialisez votre mot de passe TrackHour |
| `magic-link.html` | Magic link or OTP | Votre lien de connexion TrackHour |
| `invite.html` | Invite user | Vous êtes invité à rejoindre une équipe sur TrackHour |
| `email-change.html` | Change email address | Confirmez votre nouvelle adresse email TrackHour |
| `reauthentication.html` | Reauthentication | Votre code de vérification TrackHour |

Variables utilisées : `{{ .ConfirmationURL }}` (lien d'action), `{{ .Email }}` / `{{ .NewEmail }}` (changement d'email), `{{ .Token }}` (code de réauthentification).
