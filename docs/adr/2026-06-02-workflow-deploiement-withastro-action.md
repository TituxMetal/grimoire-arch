# ADR-0003 : Déploiement via `withastro/action@v6` (bun auto-détecté)

- **Statut** : accepté
- **Date** : 2026-06-02
- **Supersede** : la mention littérale `oven-sh/setup-bun` du brainstorm Q5 (sur le *moyen*, pas sur le principe bun-only)

## Contexte

Contrainte dure : toolchain **bun uniquement** (pas npm/pnpm/yarn). Le brainstorm Q5
mentionnait textuellement une GH Action sur `oven-sh/setup-bun` + `bun install` +
`bun run build`. À la relecture (cf. briefing `ground`, 2026-06-02), cette formulation
était de la **rédaction**, pas une décision de choix explicite de l'utilisateur — qui a
demandé que ce choix reste **ouvert**.

Or l'action officielle **`withastro/action@v6`** détecte le lockfile bun et lance
`bun install` + `bun run build` automatiquement : elle est **tout aussi « bun-only »**,
en bien plus court. La vraie contrainte (bun, pas de npm) est honorée par les deux voies.

## Décision

Utiliser **`withastro/action@v6`** dans `.github/workflows/deploy.yml`, déclenché sur
`push` vers `main` + `workflow_dispatch`, avec `permissions: contents:read, pages:write,
id-token:write`, puis `actions/deploy-pages@v4` (environment `github-pages`).

Réglage repo manuel (hors-repo) : Settings → Pages → Source = **GitHub Actions**.

## Conséquences

- (+) Workflow minimal (un seul `uses:`), moins de surface à maintenir.
- (+) Reste strictement bun-only (lockfile bun auto-détecté).
- (−) Dépendance à une action tierce (officielle Astro) plutôt qu'à des étapes explicites.
- (Neutre) Le lockfile bun (`bun.lock`/`bun.lockb`) doit être commité pour l'auto-détection.

## Alternatives rejetées

- **`oven-sh/setup-bun@v2` + `bun install` + `bun run build` + `upload-pages-artifact` + `deploy-pages` (manuel)** — non rejeté sur le fond (parfaitement valable, plus de contrôle) mais écarté comme **défaut** : plus verbeux, plus de surface. Reste l'alternative documentée si un besoin de contrôle explicite émerge.
- **npm/pnpm/yarn** — rejeté : viole la contrainte dure (npm explicitement détesté).
