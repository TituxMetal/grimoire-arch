---
title: "Revue de cohérence docs/ (31/05) — incohérences guide + ADR + pipeline + CLAUDE.md périmé"
type: findings
date: 2026-05-31
domain: docs
component: guide / adr / stories / plans / CLAUDE.md
symptoms:
  - "un même script a deux chemins selon le chapitre du guide (~/bin vs ~/.config/scripts)"
  - "stories jamais clôturées (62 cases [ ], 0 cochée) alors que le guide est rédigé"
  - "contenu daté/TODO (« verdict 30/05 », « à cadrer ») infiltré dans le guide cible"
  - "CLAUDE.md parle encore de git alors que le dépôt n'est plus suivi (.git supprimé le 30/05)"
root_cause: "le périssable (avancement, findings) n'est pas propagé vers le figé (guide/ADR/CLAUDE.md) ; agent ayant écrit dans le guide sans compound/review (contexte épuisé)"
severity: medium
related:
  - docs/guide/README.md
  - docs/guide/annexe-b-adr.md
  - docs/adr/0013-organisation-scripts-par-portee.md
  - docs/findings/2026-05-30-bspwm-reload-et-verdicts-phase6.md
status: >-
  Constats d'une revue /deep-thought:review menée le 31/05 (lecture seule, rien corrigé). Liste
  actionnable pour une passe de cohérence en session fraîche. Aucun fix appliqué. Verdict global :
  APPROUVÉ AVEC RÉSERVES (base saine, dérive concentrée).
---


> Revue `/deep-thought:review @docs/` du 31/05. Lecture seule : rien n'a été corrigé. Ce finding existe
> pour que les constats survivent à la session (capturés à ~180K de contexte). À traiter en passe de
> cohérence dédiée (idéalement via `/deep-thought:plan`).

## Ce qui est sain (ne pas tout réécrire)

- **Gabarit guide tenu** sur les 14 fichiers (Objectif → Procédure → Décisions → Pièges) ; étiquetage
  `retour d'expérience` rigoureux.
- **Zéro lien interne cassé** (vérif mécanique des 40 fichiers).
- **Traçabilité pipeline forte** ; renversements de décision écrits, pas effacés.
- **Annexe B (index ADR livré) à jour** : 0001→0014, chapitres liés cohérents.

## Critique (contradiction dans la cible)

- **[CRIT-1] Chemins de scripts : deux états coexistent dans le guide.**
  `guide/06` (l.57/72 → `~/bin/lock`) et `guide/07` (l.50/56 → `~/bin/vpn`, `~/bin/pinentry-auto`)
  décrivent l'état **actuel** ; `guide/11` (l.158 « `~/bin` est vide », l.162 → `~/.config/scripts/…`)
  + `ADR 0013` décrivent la **cible** (réorg décidée au brainstorm 27/05, *à implémenter*). Le guide ne
  dit pas lequel est courant vs cible → il s'auto-contredit. **À trancher** : soit marquer 06/07
  « état actuel » et 11/ADR 0013 « cible », soit implémenter la bascule puis aligner.

## Suggestions (hygiène)

- **[SUG-1] Fil guide jamais clôturé.** `stories/…md` = 62 cases `[ ]`, 0 cochée ; « Validation avant de
  livrer » (archi §9) vide ; **gate STORY-002 (proof slice ch.2) jamais validé** — alors que les 14
  fichiers du guide existent. Suivi mort à clore ou retirer.
- **[SUG-2] Périssable infiltré dans `guide/11`.** « verdict 30/05 », « finding 2026-05-30 §X » (l.199,
  208, 230, 244), TODO ouverts « à cadrer » (l.243), « câblage local en cours » (l.313). À sortir du
  guide (cible intemporelle).
- **[SUG-3] Micro-écarts index ADR (annexe B vs fichiers).** ADR 0003 : annexe « — pas de chapitre » vs
  fichier « Chapitre 1 / 4 » ; ADR 0013 : « 11 » vs « 11 / 10 » ; titre 0012 : « thememenu » (annexe) vs
  « script multi-thèmes dark » (fichier).
