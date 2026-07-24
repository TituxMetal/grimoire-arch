---
title: "Polish présentation du grimoire — lot B+C de la punchlist"
type: brainstorm
date: 2026-07-20
participants: [Titux, Pi]
related:
  - _INCUBATOR/grimoire-arch/2026-06-03-grimoire-polish-punchlist.md (source des 8 items)
  - astro.config.mjs:31 (canari starlight-links-validator)
  - src/styles/custom.css (état actuel : accents uniquement)
---

# Polish présentation du grimoire — lot B+C de la punchlist

## Problem Statement

Le site a atteint 100 % de son objectif primaire (guide complet publié, tous les liens
valides). Une visite post-rollout a relevé 8 items de polish — aucun bloquant, tous
cosmétiques. Les 6 items de présentation (B+C) forment un lot homogène : config Astro
et CSS uniquement, aucun contenu existant touché. Les 2 items de contenu (A) sont
repoussés à un batch séparé (ils exigent un cadrage propre à cause de l'invariant
« source unique »).

## Context

État vérifié au 2026-07-20 :

- `custom.css` : uniquement les variables d'accent (`--sl-color-accent-*`). Rien sur
  les gris, la police, ou le layout.
- Liens externes : aucun `target="_blank"`, aucun plugin rehype-external-links.
- Sidebar Coulisses : `collapsed: true` sur le parent uniquement. Les 6 sous-groupes
  (Brainstorms, Findings, Plans, Solutions, Stories, Décisions/ADR) n'ont pas la clé
  → ils s'affichent dépliés une fois le parent ouvert.
- Aucune page d'index pour les Coulisses (contrairement au Guide qui a
  `guide/index.md`).
- `bun run build` : 59 pages, tous les liens valides.

Les 6 items sont :

| # | Item | Catégorie |
|---|---|---|
| B.3 | Liens externes `target="_blank"` | Config Astro |
| B.4 | Sous-sections Coulisses `collapsed: true` | Config Astro |
| B.5 | Page d'index pour Coulisses | Contenu + config |
| C.6 | Palette de gris | CSS |
| C.7 | Taille de police | CSS |
| C.8 | Layout grand écran (>1920px) | CSS |

## Chosen Approach

**Atelier unique, additif pur, config + CSS seulement.** Les 6 items sont indépendants
et à faible risque — aucun contenu existant n'est touché (sauf B.5 qui crée une
nouvelle page). Un seul passage, `bun run build` en canari après chaque item config.

Ordre d'exécution proposé :

1. B.4 — Ajouter `collapsed: true` sur les 6 sous-groupes dans `astro.config.mjs`
2. B.3 — Ajouter un plugin liens externes (rehype-external-links ou équivalent
   Starlight)
3. B.5 — Écrire `src/content/docs/coulisses/index.md` (intro + table des matières,
   pattern `guide/index.md`) + entrée sidebar
4. C.6 — Ajuster `--sl-color-gray-1` à `--sl-color-gray-6` dans `custom.css`
5. C.7 — Ajuster `--sl-text-base`, `--sl-text-h1`–`--sl-text-h5` dans `custom.css`
6. C.8 — Assouplir le `max-width` du conteneur au-delà de 1920px dans `custom.css`

## Why This Approach

- **Additif pur** : zéro modification de contenu existant, zéro risque de régression
  sur le guide.
- **Atelier unique** : les 6 items sont indépendants, les sérialiser en deux passages
  (B puis C) ajouterait de l'overhead sans gain.
- **Config d'abord, CSS ensuite** : les items config (B.3, B.4, B.5) ont un impact
  structurel visible immédiatement ; le CSS s'ajuste par-dessus.
- **`guide/index.md` comme précédent pour B.5** : pattern éprouvé, le site a déjà une
  page d'index qui fonctionne.

## Subjective Contract

- Target outcome : le site est plus agréable à lire et à naviguer, sans changer une
  virgule du contenu publié.
- Anti-goals : déborder sur le contenu (A.1, A.2), introduire une dépendance lourde,
  casser le build.
- Tone rules : la page d'index Coulisses est du relieur — quelques lignes situantes +
  table des matières, pas un chapitre.
- Rejection criteria : `bun run build` rouge ; un lien interne cassé ; du contenu
  existant modifié.

## Key Design Decisions

### Q1 : Lot présentation seul ou lot mixte A+B+C ? — RESOLVED
**Decision :** Lot présentation seul (B+C, 6 items). Les items contenu (A.1, A.2) sont
repoussés.
**Rationale :** Les items A touchent `src/content/docs/` et l'invariant « copie unique
= source de vérité ». Ils méritent un cadrage dédié. Les items B+C sont indépendants
et à risque zéro côté contenu — les séparer ne bloque rien.
**Alternatives considered :** Lot mixte (rejeté — mélange risques contenu et
présentation dans le même passage).

### Q2 : Index Coulisses — intro seule ou intro + table des matières ? — RESOLVED
**Decision :** Intro + table des matières, sur le modèle de `guide/index.md`.
**Rationale :** Le lecteur qui arrive sur les Coulisses voit d'un coup d'œil ce que
contient chaque sous-section. Cohérent avec la page d'index du Guide.
**Alternatives considered :** Intro seule (rejetée — le lecteur ne sait pas ce qu'il y
a derrière sans ouvrir le sidebar).

### Q3 : Plugin liens externes — lequel ? → DÉLÉGUÉ AU PLAN
Plusieurs options (rehype-external-links, plugin Starlight communautaire). Le choix
exact dépend de la compatibilité Astro 6.x / Starlight 0.39. À trancher pendant
l'implémentation, le contrat est : tout lien externe ouvre dans un nouvel onglet.

## Assumption Audit

- ✓ Bedrock : `starlight-links-validator` actif (`astro.config.mjs:31`) — le build
  échoue sur tout lien cassé.
- ✓ Bedrock : Starlight 0.39 supporte `collapsed: true` sur les sous-groupes
  (fonctionne déjà sur le parent).
- ? CSS custom properties : `--sl-color-gray-*` et `--sl-text-*` sont les tokens
  Starlight standards — à vérifier dans la doc Starlight 0.39 avant d'écrire le CSS.
- ? Plugin liens externes : compatibilité Astro 6 + Starlight 0.39 à vérifier. Si aucun
  plugin n'est compatible, fallback : un script maison minimal.

## Out of Scope

- Linkification du corpus (punchlist A.1, A.2) — batch séparé, nécessite son propre
  cadrage.
- Contenu devbox (Acte II), promotion nvim, adaptation de la skill publish.
- Toute modification de contenu existant sous `src/content/docs/`.

## Next Steps

- `/plan docs/brainstorms/2026-07-20-polish-presentation-grimoire-brainstorm.md` —
  tranche atelier : config `astro.config.mjs` (B.3, B.4, B.5 sidebar), page
  `coulisses/index.md`, CSS `custom.css` (C.6, C.7, C.8). `bun run build` en canari
  après chaque item.
