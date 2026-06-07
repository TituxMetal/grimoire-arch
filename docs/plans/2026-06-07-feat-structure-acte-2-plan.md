---
title: "feat: structure acte II — sidebar quatre groupes, devbox/, tronc-commun/, étape slug sidebar dans /publish"
type: plan
date: 2026-06-07
status: in_progress
brainstorm: ../brainstorms/2026-06-07-structure-acte-2-brainstorm.md
confidence: high
---

# feat — Structure acte II du grimoire

Poser les rayonnages avant que les livres arrivent : ADR site actant la structure en
actes, deux nouveaux groupes sidebar avec leurs pages d'accueil, et l'étape « slug
sidebar » dans `/publish` — en un passage atelier, additif pur, canari vert à chaque
phase.

---

## Problem Statement

Le grimoire est un guide linéaire one-shot (acte I, 16 items explicites). Devbox entre
dans le livre : il faut une structure multi-actes **sans casser l'ordre de lecture ni
les URLs publiées**, et un routage `/publish` qui reste exprimable en une règle
(*spécifique machine* → acte concerné, *agnostique machine* → tronc commun). Aujourd'hui
`/publish` n'a pas de destination hero réelle pour l'acte II — sa spec dit « signaler et
s'arrêter » si la structure manque. Ce plan lève ce blocage.

## Target End State

- La sidebar raconte la structure en actes d'un coup d'œil : `Guide — Acte I (MBP)` →
  `Acte II — Devbox` → `Tronc commun` → `Coulisses / journal`.
- `src/content/docs/devbox/index.md` et `src/content/docs/tronc-commun/index.md`
  existent — pages du relieur, courtes, situantes.
- `/publish` sait ajouter le slug d'un chapitre hero promu dans `astro.config.mjs`
  (étape dédiée, destinations hero uniquement).
- Un ADR site (`docs/adr/`) acte la structure.
- `bun run build` vert ; aucune URL acte I changée.

## Scope and Non-Goals

**In scope :** ADR site ; édition `astro.config.mjs` (1 rename de label + 2 groupes) ;
2 pages d'index ; retouche `.claude/skills/publish/SKILL.md`.

**Non-goals** (hérités du brainstorm) :
- Truth-up des statuts périmés — session séparée.
- La migration devbox elle-même (`~/migration-devbox/`, ~juillet 2026).
- Toute réécriture de l'acte I, y compris l'extraction des ch. 8–13.
- `lgdweb.fr`, re-promotion d'artefacts déjà promus, contenu de chapitres acte II.
- Le prologue de l'acte II (open question du brainstorm — à trancher quand le chapitre
  s'écrira).

---

## Proposed Solution

Additif pur, structure d'abord (Q1 + Q6 du brainstorm). Trois phases, un commit par
phase, `bun run build` en canari après chaque phase qui touche le site.

**Phase 1 — ADR.** Acter la décision dans `docs/adr/2026-06-07-structure-acte-2-sidebar.md`
(corpus *site*, pas migration). Format maison : pas de frontmatter YAML, H1 +
Statut/Date, Contexte, Décision, Conséquences, Alternatives écartées. Le contenu est
déjà écrit — c'est la condensation des Q1–Q6 du brainstorm, avec la note
d'interprétation ADR 0018+ (à plat dans `src/content/docs/adr/`, pas de sous-dossier).

**Phase 2 — Structure.** Dans `astro.config.mjs` (sidebar lignes 36–77) :

```js
// rename, aucune URL touchée
{ label: 'Guide — Acte I (MBP)', items: [ /* 16 items intacts */ ] },
// nouveaux groupes, entre Guide et Coulisses
{ label: 'Acte II — Devbox', items: [{ slug: 'devbox' }] },
{ label: 'Tronc commun', items: [{ slug: 'tronc-commun' }] },
// Coulisses / journal : inchangé, dernier, replié
```

Et les deux pages d'accueil, pattern minimal prouvé par `guide/index.md`
(frontmatter `title:` seul, prose directe) :
- `src/content/docs/devbox/index.md` — ce que l'acte II contiendra (récit des deltas),
  ce qu'il référence (ch. 8–13 de l'acte I, par lien `/grimoire-arch/guide/...`).
- `src/content/docs/tronc-commun/index.md` — ce que le tronc accueillera (récits
  agnostiques machine : nvim, dotfiles…), né vide par design.

Ton relieur : quelques lignes situantes + renvois — pas des chapitres, pas des
promesses de contenu.

**Phase 3 — Retouche `/publish`.** Insérer l'étape « Slug sidebar » entre l'étape 3
(Adaptation) et l'étape 4 (Trace) de `SKILL.md` :

