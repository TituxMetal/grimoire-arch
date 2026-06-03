---
title: "feat: propager tout le grimoire (guide ch.4–13 + annexe A + substrat) sur le site"
type: plan
date: 2026-06-03
status: complete
brainstorm: ../../../_INCUBATOR/2026-06-02-wiki-migration-arch-starlight-brainstorm.md
architecture: ../architecture/grimoire-arch.md
stories: ../stories/grimoire-arch.md
predecessor: ./2026-06-03-feat-grimoire-proof-slice-plan.md
confidence: high
---

# feat — Rollout complet du grimoire (STORY-008)

**En une ligne :** maintenant que le proof-slice est vert en prod, copier le reste —
**ch.4–13 + annexe A** (le guide complet) et **tout le substrat** (brainstorms,
findings, plans, solutions, stories) — sous `src/content/docs/`, en répétant la
recette éprouvée (frontmatter `title:`, H1 retiré, liens root-relative-avec-base,
canari `starlight-links-validator`) et en finalisant la taxonomie « Coulisses » de
la sidebar — sans que le guide-héros se noie.

---

## Problem Statement

Le proof-slice (STORY-001→007, plan `2026-06-03-feat-grimoire-proof-slice-plan.md`)
a prouvé la boucle complète **contenu → build → sidebar héros → deploy GH Pages** sur
une tranche représentative : ch.1–3, annexe B, 17 ADR, et la seule couture
inter-dossiers (les 17 liens `annexe-b → adr/`). Le site est en ligne, recherche FR
confirmée. Mais **les 4/5 du grimoire manquent encore** : 10 chapitres (04–13),
l'annexe A, et 21 fichiers de substrat. STORY-008 propage le reste.

Ce n'est pas qu'une répétition mécanique. Le rollout introduit **trois surfaces de
risque absentes du slice** :

1. **Un graphe de liens intra-guide** (29 liens) qui n'existait pas dans le slice
   (ch.1–3 ont 0 lien interne). Les deux index — `README.md` et la TOC de fin de
   `13-workflow-ia.md` — pointent vers tous les chapitres en forme relative `NN-slug.md`.
2. **Le substrat**, avec un frontmatter riche **non-Starlight** (`type`, `related`,
   `symptoms`, `severity`, `slug`…) et des `related:` orphelins (Open Q3).
3. **La taxonomie « Coulisses »** (Open Q4) : 6 familles de docs à ranger sous un
   groupe subordonné sans noyer le guide.

## Target End State

Quand ce plan a atterri :

1. `src/content/docs/guide/` contient **les 13 chapitres + annexe A + annexe B**
   (+ un index de guide), chacun avec frontmatter `title:` et sans double-H1.
