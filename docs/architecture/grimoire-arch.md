---
title: "grimoire-arch — Architecture (proof-slice)"
type: architecture
date: 2026-06-02
stories: ../stories/grimoire-arch.md
ground_briefing: ../ground/20260602-grimoire-arch__starlight.md
brainstorm: ../../_INCUBATOR/2026-06-02-wiki-migration-arch-starlight-brainstorm.md
---

# Architecture : grimoire-arch

Site statique **Astro Starlight**, déployé sur **GitHub Pages** via **GitHub Actions**,
toolchain **bun** de bout en bout. Publie le guide de migration Arch + son substrat.
Ce document gouverne le **proof-slice** (guide ch.1–3 + annexe B + 17 ADR liés) ;
le rollout réutilise la même architecture.

Sources : décisions verrouillées du [brainstorm](../../_INCUBATOR/2026-06-02-wiki-migration-arch-starlight-brainstorm.md)
(Q1–Q5, Q8), briefing technique daté [`ground`](../ground/20260602-grimoire-arch__starlight.md)
(au 2026-06-02), et survey de la source `~/migration-backup/docs/`.

---

## Requirements

### Functional Requirements

| ID | Requirement | Story |
|----|------------|-------|
| FR-001 | Projet Astro Starlight buildable avec bun (`bun run build`) | STORY-001 |
| FR-002 | Servir le site sous le sous-chemin GitHub Pages `/grimoire-arch` | STORY-002 |
| FR-003 | Sidebar « Guide » ordonnée (ordre de lecture) + « Coulisses » subordonné | STORY-002 |
| FR-004 | Contenu du slice servi depuis `src/content/docs/`, jamais depuis le `docs/` doctrine | STORY-003 |
| FR-005 | Frontmatter `title:` présent sur chaque page (guide + ADR) | STORY-004 |
| FR-006 | Les 17 liens `annexe-b → ../adr/` résolvent sans lien cassé | STORY-005 |
| FR-007 | Déploiement auto sur push `main` via GitHub Actions (bun) | STORY-006 |
| FR-008 | Recherche Pagefind fonctionnelle sur le français accentué | STORY-007 |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|------------|--------|
| NFR-001 | Toolchain exclusivement bun (contrainte dure) | 0 commande npm/pnpm/yarn dans le repo et la CI |
| NFR-002 | Le guide ne se noie pas sous le substrat | Groupe Guide listé avant Coulisses ; ordre linéaire préservé |
| NFR-003 | `archives/` jamais exposé ni lié | `find src/content/docs -path '*archives*'` vide |
| NFR-004 | Correction des liens vérifiable mécaniquement | `bun run build` échoue sur lien interne cassé (canari) |
| NFR-005 | Découplage du hub `lgdweb.fr` | Aucune dépendance build/deploy vers le hub ; au plus un lien sortant futur |
| NFR-006 | Faible empreinte de dépendances | Pas de Tailwind ni d'intégrations superflues ; thème par défaut + customCss |

---

## Architecture Decision Records

Les ADR sont des **fichiers séparés et immuables** sous `docs/adr/` (convention projet,
format `AAAA-MM-JJ-titre-kebab.md`). Résumé ci-dessous, détail dans chaque fichier :

| ADR | Décision | Fichier |
|-----|----------|---------|
| Placement du contenu | Le contenu publié vit dans `src/content/docs/`, jamais dans le `docs/` doctrine du repo (anti-collision) | `2026-06-02-placement-contenu-src-content-docs.md` |
| Base-path GH Pages | `base: '/grimoire-arch'` = nom du repo GitHub, pas le dossier daté local | `2026-06-02-base-path-github-pages.md` |
| Workflow de déploiement | `withastro/action@v6` (bun auto-détecté) ; **supersede** la mention littérale `setup-bun` du brainstorm Q5 | `2026-06-02-workflow-deploiement-withastro-action.md` |
| Thème | Thème Starlight par défaut + petit `customCss`, **pas de Tailwind** | `2026-06-02-theme-starlight-defaut-customcss.md` |
| Exclusion archives | `archives/` exclu par construction (scope de copie = sous-arbre `docs/`) + garde-fou | `2026-06-02-exclusion-archives.md` |

> Décisions **WHAT/POURQUOI** (Astro Starlight vs alternatives, périmètre tout-`docs/`,
> guide-héros, source de vérité unique) déjà verrouillées dans le brainstorm — non ré-ouvertes ici.

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `astro` | pinné par `bun create astro` (série 6.x au 2026-06-02) | Framework de site statique |
| `@astrojs/starlight` | pinné par le template (série 0.39.x) | Framework docs : sidebar, Pagefind, dark mode, i18n |