- **Déclencheur :** destination sous `devbox/` ou `tronc-commun/` (groupes hero à
  items explicites). Coulisses et `adr/` : étape sautée (autogenerate, rien à faire).
- **Geste :** (a) calculer le slug (chemin relatif à `src/content/docs/`, sans
  extension) ; (b) lire le groupe cible dans `astro.config.mjs` et présenter ses items
  dans l'ordre ; (c) proposer la position d'insertion via AskUserQuestion — défaut :
  fin de groupe, l'ordre narratif étant arbitré par Titux ; (d) éditer
  `astro.config.mjs`.
- **Filet :** l'étape 5 (Commit) exige déjà `bun run build` vert — un slug mal formé y
  échoue.
- Mettre à jour la note « structure manquante → signaler et s'arrêter » : les
  destinations `devbox/` et `tronc-commun/` existent désormais ; la note reste valable
  pour toute structure future non posée.

---

## Implementation Tasks

### Phase 1 — ADR site
- [x] Écrire `docs/adr/2026-06-07-structure-acte-2-sidebar.md` (Contexte / Décision
      Q1–Q6 / Conséquences / Alternatives écartées, + note d'interprétation ADR 0018+)
- [x] Commit (English) : `docs(adr): act II structure — four sidebar groups, additive only`

### Phase 2 — Structure sidebar + index (dépend de Phase 1)
- [x] `astro.config.mjs` : renommer `label: 'Guide'` → `'Guide — Acte I (MBP)'`
- [x] `astro.config.mjs` : ajouter le groupe `Acte II — Devbox` (items explicites,
      `{ slug: 'devbox' }`) après le groupe Guide
- [x] `astro.config.mjs` : ajouter le groupe `Tronc commun` (items explicites,
      `{ slug: 'tronc-commun' }`) après Acte II, avant Coulisses
- [x] Écrire `src/content/docs/devbox/index.md` (frontmatter `title:` seul ; renvois
      ch. 8–13 en liens `/grimoire-arch/guide/...`)
- [x] Écrire `src/content/docs/tronc-commun/index.md` (frontmatter `title:` seul)
- [x] `bun run build` vert (canari liens inclus) — 59 pages, « All internal links are valid »
- [x] Vérifier qu'aucune URL acte I n'a changé (le diff ne touche que labels + ajouts)
- [x] Commit : `feat(sidebar): add act II and common-trunk groups with landing pages`

### Phase 3 — Étape slug sidebar dans /publish (dépend de Phase 2)
- [ ] `.claude/skills/publish/SKILL.md` : insérer l'étape « Slug sidebar » entre
      Adaptation et Trace (déclencheur hero-only, geste a–d, filet build)
- [ ] Mettre à jour la note « structure manquante » de l'étape Routage (destinations
      hero désormais réelles)
- [ ] Relire : le routage doit toujours se dire en une phrase (critère de rejet)
- [ ] Commit : `feat(skill): add sidebar-slug step to /publish for hero destinations`

---

## Acceptance Criteria

1. `bun run build` passe (validator de liens inclus) après chaque phase.
2. La sidebar affiche quatre groupes dans l'ordre : Acte I → Acte II → Tronc commun →
   Coulisses ; Coulisses reste replié.
3. Les 16 items de l'acte I sont inchangés (slugs identiques, ordre identique) —
   vérifiable au diff de `astro.config.mjs` : seul le label change.
4. `devbox/index.md` et `tronc-commun/index.md` rendent une page chacun ; leurs liens
   vers l'acte I passent le validator.
5. `SKILL.md` contient l'étape « Slug sidebar » avec déclencheur explicite
   (hero uniquement) et passage AskUserQuestion pour la position.
6. `docs/adr/2026-06-07-structure-acte-2-sidebar.md` existe au format maison.
7. Aucun fichier sous `docs/` ne contient du contenu publié, et inversement (piège
   critique AGENTS.md respecté).

---

## Decision Rationale

Tout le QUOI est verrouillé par le brainstorm (Q1–Q6 RESOLVED) — ce plan n'arbitre que
le COMMENT :

- **ADR en premier** : la décision est actée avant d'être implémentée ; si
  l'implémentation dévie, le diff contre l'ADR le montre. Coût nul, ordre naturel du
  repo (chaque décision site a déjà son ADR).
- **Index pages écrites en Phase 2, pas sur-spécifiées ici** : open question explicite
  du brainstorm — le ton relieur se juge au rendu, le contrat subjectif ci-dessous
  borne le geste.
- **Étape slug sidebar en dernier** : elle référence des groupes qui doivent exister ;
  l'ordre inverse créerait une étape pointant dans le vide.