2. Les **29 liens intra-guide** (TOC de `13-workflow-ia` + l'index de guide)
   résolvent en `/grimoire-arch/guide/<slug>/` — `bun run build` vert, **zéro lien
   cassé** (le canari couvre désormais tout le guide, pas juste la couture annexe-b).
3. `src/content/docs/{brainstorms,findings,plans,solutions,stories}/` contiennent les
   **21 fichiers de substrat** (arbo `solutions/{bspwm,theme}/` préservée), chacun
   avec un `title:` valide, sans double-H1, **sans clé `slug:` en collision**.
4. La sidebar : groupe **Guide** ordonné (index → 01 → … → 13 → annexe A → annexe B)
   **avant** un groupe **Coulisses / journal** collapsé, structuré en sous-groupes
   par famille (brainstorms, findings, plans, solutions, stories, adr). Le guide
   reste visuellement dominant.
5. `bun run build` vert ; `find src/content/docs -path '*archives*'` vide ; aucun
   `archives/` en prod.
6. Le site déployé montre le grimoire **complet** sur `https://TituxMetal.github.io/grimoire-arch/`,
   recherche Pagefind FR toujours fonctionnelle, sidebar dans l'ordre, guide non noyé.

## Scope and Non-Goals

**Dans le périmètre (STORY-008) :**
- Copie + frontmatter (`title:` / strip H1) des 11 fichiers guide manquants (ch.4–13 + annexe A).
- Inclusion de l'index de guide (`README.md` source).
- Conversion des 29 liens intra-guide en root-relative-avec-base.
- Copie + nettoyage frontmatter des 21 fichiers de substrat.
- Finalisation de la taxonomie sidebar « Coulisses » (résout Open Q4).
- Traitement des `related:` orphelins (résout Open Q3).
- Push, deploy, vérification prod du grimoire complet.

**Hors périmètre (explicitement) :**
- **Réécrire / corriger le contenu** des chapitres ou du substrat. On publie tel
  quel (copie unique = source de vérité, brainstorm Q4). Les incohérences relevées
  dans `findings/2026-05-31-revue-coherence-docs.md` ne sont **pas** traitées ici.
- **Reconstruire les `related:` en liens cliquables.** Open Q3 = « nettoyés ou
  ignorés sans casser le build » → on les laisse inertes (voir Decision Rationale).
- **Changer la recette de deploy / le workflow CI** — déjà acté et vert.
- **`lgdweb.fr`, domaine custom, versioning, toolchain non-bun.**
- **`archives/`** — jamais copié, jamais lié (invariant projet).

---

## Proposed Solution

Trois phases dépendance-ordonnées, **un commit par phase** (préférence actée,
messages en anglais), chaque frontière de phase = `bun run build` vert.

1. **Guide complet** — copier ch.4–13 + annexe A + l'index, frontmatter + strip H1,
   convertir les 29 liens intra-guide, étendre le groupe sidebar **Guide** à l'ordre
   complet. Build vert (le canari valide les 29 liens). Commit.
2. **Substrat intégré** — copier les 5 familles, strip H1, **retirer les clés `slug:`
   en collision**, décider des `related:` (probe build d'abord), bâtir la taxonomie
   **Coulisses** en sous-groupes. Build vert. Commit.
3. **Ship & verify** — push `main`, suivre le run, vérifier le grimoire complet en
   prod (ordre sidebar, FR search, archives 404, échantillon de liens guide + pages
   substrat, guide non noyé).

**Pourquoi cet ordre :** Phase 1 avant Phase 2 parce que la TOC de `13-workflow-ia`
et l'index de guide référencent **tous** les chapitres — ils ne peuvent build vert
que quand 04–13 + annexes existent. Le substrat (Phase 2) ne dépend d'aucun lien de
corps (ses cross-refs sont en frontmatter `related:`, jamais validées par le canari),
donc il est isolé et vient après. Phase 3 (sortant) en dernier.

---

## Implementation Tasks

> Chaque phase se termine par `bun run build` vert **puis** un commit. Le canari
> (`starlight-links-validator` via `bun run build`) reste l'arbitre de correction.
> Forme de lien obligatoire (ADR-0006) : **root-relative AVEC base**
> `/grimoire-arch/<dir>/<slug>/` — seule forme à la fois validée par le plugin ET
> correcte sur le sous-chemin.

### Phase 1 — Guide complet (STORY-008, partie guide)

- [x] Copier les **fichiers nommés** depuis `~/migration-backup/docs/guide/` vers
      `src/content/docs/guide/` (PAS `cp -r`) : `04-boot-moderne.md`,
      `05-recuperation.md`, `06-bureau-xfce-ly.md`, `07-reseau-securite.md`,
      `08-shell-env-modulaire.md`, `09-outils-terminal.md`, `10-hotkeys-sxhkd.md`,
      `11-wm-bspwm-polybar.md`, `12-outillage-ia.md`, `13-workflow-ia.md`,
      `annexe-a-materiel-ancien.md`.
- [x] Index de guide : copier `guide/README.md` → `src/content/docs/guide/index.md`
      (devient la landing `/grimoire-arch/guide/`). Cf. Decision Rationale (README).
- [x] **Garde-fou archives** : `find src/content/docs -path '*archives*'` → **vide**.
- [x] Frontmatter `title:` ajouté aux 11 chapitres/annexe (aucun frontmatter à la
      source — vérifié : `head -1` = `# titre`). `title` = texte du H1, **quoté YAML**
      (attention aux `→`, `&`, `:`, accents). H1 retiré du corps (Starlight rend `title`).
- [x] Index `guide/index.md` : ajouter `title:`, retirer le H1 `# Guide — migration…`.
- [x] **Convertir les 29 liens intra-guide** en `/grimoire-arch/guide/<slug>/` :
      - `13-workflow-ia.md` : 14 liens (TOC de fin) `01-…`→`12-…`, `annexe-a-…`, `annexe-b-…`.
      - `guide/index.md` (ex-README) : 15 liens (table « Ordre de lecture » 01→13 +
        ligne annexes A/B). Slugs sans extension `.md`, ex.
        `](01-audit-baseline.md)` → `](/grimoire-arch/guide/01-audit-baseline/)`,
        `](annexe-a-materiel-ancien.md)` → `](/grimoire-arch/guide/annexe-a-materiel-ancien/)`.
      - Note : ch.1–3 + annexe B (déjà live) ont 0 lien de corps → rien à rééditer.
- [x] **Sidebar — groupe Guide** : remplacer les 4 items par l'ordre complet :
      `{ slug: 'guide' }` (index), 01 → 13, `guide/annexe-a-materiel-ancien`,
      `guide/annexe-b-adr`. (Items explicites = ordre de lecture préservé, pas d'autogenerate.)
- [x] `bun run build` → **« All internal links are valid »**, exit 0 (les 29 liens
      validés par le canari). Si rouge sur un lien → corriger la forme, pas désactiver.
- [x] Commit : `feat(content): publish full guide (ch.4-13 + annexe A) with hero sidebar`

**Exit Phase 1 :** 12 fichiers guide ajoutés, 29 liens convertis et validés, sidebar
Guide à l'ordre complet, build vert sans warning de lien, commit posé.

### Phase 2 — Substrat intégré (STORY-008, partie substrat — Open Q3 + Q4)

> **PROBE D'ABORD (de-risk Open Q3) :** copier **un seul** fichier substrat
> (ex. `solutions/bspwm/reload-sur.md`) avec son frontmatter complet, `bun run build`.
> But : observer si le schéma de collection Starlight **rejette** les clés
> non-Starlight (`type`, `related`, `symptoms`, `severity`, `root_cause`, `domain`,
> `component`, `participants`, `status`, `confidence`). Hypothèse : Zod **ignore**
> les clés inconnues (pas de `.strict()` dans le docsSchema) → build vert, clés
> strippées au render. Si le build **rouge** → fallback = retirer les clés
> non-Starlight (au minimum `related:`) lors de la copie.

- [x] **Probe schéma** (ci-dessus) — note le verdict dans le commit/solution.
- [x] Copier les 5 familles depuis `~/migration-backup/docs/` vers
      `src/content/docs/`, **arbo préservée** :
      `brainstorms/` (3), `findings/` (6), `plans/` (6),
      `solutions/{bspwm,theme}/` (4, sous-dossiers conservés), `stories/` (2).
- [x] **Garde-fou archives** : `find src/content/docs -path '*archives*'` → **vide**.
- [x] **Strip H1** : les 21 fichiers ont déjà un `title:` MAIS aussi un `# H1` en
      tête de corps (vérifié) → retirer le H1 pour éviter le double-titre.
- [x] **Retirer la clé `slug:` en collision** : `stories/guide-migration-arch-btrfs-tiling.md`
      ET `stories/guide-migration-arch-btrfs-tiling.architecture.md` déclarent le
      **même** `slug: guide-migration-arch-btrfs-tiling` (réservé Starlight → deux
      pages réclament la même URL). Supprimer la ligne `slug:` des deux (le slug par
      défaut dérive du chemin de fichier, distinct). `grep -rn '^slug:' src/content/docs`
      → **vide** après.
- [x] **`related:` orphelins (Open Q3)** : laissés **inertes** (métadonnée non rendue,
      jamais lue par le canari). Aucune action de réécriture. Si la probe a montré que
      le build rejette les clés inconnues → les retirer ici. (Voir Decision Rationale.)
- [x] **Sidebar — taxonomie Coulisses (Open Q4)** : étendre le groupe
      `Coulisses / journal` (collapsé, **après** Guide) en sous-groupes labellisés,
      chacun en forme v0.39-safe `{ label, items: [{ autogenerate: { directory } }] }` :
      Brainstorms, Findings, Plans, Solutions, Stories, ADR (Décisions). Ordre proposé :
      cycle de vie (brainstorms → findings → plans → solutions → stories → adr).
      **GOTCHA v0.39** : l'objet `autogenerate` ne porte **pas** de `label` ; le label
      vit sur le groupe parent. `autogenerate: { directory: 'solutions' }` créera
      automatiquement les sous-groupes `bspwm/` et `theme/`.
- [x] `bun run build` vert ; ordre sidebar vérifié (Guide complet **avant** Coulisses
      à 6 sous-groupes) ; recherche Pagefind toujours en `fr` (plus de pages indexées).
- [x] Commit : `feat(content): integrate substrate (brainstorms/findings/plans/solutions/stories) under Coulisses`

**Exit Phase 2 :** 21 fichiers substrat ajoutés, H1 strippés, `slug:` collision levée,
taxonomie Coulisses en place, build vert, commit posé.

### Phase 3 — Ship & verify (STORY-008, sortant — confirmer avant push)

- [x] `git push origin main` (déclenche `withastro/action@v6` → deploy-pages). Action
      sortante publique sur un repo déjà en ligne → confirmer avant de pousser.
- [x] Suivre le run GitHub Actions : build + deploy verts (`gh run watch` / `gh run list`).
- [x] Vérifier **sur le vrai sous-chemin** `/grimoire-arch/` :
      - Sidebar : Guide (index → 01 → … → 13 → annexe A → annexe B) **avant**
        Coulisses (6 sous-groupes, collapsé). Guide visuellement dominant.
      - Échantillon de liens intra-guide (depuis l'index et la TOC de ch.13) → **200**,
        bonne page.
      - Pages substrat accessibles (échantillon par famille) → **200**.
      - Recherche Pagefind : terme FR accentué présent dans le nouveau contenu
        (ex. « récupération » ch.5, « réseau » ch.7, « scratchpad » substrat) → résultats corrects.
      - `/grimoire-arch/archives/` (ou tout chemin `*archives*`) → **404** (rien exposé).
- [x] **Candidat `/compound`** une fois vert : la recette « docs toolkit → Starlight/
      GH Pages bun » est maintenant prouvée à l'échelle (slice + rollout). Mettre à
      jour `docs/solutions/starlight-gh-pages-bun.md` si un 4e piège émerge
      (collision `slug:`, tolérance des clés frontmatter inconnues).

**Exit Phase 3 :** grimoire complet visible en prod, sidebar ordonnée, FR search OK,
0 archives exposé → **STORY-008 atteinte, grimoire entièrement publié**.

---

## Acceptance Criteria

Mesurables, dérivés de STORY-008 + critères de rejet du brainstorm :

- `bun run build` passe en local, **zéro lien cassé** (les 29 liens intra-guide +
  les 17 annexe-b résolvent ; le canari est l'arbitre).
- Tous les chapitres (01–13) + annexe A + annexe B + index sont sous
  `src/content/docs/guide/` avec frontmatter `title:` et sans double-H1.
- Les 21 fichiers substrat sont sous `src/content/docs/{brainstorms,findings,plans,solutions,stories}/`,
  `solutions/{bspwm,theme}/` préservé, sans double-H1.
- `grep -rn '^slug:' src/content/docs` → **vide** (collision levée).
- `find src/content/docs -path '*archives*'` → vide ; `/archives/` → 404 en prod.
- La sidebar affiche Guide complet (ordre de lecture) **avant** Coulisses (6 sous-groupes collapsés).
- Le site complet répond sur `https://TituxMetal.github.io/grimoire-arch/` au refresh
  après push, déployé par le run GitHub Actions (pas de step manuel).
- Recherche Pagefind sur un terme accentué du **nouveau** contenu → résultats pertinents.
- Aucune commande npm/pnpm/yarn ; aucun `package-lock.json`/`pnpm-lock.yaml`.

**Critères de rejet (tout échec = rollout non atteint) :** un lien interne cassé ; un
`archives/` exposé ou lié ; le guide noyé sous le substrat dans la sidebar ; une
collision de slug non levée ; un build exigeant autre chose que bun ; perte de
l'ordre de lecture du guide.

---

## Decision Rationale

- **Guide (Phase 1) avant substrat (Phase 2)** : la TOC de `13-workflow-ia.md` et
  l'index de guide lient **tous** les chapitres ; le canari ne peut passer vert que
  si 04–13 + annexes existent. Le substrat n'a **aucun lien de corps** (cross-refs en
  frontmatter `related:`, jamais validées) → il est indépendant, donc isolé en Phase 2.
- **`README.md` → `guide/index.md`** : la source `README.md` est un vrai index de
  guide (cadrage « guide raisonné » + table d'ordre de lecture). Le renommer en
  `index.md` en fait la landing propre `/grimoire-arch/guide/` (URL nette, page
  d'accueil de section naturelle) plutôt qu'un `/guide/readme` orphelin. Alternative
  écartée : le dropper (la table d'ordre de lecture a de la valeur, et `index.mdx`
  racine est un splash, pas un sommaire de guide).
- **`related:` laissés inertes (Open Q3)** plutôt que reconstruits en liens : (a) ce
  sont des métadonnées de frontmatter, **non rendues** dans le HTML et **jamais lues**
  par `starlight-links-validator` → zéro impact sur le canari ; (b) beaucoup pointent
  vers des fichiers **hors corpus** (`btrfs-migration.md`, `day5.md`, `~/GIT/…`,
  `CLAUDE.md`, `PERFS-BENCHMARK.md`) — les reconstruire est hors périmètre (pas de
  réécriture de contenu). STORY-008 demande « nettoyés **ou ignorés** sans casser le
  build » → ignorer satisfait l'AC au moindre coût. Fallback de nettoyage seulement
  si la probe montre que le schéma rejette la clé.
- **Probe schéma d'abord (1 fichier) avant la copie de masse** : de-risque l'hypothèse
  « Zod strippe les clés inconnues » sur un seul fichier au lieu de 21. Si faux, on
  ajuste la stratégie de frontmatter une fois, pas 21 fois.
- **Retirer `slug:` plutôt que le réécrire** : les deux fichiers `stories/` portent le
  **même** `slug` réservé → collision dure (deux pages, une URL). Le slug par défaut
  dérivé du chemin de fichier est déjà unique et correct → suppression = solution
  minimale et sûre. Réécrire deux slugs custom = surface d'erreur inutile.
- **Coulisses en sous-groupes (Open Q4)** plutôt qu'un autogenerate plat : 21 fichiers
  hétérogènes à plat noieraient l'œil ; les 6 familles labellisées + collapsées gardent
  le bloc compact et subordonné au guide (anti-goal « guide noyé »). Ordre cycle-de-vie
  (brainstorm → finding → plan → solution → story → adr) raconte la méthode, cohérent
  avec le chapitre 13 « Workflow IA ».

**Alternatives déjà tranchées en amont (non ré-ouvertes) :** Starlight vs autres (Q1) ;
copie unique vs sync (Q4) ; guide-héros vs wiki plat (Q3) ; bun (Q5) ; forme de lien
root-relative-avec-base + canari `starlight-links-validator` (ADR-0006).

---

## Constraints and Boundaries (BINDING)

- **bun uniquement** — 0 commande npm/pnpm/yarn dans le repo et la CI.
- **`docs/` du repo = doctrine**, jamais de contenu de migration dedans. Contenu
  publié **exclusivement** sous `src/content/docs/`.
- **`guide/` et substrat siblings** sous `src/content/docs/` — pas d'aplatissement,
  `solutions/{bspwm,theme}/` préservé.
- **Forme de lien = root-relative AVEC base** `/grimoire-arch/<dir>/<slug>/` (ADR-0006).
  Jamais de `../x.md` relatif (fuit, non validé), jamais de `/x/` sans base.
- **`archives/` jamais copié, jamais lié, jamais publié** — copie de fichiers nommés
  (guide) + copie ciblée des 5 familles (substrat) + garde-fou post-copie.
- **Copie unique** : après copie, le repo est la source de vérité. Pas de sync, pas de
  réécriture du contenu source.
- **Ordre de lecture linéaire** du guide préservé (items sidebar explicites). Le
  substrat reste **subordonné** (groupe collapsé, après Guide) — le guide ne se noie pas.
- **bun-only canary** : `starlight-links-validator` reste branché ; ne pas le
  désactiver pour faire passer un lien — corriger le lien.

---

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| ch.4–13 + annexe A **sans** frontmatter (comme ch.1–3) | **Verified** | `head -1` = `# titre` sur 04 et annexe-a ; mêmes auteurs/époque que ch.1–3 |
| Les 29 liens intra-guide sont en forme relative `NN-slug.md` (TOC ch.13 + index) | **Verified** | `grep -noE '\]\([^)]+\)'` : 14 dans `13-…`, 15 dans `README.md`, tous `NN-slug.md`/`annexe-…md` |
| Le substrat n'a **aucun** lien `.md` de corps (cross-refs en `related:` seulement) | **Verified** | `grep` `]\(…\.md\)` sur les 5 familles → **vide** |
| Les 21 fichiers substrat ont déjà `title:` | **Verified** | `grep -m1 '^title:'` → OK sur les 21 |
| Les 21 fichiers substrat ont un `# H1` de corps (double-titre à strip) | **Verified** | 1re ligne post-frontmatter = `# …` sur les 21 |
| 2 fichiers `stories/` partagent le même `slug:` réservé (collision) | **Verified** | `grep '^slug:'` → 2 hits, même valeur `guide-migration-arch-btrfs-tiling` |
| `solutions/` a des sous-dossiers `bspwm/` + `theme/` à préserver | **Verified** | `find` : 4 fichiers sous `solutions/{bspwm,theme}/` |
| Aucun `related:` ne pointe vers `archives/` ou ne crée de lien de corps | **Verified** | `related:` = frontmatter pur ; cibles hors-corpus inertes |
| Le schéma de collection Starlight **ignore** les clés frontmatter inconnues (`related`, `type`, `symptoms`…) | **Unverified** | Devient la **probe** de Phase 2 (1 fichier) ; fallback = strip des clés |
| Renommer `README.md` → `guide/index.md` produit la landing `/guide/` propre | **Verified-by-design** | Le canari Phase 1 le prouve ; sinon garder `guide/README.md` (slug `guide/readme`) |
| Pagefind FR continue d'indexer correctement le nouveau contenu | **Verified-by-design** | Locale `root`/`lang: fr` déjà en place (proof-slice) ; +pages, même mécanique |

L'unique **Unverified** (tolérance des clés frontmatter inconnues) est isolée par une
probe à 1 fichier en tête de Phase 2 — elle ne menace pas l'approche, seulement la
quantité d'édition de frontmatter.

---

## Risk Analysis

| Risque | Impact | Mitigation |
|--------|--------|-----------|
| Le schéma Starlight rejette une clé frontmatter inconnue (`related`, `symptoms`…) | Build rouge sur tout le substrat | **Probe à 1 fichier** en tête de Phase 2. Si rejet → strip des clés non-Starlight (au minimum `related:`) à la copie. Tranché avant la copie de masse, pas après. |
| Collision `slug:` non levée → 2 pages, 1 URL | Build rouge ou page fantôme | Tâche explicite Phase 2 : retirer `slug:` des 2 fichiers `stories/`. `grep '^slug:'` → vide en garde-fou. |
| Un des 29 liens intra-guide mal converti (profondeur/extension) | Build rouge (canari) | C'est précisément ce que le canari détecte. Forme unique `/grimoire-arch/guide/<slug>/`, slug = nom de fichier sans `.md`. Build vert obligatoire avant commit. |
| `cp -r guide/` embarque des fichiers hors-slice ou `README` non voulu | Pollution / double index | Copier les **fichiers nommés** (Phase 1 liste exhaustive), pas le dossier. Garde-fou archives. |
| Sidebar liste un slug absent (faute de frappe dans les items Guide) | Build rouge | Items = exactement les fichiers copiés ; build vert avant commit. |
| Guide noyé : Coulisses à 21 entrées domine visuellement | Critère de rejet | Sous-groupes labellisés + groupe parent **collapsé**, placé **après** Guide. Vérif visuelle prod (Phase 3). |
| `related:` orphelins interprétés comme liens un jour (futur plugin) | Liens morts latents | Hors périmètre ici ; documenté comme dette dans `findings/2026-05-31-revue-coherence-docs.md` (déjà connu). Inertes tant que non rendus. |
| Double-H1 sur un fichier substrat oublié | Titre dupliqué visible | Strip H1 sur les 21 ; revue rapide post-copie (`grep -rn '^# ' src/content/docs/{brainstorms,findings,plans,solutions,stories}`). |
| Secret/perso dans le nouveau contenu (substrat = notes de session) | Exposition publique | Re-grep chemins perso / tokens avant le push réel (`~/GIT/`, IP, clés). Le substrat cite des chemins `~/GIT/bspwm-setup` — vérifier qu'aucun secret n'y traîne. |

---

## Phased Implementation — Exit Criteria

- **Phase 1 exit :** ch.4–13 + annexe A + index copiés, frontmatter + strip H1, 29
  liens convertis et **validés par le canari**, sidebar Guide à l'ordre complet,
  `bun run build` vert, commit posé.
- **Phase 2 exit :** probe schéma tranchée, 21 substrat copiés (arbo préservée), H1
  strippés, `slug:` collision levée (`grep` vide), `related:` décidés, taxonomie
  Coulisses (6 sous-groupes collapsés après Guide), build vert, commit posé.
- **Phase 3 exit :** push, run vert, grimoire complet visible sur le sous-chemin,
  sidebar ordonnée + guide dominant, FR search OK sur le nouveau contenu, `/archives/`
  → 404. → **STORY-008 atteinte.** Candidat `/compound` (recette à l'échelle + 2
  nouveaux gotchas : collision `slug:`, tolérance frontmatter).

---

## References

- Prédécesseur (proof-slice, vert en prod) : `./2026-06-03-feat-grimoire-proof-slice-plan.md`
- Recette + 3 pièges silencieux : `../solutions/starlight-gh-pages-bun.md`
- Forme de lien tranchée (canari réel) : `../adr/2026-06-03-link-validation-canary.md` (ADR-0006)
- User stories (STORY-008) : `../stories/grimoire-arch.md`
- Brainstorm (QUOI/POURQUOI, Open Q3/Q4) : `../../../_INCUBATOR/2026-06-02-wiki-migration-arch-starlight-brainstorm.md`
- Source contenu (copie unique, lecture seule) : `~/migration-backup/docs/{guide,brainstorms,findings,plans,solutions,stories}/`
- Config actuelle (sidebar à étendre) : `astro.config.mjs`