- **[SUG-4] Doc d'architecture désynchronisé.** `stories/…architecture.md` (§3, §6) fige le catalogue ADR
  à **0011**, ignore 0012/0013/0014. (Artefact de process du 26/05 ; l'annexe B livrée est, elle, à jour.)
- **[SUG-5] Pipeline court-circuité, signalé faux.** `plans/2026-05-30-reload-sur` (l.6) met un *finding*
  dans le champ `brainstorm:`. `plans/2026-05-30-theme-dark` n'a aucun lien remontant (`brainstorm`/`related`).
- **[SUG-6] Solution reload sans ADR.** Le mécanisme « reload sûr » est explicitement portable devbox
  mais n'a ni ADR ni entrée guide, là où thème→ADR 0014 et scripts→ADR 0013 ont été figés.
  > **Revu 01/06 :** à requalifier — l'**entrée guide existait** déjà (`guide/11` § « Reload sûr »), donc
  > seul l'ADR manquait. **Résolu** : **ADR 0015** (reload bspwm sûr) créé le 01/06.
- **[SUG-7] Hétérogénéité de forme.** 3 styles de citation ADR (chemin complet / nom de fichier / « ADR
  00XX ») ; 2 familles de plans (longs vs courts) ; `guide/11` = 18K (~2× le 2e plus gros).

## Observations (FYI)

- picom **adopté** (`guide/11` + annexe A, backend glx) mais **pas figé en ADR**. *(Revu 01/06 : figé
  depuis — **ADR 0016**.)*
  *(Pas de divergence guide↔CLAUDE.md ici : le CLAUDE.md ne classe pas picom parmi les outils
  incompatibles — la « divergence picom » initialement suspectée ne tient pas.)*
- HOOKS : `guide/02` (l.90, jeu implicitement non-`systemd`) vs `guide/04` (l.37, `systemd` complet) — la
  bascule n'est pas signalée au lecteur du ch. 2.
- Aide AUR jamais tranchée : `chaotic-aur` (ch. 3) vs `paru` (ch. 9).
- Nommage rapproché `reload-wm` (ch. 10, commun) / `reload` (ch. 11, bspwm).
- `guide/12` (l.91) introduit une 3e étiquette « bonne pratique générale » hors du binôme du README.
- « Phase 6 » (`guide/11` l.244/310) : référence de phase orpheline.
- Brainstorm scratchpad : Q taguées `RESOLVED` (EN) vs `RÉSOLU` (FR) ailleurs.

## CLAUDE.md périmé (constaté le 31/05, après la revue)

- **Section « ## Contenu et suivi git » entièrement morte** : parle de `git status`, `git add -A &&
  git commit`, fichiers « non suivis » — or le `.git/` a été **supprimé le 30/05**, ce dépôt n'est plus
  suivi. **À retirer/réécrire** (cf. mémoire `[[feedback-pas-de-commit-repo-trace-locale]]`).
- **picom listé comme « incompatible matériellement »** dans la section décisions d'archi figées, alors
  qu'il est **adopté** depuis le 30/05 (backend glx OK sur HD 3000). À recadrer.
  > **Revu 01/06 : FAUX.** `grep -i picom CLAUDE.md` → aucun résultat : picom n'est **pas** listé dans
  > CLAUDE.md (la section incompatibilité ne vise que Zed/Ghostty, moteurs Vulkan/compute). Aucune
  > divergence guide↔CLAUDE.md ici (cohérent avec l'observation FYI ci-dessous). picom est par ailleurs
  > désormais figé en **ADR 0016**.
- Formulation **« avancement / Phase 11 »** à rafraîchir (le travail actif a évolué).
- **Ajout fait le 31/05** : encart « Mode d'emploi des commandes (cycle skills) » inséré après la « Règle
  opérationnelle » (table des commandes + périssable/figé + réflexe compound quand un `work` part en vrille).

## Reprise

Passe de cohérence à planifier (`/deep-thought:plan`) : prioriser **CRIT-1** + **section git du CLAUDE.md**
(les deux vraies erreurs), puis SUG-1/SUG-2, puis micro-écarts. Croiser **guide + ADR + config réelle**
(cf. mémoire `[[plans-drift-from-guide-check-adr-help]]`), pas seulement `docs/guide`.

## Related

- `docs/guide/README.md`, `docs/guide/annexe-b-adr.md`, `docs/adr/0013-organisation-scripts-par-portee.md`
- Finding fullscreen du même jour : `docs/findings/2026-05-31-bspwm-fullscreen-perdu-au-reload.md`
- Mémoire : `[[plans-drift-from-guide-check-adr-help]]`, `[[source-of-truth-hierarchy]]`,
  `[[feedback-pas-de-commit-repo-trace-locale]]`