- **Position d'insertion par défaut = fin de groupe** : les chapitres promus arrivent
  dans le désordre (raison même du rejet d'autogenerate en Q5) ; seul Titux connaît
  l'ordre narratif visé — d'où AskUserQuestion plutôt qu'une heuristique.

## Constraints and Boundaries (BINDING)

- **Additif pur** : aucune URL acte I ne change, aucun fichier acte I n'est déplacé.
- **bun uniquement** ; liens internes en forme `/grimoire-arch/<dir>/<slug>/` (ADR-0006).
- Commits en anglais, un par phase.
- `docs/` ≠ `src/content/docs/` — l'ADR de ce plan va dans `docs/adr/` (site), jamais
  dans `src/content/docs/adr/` (migration).
- Pas de `slug:` en frontmatter (`grep -rn '^slug:' src/content/docs` doit rester vide).

## Subjective Contract (hérité du brainstorm)

- **Target outcome :** la sidebar raconte la structure en actes d'un coup d'œil ; le
  hero reste hero.
- **Anti-goals :** guide noyé sous le substrat ; acte II qui paraphrase l'acte I ;
  placeholders qui ressemblent à du contenu promis non tenu.
- **Tone rules :** les deux index sont du relieur — courts, situants (« ce que cet
  acte contient, ce qu'il référence »), pas des chapitres. Pas de « coming soon », pas
  de table des matières fantôme.
- **Rejection criteria :** une URL acte I qui change ; un lien inter-actes cassé qui
  passe le build ; un routage `/publish` qui ne se laisse plus dire en une phrase.
- **Proof slice :** ce plan *est* la tranche de preuve — la structure entière tient en
  un passage ; la propagation, ce sont les promotions futures via `/publish`.
- **Preview :** `bun run dev` après Phase 2 pour vérifier visuellement les quatre
  groupes et le hero non noyé, avant le commit de phase.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| `autogenerate` absorbe les sous-dossiers `devbox/` des Coulisses | Vérifiée | Prod, `solutions/devbox/` (commit `0eea21c`) |
| Le canari de liens fait échouer le build sur lien cassé | Vérifiée | `starlightLinksValidator()` actif, `astro.config.mjs:31` ; ADR-0006 |
| `{ slug: 'devbox' }` pointe l'index d'un dossier | Vérifiée | Même pattern que `{ slug: 'guide' }`, en prod (`astro.config.mjs:38-57`) |
| Pas de collision `devbox/` (hero) vs `solutions/devbox/` (Coulisses) | Vérifiée | Arbres distincts, glob vérifié 2026-06-07 |
| Renommer un label sidebar ne touche aucune URL | Vérifiée | Les URLs Starlight dérivent des chemins de fichiers, pas des labels |
| Groupe Starlight à items explicites vide | Évitée par design | Q6 : les index existent dès la création des groupes — jamais posée |

Aucune assumption non vérifiée ne subsiste : les deux « ? » du brainstorm sont résolues
par ce plan même (l'étape slug sidebar = Phase 3 ; le groupe vide = Phase 2).

## Risk Analysis

| Risque | Impact | Mitigation |
|---|---|---|
| Lien `/grimoire-arch/guide/...` mal formé dans un index | Build rouge | C'est le canari qui travaille pour nous — corriger, pas contourner |
| Confusion future `devbox/` (hero) vs `solutions/devbox/` (Coulisses) | Promotion mal routée | ADR Phase 1 + tableau de routage `/publish` inchangé en une règle |
| Étape slug sidebar sur-spécifiée → SKILL.md verbeux | Pipeline `/publish` illisible | Critère de rejet explicite : le routage se dit en une phrase ; relecture en Phase 3 |
| Index pages qui dérivent vers du placeholder « promis » | Anti-goal du contrat | Tone rules + preview `bun run dev` avant commit |

## Phased Implementation — Exit Criteria

| Phase | Exit |
|---|---|
| 1 — ADR | Fichier au format maison, commit poussé sur rien d'autre |
| 2 — Structure | `bun run build` vert ; 4 groupes visibles en dev ; diff acte I = label seul |
| 3 — /publish | Étape insérée ; routage toujours en une phrase ; commit |

## References

- Brainstorm : `docs/brainstorms/2026-06-07-structure-acte-2-brainstorm.md`
- Décisions actées (entrée verrouillée) : `~/sandbox/grimoire/2026-06-06-architecture-documentaire-atelier-livre-terrain.md`
- Spec `/publish` : `~/sandbox/grimoire/2026-06-07-spec-skill-publish.md` ; skill : `.claude/skills/publish/SKILL.md`
- Sidebar actuelle : `astro.config.mjs:36-77` ; validator : ADR-0006 (`docs/adr/2026-06-03-link-validation-canary.md`)
- Précédent d'absorption : `src/content/docs/solutions/devbox/` (commit `0eea21c`)
- Registre : `docs/promotions.md`
