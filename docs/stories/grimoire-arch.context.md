# Context: grimoire-arch (scaffold)

Sortie de `marvin:scaffold`. État du projet après `bun create astro --template starlight`,
hoisting à la racine, et configuration. Consommé par `/work`.

## Project State
- Type : greenfield → scaffoldé
- Langage : TypeScript / MDX
- Framework : Astro 6.4.3 + Starlight 0.39.3
- Runtime / package manager : bun 1.3.14 (lockfile **`bun.lock`**, texte, commité)
- Recherche : Pagefind (embarqué par le build Starlight)

## Installed Dependencies
- `astro` 6.4.3 — framework de site statique
- `@astrojs/starlight` 0.39.3 — framework docs (sidebar, Pagefind, dark mode, i18n)
- `sharp` 0.34.5 — optimisation d'images (dépendance du template)

> Pas de Tailwind, pas de `@astrojs/tailwind` (ADR thème). Ne pas ajouter de PM autre que bun.

## Directory Structure
- `astro.config.mjs` — config Starlight : `site`, `base:'/grimoire-arch'`, `title`, `customCss`. Sidebar = **placeholder** (exemple template) à remplacer en /work STORY-002.
- `src/content/docs/` — contenu publié. Contient pour l'instant le **contenu d'exemple** du template (`index.mdx`, `guides/example.md`, `reference/example.md`) → à retirer en /work STORY-003.
- `src/content.config.ts` — schéma de collection Starlight (généré par le template).
- `src/styles/custom.css` — petites surcharges de tokens d'accent (placeholder, à affiner).
- `src/assets/` — `houston.webp` (asset d'exemple template).
- `public/` — `favicon.svg`.
- `.vscode/` — recommandations d'extensions (template).
- `docs/` — **doctrine du repo, intouchée** (ne PAS y mettre de contenu de migration).

## Config Notes
- **`site` = `https://USERNAME.github.io`** : `USERNAME` est un **placeholder** — remplacer par le vrai compte GitHub avant le déploiement (STORY-006/007).
- `base: '/grimoire-arch'` doit matcher le nom exact du repo GitHub (pas le dossier daté). Cf. ADR base-path.
- Sidebar : la structure finale Guide (ordonné) + Coulisses (subordonné) est différée à /work car elle dépend du contenu réel ; la wirer maintenant casserait le build. Cible documentée en commentaire dans `astro.config.mjs`.
- `.github/workflows/deploy.yml` **pas encore créé** → /work STORY-006 (withastro/action@v6).

## Commands
- Build : `bun run build` (échoue sur lien interne cassé — c'est le canari)
- Dev : `bun run dev`
- Preview : `bun run preview`
- Lint/format : aucun configuré (template Starlight n'en pose pas ; ajouter si besoin en /work)

## Build Status
- `bun run build` : **vert** au scaffold (4 pages d'exemple, Pagefind OK, sitemap généré).
