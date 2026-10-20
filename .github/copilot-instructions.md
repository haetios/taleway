# Taleway — Instructions agents IA

## Contexte projet

Plateforme de **romans interactifs** (histoires à choix multiples, graphe de nœuds). Stack : **Next.js 16 (App Router) + Drizzle ORM v1.0-rc + Supabase (auth + local dev) + PostgreSQL + Tailwind v4 + vitest**. Style visuel : papier/livre/bibliothèque, épuré, couleurs claires ("light academia", fiche de bibliothèque pour signup/login). Design-first : `DB.dbml` (schéma BDD), `docs/API.yml` (contrat OpenAPI). Workflow : **TDD** — écrire les tests vitest AVANT le handler, puis `pnpm test` doit être vert.

**LIRE `AGENTS.md` (racine)** : régénéré par `next dev`, prévient que Next 16 a des breaking changes. **Toujours consulter `node_modules/next/dist/docs/`** avant d'écrire du code Next — APIs/déprecations divergent des habitudes.

## Règles de travail

- **Après TOUT changement d'API/route** : `pnpm test` (les tests tapent le dev server sur :3000 + Supabase local). Prérequis : `next dev` lancé, `pnpm db:start` fait.
- **Après tout changement de `src/db/schema.ts`** : `pnpm db:gen` PUIS copier le SQL généré (`drizzle/<nouveau dossier>/migration.sql`) dans `supabase/migrations/NNNN_nom.sql` — sinon `pnpm db:reset` ne rejoue pas le schéma et la base finit VIDE.
- Tests **idempotents** : identifiants uniques par run (`Date.now()`), car la base est réelle et partagée entre les runs. Jamais d'email/username fixes dans les tests d'écriture.
- REST : méthodes HTTP = verbes. Un fichier `route.tsx` par ressource, exports GET/POST/PUT/DELETE dedans. Pas d'URL `/create|/delete|/edit`. Logique métier extraite dans `services/` si le handler grossit.
- Tests : couvrir les **comportements** (statuts 201/400/401/403/404/409, cas limites métier), pas chaque champ manquant (un seul cas de validation suffit — même chemin zod).

## Conventions code