> **BINDING :** l'implémenteur DOIT laisser `bun create astro --template starlight` poser
> et pinner ces versions (ne pas hardcoder). **Pagefind** est embarqué par le build Starlight
> (pas de dépendance séparée). **Pas de `@astrojs/tailwind`** (déprécié) ni de Tailwind v4 ici.

CI (pas des dépendances de package, voir External Services) : `withastro/action@v6`,
`actions/checkout@v6`, `actions/deploy-pages@v4`.

---

## Integration Pattern

L'unique couture inter-dossiers du **contenu** est le lien `guide/annexe-b-adr → ../adr/`
(17 occurrences). C'est le canari du proof-slice.

- **Layout (BINDING) :** sous `src/content/docs/`, `guide/` et `adr/` sont **siblings**.
  Ainsi la profondeur relative `../adr/` du lien source est préservée telle quelle.
  ```
  src/content/docs/
  ├── guide/
  │   ├── 01-audit-baseline.md
  │   ├── 02-ext4-vers-btrfs.md
  │   ├── 03-snapshots.md
  │   └── annexe-b-adr.md     ← porte les 17 liens ](../adr/00NN-slug…)
  └── adr/
      ├── 0001-login-manager-ly.md
      └── … 0017-bspwm-tabs-tabbing-externe.md
  ```
- **Forme du lien (BINDING sur le principe) :** garder la forme **relative** `../adr/00NN-slug`.
  Astro 5 résout les liens Markdown relatifs et applique `base` automatiquement.
  Le maintien ou non de l'extension `.md` est **arbitré par `bun run build`** (le canari) :
  défaut = conserver `.md` ; basculer en extensionless seulement si le build signale les liens.
- **Routes générées :** `src/content/docs/guide/01-audit-baseline.md` → `/grimoire-arch/guide/01-audit-baseline/` ;
  `…/adr/0001-login-manager-ly.md` → `/grimoire-arch/adr/0001-login-manager-ly/`.
- **Validation :** `bun run build` est la preuve de correction. Vérifier ensuite le rendu
  sur le **vrai sous-chemin** `/grimoire-arch/`, pas sur `localhost` root.

> **BINDING :** ne pas aplatir `guide/` et `adr/` dans un même dossier ni introduire une
> table de routes manuelle. La résolution passe par le layout miroir + Astro.

---

## File Structure

```
20260602-grimoire-arch/
├── astro.config.mjs                 — config Starlight : site, base:'/grimoire-arch', sidebar (Guide + Coulisses)
├── package.json                     — astro + @astrojs/starlight (pinnés par scaffold)
├── bun.lock(b)                      — lockfile bun, COMMITÉ
├── public/                          — assets statiques (favicon…)
├── src/
│   ├── content/docs/
│   │   ├── guide/                   — ch.1–3 + annexe-b-adr.md (slice) ; ch.4–13 + annexe A au rollout
│   │   ├── adr/                     — 0001…0017 (slice) ; ADR migration ≠ docs/adr/ du repo
│   │   └── {brainstorms,findings,plans,solutions,stories}/  — substrat « Coulisses » (rollout)
│   └── styles/
│       └── custom.css               — accent color + quelques tokens --sl-color-* (pas de Tailwind)
├── .github/workflows/deploy.yml     — push main → withastro/action@v6 → deploy-pages@v4
└── docs/                            — DOCTRINE DU REPO (intouchée par le contenu) : adr/, plans/, solutions/, stories/, architecture/, ground/
```

> **BINDING :** le `docs/` du repo reste réservé à la doctrine. Aucun fichier de migration n'y entre.

---

## External Services

| Service | Purpose | Auth | Notes |
|---------|---------|------|-------|
| GitHub Pages | Hébergement du site statique | GITHUB_TOKEN (OIDC `id-token: write`) | Source = **GitHub Actions** (réglage repo manuel, hors-repo) |
| GitHub Actions | Build + deploy au push `main` | `permissions: contents:read, pages:write, id-token:write` | `withastro/action@v6` (bun auto-détecté) + `actions/deploy-pages@v4` |

---

## Security Considerations

- **Pas de secret dans le contenu.** Audit grep du brainstorm : aucune IP/clé/token/hostname
  perso dans `docs/`. **Re-vérifier chemins/configs avant le push réel** (grep ≠ preuve).
- **`archives/` jamais publié** (NFR-003) : potentiellement personnel/fuyant ; exclu par
  construction + garde-fou post-copie.
- **Surface d'attaque minimale** : site 100 % statique, aucune entrée utilisateur côté serveur,
  pas de backend. Pagefind est un index statique côté client.
- **Permissions CI au plus juste** : exactement les trois requises par Pages ; pas de
  `contents: write`.
