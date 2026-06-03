---
title: "docs: CLAUDE.md → routeur + chapitre Workflow IA + cohérence docs/ (audit 01/06)"
type: docs
date: 2026-06-01
status: complete
brainstorm: docs/findings/2026-05-31-revue-coherence-docs.md
confidence: high
---


Trois axes, issus d'un audit lecture-seule du 01/06 (workflow `audit-doctrine-coherence`, 5 lecteurs)
qui a croisé CLAUDE.md, les 25 mémoires, les stories d'origine, les leçons de la session précédente et
la carte complète du plugin. Remplace le plan « passe de cohérence » initial (trop étroit).

## Problème

Le finding 31/05 ne voyait que 2 incohérences. L'audit confirme un mal plus large : **CLAUDE.md est
devenu un narratif daté** (il raconte l'histoire de la migration au lieu de router vers `docs/`), et la
**méthode de travail** (le cycle des skills, qui a porté la qualité du projet) **n'est documentée nulle
part de façon pérenne et complète** — alors qu'un objectif post-migration est de la réutiliser pour le
webdev sur devbox. En parallèle, du périssable s'est ré-infiltré dans `guide/11` (récidive 01/06), et
une leçon de méthode forte de la dernière session n'a aucune trace consolidée.

## État cible

1. **CLAUDE.md = routeur lean** : mission courte + machines/HD3000 + contraintes figées + conventions
   (source unique, chemins corrigés) + leçons pacman + identifiants + **pointeurs `docs/`**. Plus de
   narratif daté, plus aucune mention de git, plus de martèlement.
2. **Un chapitre guide « Workflow IA »** cartographiant *tout* le cycle des skills (réutilisable
   webdev), avec les stories d'origine **réconciliées** (pas supprimées) comme illustration du cycle.
3. **`docs/` cohérent** : `guide/11` intemporel, chemins `~/bin` corrigés partout, finding 31/05
   rectifié, leçon manquante consolidée, micro-écarts d'index résorbés.

## Périmètre & non-objectifs

**Dans le périmètre** : édition de `docs/`, de `CLAUDE.md`, du fichier mémoire/`MEMORY.md` (texte).
**Hors périmètre** : toute modif de config/scripts vivants (`~/.config`, `~/bin`) — la config est la
**source**, on aligne les docs dessus ; ré-argumenter le fond du guide/ADR ; cocher rétroactivement des
gates non tenus.

## Faits établis par l'audit (vérifiés terrain)

- `.git` **absent** (`git status` → fatal) ; `~/bin` **vide** ; scripts dans `~/.config/scripts/`
  (gpgctl, lock, pinentry-auto, vpn, reload-wm) + `~/.config/bspwm/scripts/`.
- Martèlement « style titux » : **3 occurrences seulement** (L41, L51-52, L145), dont 2 légitimes
  (L51-52 déplie le contenu, L145 = titre de section). Seul **L41** (renvoi vague) est à couper.
  → Le ressenti « partout » est réel mais l'ampleur est **modérée** : petit geste, pas une purge.
- Mémoires : **16 feedback-durable** (l'or, on n'y touche pas), **9 technique-datée** (à vérifier
  avant réutilisation, pas à supprimer), **0 périmé** — sauf la ligne d'index `MEMORY.md` (corrigée).
- Stories : **les 14 sont LIVRÉES**, mapping **1:1** (STORY-00N = guide/NN). Les 62 cases décochées
  sont un **faux signal** (checklist jamais re-cochée), pas du travail manquant.
- Leçons fullscreen : **3/4 déjà tracées** ; **1 manque** comme doctrine (« une fausse piste reste
  utile : elle élimine des hypothèses ; un plan sur prémisse fausse se rectifie sans tout jeter »).
- Guide **dépasse** la spec d'origine sur 3 points : ADR 0012/0013/0014 ajoutés (enrichissement OK) ;
  picom retenu (donné « écarté » au départ) ; **bspwm-tabs câblé** alors que STORY-011 le disait
  « reporté » → **seule vraie incohérence à arbitrer**.

## Tâches d'implémentation

### AXE 1 — CLAUDE.md → routeur lean

- [x] **1.1 — Supprimer le volet git.** Retirer « ## Contenu et suivi git » (L97-101) *titre inclus* +
      la mention L33-34. Faux **et** interdit (`[[feedback-pas-de-commit-repo-trace-locale]]`). Renommer
      la section restante « Carte du dépôt » et remplacer l'inventaire détaillé (L103-124) par un
      pointeur court vers `docs/guide/README.md` + garder le piège durable « se fier aux dates, pas aux
      noms de fichiers ».
- [x] **1.2 — Corriger les chemins de scripts (garder le style).** L147 `~/bin/{gpgctl,vpn,lock,
      pinentry-auto}` → `~/.config/scripts/...` + 1 ligne « organisation par portée → ADR 0013 ».
      **Garder** tout le reste de la convention shell (printMessage+tput, camelCase, dispatch, piège de
      nommage, bash splitté). C'est de l'or — seuls les **chemins** étaient faux.
- [x] **1.3 — Réduire le martèlement.** Couper le renvoi vague « style titux » L41 ; garder L145 (titre)
      et L51-52 (déplié). Préférer « conventions shell du dépôt » + pointeur à l'incantation répétée.
- [x] **1.4 — Router le narratif.** « Nature du dépôt » (L5-25) → mission 3 lignes + **garder** le bloc
      Machines/HD3000 (contrainte durable) ; extraire l'évolution d'intention (L12-16) vers un pointeur
      `docs/guide/README`. « Direction / objectifs » (L27-93) datée → pointeur « état courant → docs/
      (guide README + findings du jour) ».
- [x] **1.5 — Remonter la règle de fond.** Sortir la **Règle opérationnelle non négociable** (L55-60 :
      skill + liste de tâches avant d'implémenter) et la **table du cycle skills** (L62-93) de la section
      datée « objectifs en cours », et les poser comme **règle permanente** ; faire pointer la table vers
      le nouveau chapitre guide « Workflow IA » (Axe 2).
- [x] **1.6 — Garder tel quel + pointer.** Décisions d'archi figées (L126-143), leçons pacman/boot
      (L157-176), identifiants MBP (L178-189) : **inchangés**. Ajouter « détail/justif → docs/adr/ » au
      bloc archi (éviter de doubler les 14 ADR sans router).

### AXE 2 — Chapitre guide « Workflow IA » + réconciliation stories

- [x] **2.1 — Écrire le chapitre** (plan en 12 points fourni par l'audit) : pourquoi un cycle ; vue
      d'ensemble + **points d'entrée multiples** ; colonne brainstorm→plan→work ; entrées alternatives
      (bug→investigate, A/B→think, stack inconnue→ground, petit fix→plan direct) ; rôle d'`architect` ;
      périssable vs figé + hiérarchie de vérité ; **discipline « vérifier avant d'affirmer »** ; rôle des
      review ; reprise quand une session part en vrille ; commandes sous-utilisées (redteam, test-writer,
      architecture-review, ground… — pertinentes une fois qu'on aura build/tests côté webdev) ; contrainte
      transverse (conventions du poste) ; aide-mémoire tableau. *(Emplacement = DÉCISION 2 ci-dessous.)*
- [x] **2.2 — Table de correspondance story ↔ chapitre** (1:1, déjà établie par l'audit) intégrée au
      chapitre, montrant `/architect` (le QUOI, 26/05) → guide (le COMMENT livré). **Ne pas recopier** le
      détail des 62 cases (violerait la hiérarchie de vérité).
- [x] **2.3 — Cocher les 14 stories + note de réconciliation.** Cocher les cases (le travail EST livré,
      mapping 1:1 prouvé) et ajouter en tête : « réconcilié le 2026-06-01 : cases cochées a posteriori
      contre le guide livré (le gate formel n'a pas eu lieu à l'époque, mais les critères sont remplis) —
      voir table story↔chapitre ». **Ne pas supprimer** le fichier.
- [x] **2.4 — Arbitrer les 3 dépassements.** ADR 0012/0013/0014 = enrichissement, l'expliciter dans la
      table ; picom retenu → ADR 0016 (tâche 4.2) ; **bspwm-tabs** : corriger le statut « reporté » de
      STORY-011 → « adopté » pour coller à `guide/11` (câblé : binds + `tabbed/config.h`).
- [x] **2.5 — CLAUDE.md route vers ce chapitre** (lien depuis la table du cycle skills, cf. 1.5).

### AXE 3 — Cohérence docs/ + mémoires + leçon manquante

- [x] **3.1 — Dé-périssabiliser `guide/11`** : retirer « (màj 2026-06-01) » L245, « (verdict 30/05) »
      L212/214/272, « câblage local … en cours / à finaliser » L221/341, « Phase 6 » orpheline
      L272/338 ; remplacer les justif narratives « → finding 2026-05-30 §X » L221/243/252/271 par le
      renvoi `solutions/bspwm/*.md` correspondant (renvoi `solutions/` = légitime, narration datée = non).
- [x] **3.2 — `guide/11` table « Écarts tiling » L271** : scratchpad n'est plus « brainstorm requis »
      (brainstorm + plan + solution existent) → mettre l'état réel sans daté.
- [x] **3.3 — Chemins `~/bin` dans le guide** : `guide/06` L57/61/72 (`~/bin/lock`), `guide/07` L50/56
      (`~/bin/{vpn,pinentry-auto}`) → `~/.config/scripts/`. *(Garde : `grep -rn '~/bin' docs/` avant de
      clore, pour ne rien rater.)*
- [x] **3.4 — Corriger le finding 31/05** : annoter « revu 01/06 : faux » le bullet picom-CLAUDE.md
      (picom **absent** de CLAUDE.md) ; requalifier SUG-6 en « pas d'ADR reload » seul (l'entrée guide
      existe).
- [x] **3.5 — Consolider la leçon manquante** : « une fausse piste reste utile (élimine des hypothèses) ;
      un plan sur prémisse fausse se rectifie, ne se jette pas ». *(Forme = DÉCISION 1 : nouvelle mémoire
      vs ajout à `measure-real-x-geometry-not-bspc-model`.)* Sa place pédagogique est aussi le §7 du
      chapitre Workflow IA.
- [x] **3.6 — Micro-écarts (basse prio)** : annexe B « Chapitre lié » de ADR 0003 (« — » vs « 1/4 ») et
      0013 (« 11 » vs « 11/10 ») → aligner sur les fichiers ; titre 0012 (« thememenu » vs « script »).
      `stories/…architecture.md` fige le catalogue ADR à 0011 → note de gel « index à jour = annexe B ».
      Pipeline : `plans/2026-05-30-reload-sur` champ `brainstorm:` pointe un finding → `finding:` ;
      `plans/2026-05-30-theme-dark` sans lien remontant → ajouter `related:`.

### AXE 4 — Figer ce qui est en place mais sans foyer (ADR)

Reload sûr, picom et bspwm-tabs sont **implémentés** mais non figés dans la couche ADR, contrairement à
thème (0014) et scripts (0013). On leur donne un foyer.

- [x] **4.1 — ADR 0015 : reload bspwm sûr** (validate-before-apply + config-only/`--restart` + dex
      idempotent). Portable devbox. Source : `solutions/bspwm/reload-sur.md` + `guide/11` § « Reload sûr ».
- [x] **4.2 — ADR 0016 : compositeur picom (backend glx)** sur GPU ancien. Acte le **renversement** de
      la contrainte de départ (« écarté a priori » → retenu : la limite HD 3000 porte sur Vulkan/compute,
      pas l'OpenGL classique ; coins arrondis exigent glx). Source : `guide/11` § picom + finding 30/05.
- [x] **4.3 — ADR 0017 : bspwm-tabs (léger)** — acte l'adoption de l'outil de tabbing externe (JAGL,
      `tabbed`/`config.h`), déjà documenté dans `guide/11`. Format court, symétrie avec 0013/0014. Couplé
      au statut STORY-011 « adopté » (2.4).
- [x] **4.4 — Mettre à jour l'index annexe B** : ajouter 0015/0016(/0017), faire pointer le bloc archi
      de CLAUDE.md vers `docs/adr/` (cf. 1.6).

## Décisions tranchées (01/06)

1. **Leçon manquante (3.5)** → **nouvelle mémoire dédiée**. ✔
2. **Chapitre Workflow IA (2.1)** → **nouveau chapitre 13**. ✔
3. **ADR (Axe 4)** → **oui, on fige** : 0015 reload, 0016 picom, **0017 bspwm-tabs (léger)**. ✔
4. **Stories (2.3)** → **cocher + note de réconciliation** (pas laisser décoché). ✔

## Critères d'acceptation (mesurables)

- `grep -niE 'git (status|add|commit)|suivi git|non suivis' CLAUDE.md` → 0.
- `grep -rn '~/bin' docs/guide/ CLAUDE.md` → 0.
- `grep -c 'style titux' CLAUDE.md` → ≤ 2 (titre + déplié), L41 supprimée.
- `grep -niE 'màj 2026|verdict 30/05|phase 6|à finaliser|en cours' docs/guide/11-*.md` → 0.
- CLAUDE.md « Direction/objectifs » remplacé par un pointeur ; Règle opérationnelle + table cycle skills
  conservées comme règle de fond, pointant le chapitre Workflow IA.
- **Chapitre 13** « Workflow IA » présent (12 sections) + table story↔chapitre ; fichier stories =
  **14 cases cochées** + note de réconciliation ; STORY-011 (bspwm-tabs) = « adopté », cohérent `guide/11`.
- Finding 31/05 annoté ; leçon « fausse piste utile » = **nouvelle mémoire** ; `MEMORY.md` resync (fait).
- **ADR 0015 (reload) + 0016 (picom)** créés (+ 0017 bspwm-tabs si confirmé) ; **annexe B** liste
  0001→0016(/0017) ; bloc archi CLAUDE.md pointe `docs/adr/`.
- Annexe B 0003/0013 == fichiers ADR. Diff = `docs/` + `CLAUDE.md` + mémoires uniquement (0 config).

## Hypothèses

| Hypothèse | Statut | Preuve |
|---|---|---|
| `~/bin` vide, scripts migrés | **Vérifié** | `ls` 01/06 (audit + vérif directe) |
| `.git` absent | **Vérifié** | `git status` → fatal (audit) |
| picom absent de CLAUDE.md | **Vérifié** | `grep -i picom CLAUDE.md` (audit) |
| 14 stories livrées 1:1 | **Vérifié** | réconciliation audit (story N = guide/NN) |
| 3/4 leçons déjà tracées, 1 manque | **Vérifié** | audit leçons (mémoires citées) |
| Aucune autre occurrence `~/bin` dans docs/ hors 06/07 | **À confirmer** | `grep -rn '~/bin' docs/` (garde dans 3.3) |

## Risques

| Risque | Impact | Mitigation |
|---|---|---|
| Trop élaguer CLAUDE.md → perdre une contrainte durable | Agent à froid sans garde-fou | Liste explicite « garder tel quel » (1.6) ; archi/pacman/identifiants intouchés |
| Retirer un renvoi `→ solutions/` utile en purgeant (3.1) | Perte d'un pointeur de vérité | Règle 3.1 : renvoi `solutions/` = garder ; narration datée = retirer |
| Chapitre Workflow IA qui duplique la spec stories | Viole hiérarchie de vérité | 2.2 : table de correspondance, **pas** de recopie des cases |
| 3e récidive de dérive du guide après coup | Travail à refaire | Inscrire dans CLAUDE.md « guide intemporel : `(màj)`/`verdict`/`finding` → findings/ » (sous-tâche de 1.5) |
| `~/bin` ailleurs dans docs/ non listé | Incohérence résiduelle | `grep -rn '~/bin' docs/` avant de clore 3.3 |

## Références

- Audit : workflow `audit-doctrine-coherence` (01/06), résultat dans le transcript de session.
- Finding source : `docs/findings/2026-05-31-revue-coherence-docs.md`
- Cibles : `CLAUDE.md` ; `docs/guide/{06,07,11,README}*.md` + nouveau chapitre ; `docs/guide/annexe-b-adr.md` ;
  `docs/adr/{0003,0012,0013}*.md` ; `docs/stories/*` ; `docs/plans/2026-05-30-*`
- Mémoires : `[[source-of-truth-hierarchy]]`, `[[plans-drift-from-guide-check-adr-help]]`,
  `[[feedback-pas-de-commit-repo-trace-locale]]`, `[[script-organization-by-scope]]`,
  `[[titux-choices-revisitable]]`, `[[titux-perception-signal-solicit-verify]]`,
  `[[measure-real-x-geometry-not-bspc-model]]`