- Handler = valider (zod `safeParse`) → auth (`getUser()`) → service → réponse. Erreurs en **problem+json** : `{ title, status, detail }` (singulier `detail`).
- **zod v4** : `safeParse`/`parse` — PAS `validate`/`validateAsync` (ça, c'est Yup).
- **Auth** : session via cookies `@supabase/ssr` (`src/lib/supabase.ts`). Écritures → `supabase.auth.getUser()` (revalide côté serveur), jamais `getSession()`. Relayage erreurs GoTrue : `isAuthApiError(error) && error.status < 500` → relayer le statut (400/401/403/429) ; sinon 500 générique (jamais `error.message` brut au client, `console.error` côté serveur).
- **Drizzle v1.0-rc** (≠ 0.x !) : pas d'export `drizzle` racine — driver explicite (`drizzle-orm/postgres-js`). `timestamp()` modes : `'date'` (défaut, JS Date) | `'string'` — `timestamp_ms` n'existe plus. Colonnes snake_case explicites (`uuid('profile_id')`) ou `snakeCase.table()`. `extraConfig` de `pgTable` = **tableau**, pas objet : `(t) => [uniqueIndex().on(...)]`. Select : `db.select({ col: table.col })` — JAMAIS une string/variable brute à la place de l'objet colonne (erreur 500 silencieuse).
- Auth passwordless : **OTP par email** (code 6 chiffres), pas de mot de passe, pas de magic link. `signInWithOtp({ email, options: { shouldCreateUser: true } })` → `verifyOtp({ email, token, type: "email" })`. `profiles.id` = `auth.users.id` (l'id vient de la session, pas de `defaultRandom`).
- Validation : règles dans `src/validations/rules/` (atomiques, réutilisées), schemas composites dans `src/validations/schemas/`.

## Erreurs rencontrées & fixes (ne pas reproduire)

1. **500 sans body** = exception avant les branches d'erreur. Causes vues : variable d'env `undefined` (mismatch nom : `.env` = `NEXT_SUPABASE_PUBLISHABLE_KEY`, code = `NEXT_PUBLIC_...`), table absente (reset sans migration), `db.select(username)` (string au lieu de colonne Drizzle).
2. **`db:reset` vide la base** si aucune migration dans `supabase/migrations/` — le push ne suffit pas, il faut les migrations SQL.
3. **drizzle-kit en shell non-TTY** (agent/CI) : prompts interactifs échouent. `push` demande "create or rename table" pour TOUTES les tables Supabase (`auth.*`, `realtime.*`) → configurer `schemaFilter: ['public']` dans `drizzle.config.ts`.
4. **Magic link persistant** : templates par défaut Supabase → surcharger `[auth.email.template.confirmation]` **ET** `[auth.email.template.magic_link]` dans `supabase/config.toml` avec `{{ .Token }}` (pas `.Code` ni `.ConfirmationURL`), redémarrage complet (`stop`+`start`), pas `restart`.
5. **Port 8000 = gateway Kong Supabase**. L'app Next = :3000. Mailpit = :54324 (`http://127.0.0.1:54324`, API REST `/api/v1/`).
6. **REST Client cookie jar** : l'extension rejoue automatiquement les cookies reçus vers le même host — une requête "sans cookie" peut être authentifiée. Test no-cookie → host différent (`127.0.0.1` vs `localhost`) ou `rest-client.rememberCookiesForSubsequentRequests: false`.
7. **JSON trailing comma** interdit (les `.http` d'avec des `,` orphelines → 500).
8. **Vite warning** ESM/CJS dans vitest.config.ts : bénin, ou `"type": "module"` dans package.json.
9. **Zod `validateAsync` n'existe pas** : confusion Yup/zod (voir conventions).
10. **Username "" valide** si `usernameRule` sans `.min()` → insérer un NOT NULL bizarre. Règles : ajouter longueur min.

## Entretien de ce fichier (rôle de l'agent)

- **Mise à jour immédiate** : dès qu'une erreur nouvelle est rencontrée et résolue (cause racine + fix en une ligne), l'agent l'ajoute à "Erreurs rencontrées & fixes" — pas le développeur.
- **Après tout changement de convention** (handler, validation, test), refléter la convention dans "Conventions code".
- **Compacité** : ce fichier ne doit pas dépasser ~150 lignes. Au-delà, extraire un domaine en fichier ciblé `.github/instructions/<domaine>.instructions.md` avec frontmatter `applyTo` (ex. `applyTo: src/app/api/**` pour les règles API).
- **Format** : une ligne = un fait vérifié. Pas de prose, pas de "peut-être". Si une info devient fausse (version changée, API retirée), la corriger ou la supprimer — jamais laisser traîner du périmé.

## Commandes

```
pnpm dev          # next dev :3000 (prérequis tests)
pnpm db:start     # supabase local (db :54322, API :54321, studio :54323, mailpit :54324)
pnpm db:reset     # recrée tout : tables + seed + auth.users purgés (sessions invalidées)
pnpm db:gen       # drizzle-kit generate → copier migration.sql dans supabase/migrations/
pnpm test         # vitest run (intégration : tests/integration/)
pnpm test:watch
```

## Tests d'intégration (patterns)

- Helpers : `tests/helpers/mailpit.ts` — `clearMailpit()`, `getOtpCode(email)` (poll `/api/v1/search` + regex `\d{6}`).
- Gabarit `tests/integration/auth.test.ts` : POST JSON util, extraction cookie `set-cookie` (nom `sb-...`), circuit complet (signup → code Mailpit → verify → session → profil → conflit).
- Chaque ressource = un fichier test, cycle de vie enchaîné (create → read → update → delete → 404).
- `.http` = brouillon manuel exploratoire (cookie jar !) ; vitest = contrat automatisé, déterministe.