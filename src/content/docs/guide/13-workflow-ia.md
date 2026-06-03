---
title: "13 — Workflow IA : le cycle des skills"
---

## Objectif

Documenter la **méthode de travail** avec un assistant IA (Claude Code + skills), pas seulement les
outils (chapitre 12). À la fin de ce chapitre, on sait *quel* skill dégainer selon le besoin, dans quel
ordre, et pourquoi le cycle évite les dérives classiques de l'agent (foncer dans l'édition, halluciner un
fait, perdre le fil quand le contexte sature). La méthode est **réutilisable hors migration** — c'est
elle qu'on rejouera pour le webdev sur la devbox.

Le *pourquoi* : sans cadre, un agent enchaîne les actions et part en vrille. Le cycle des skills
transforme « demande floue → édition au jugé » en « cadrage → décision figée → implémentation testée →
savoir capitalisé ». La valeur n'est pas un skill particulier mais **la discipline du flux**.

## Procédure

### 1. Pourquoi un cycle plutôt qu'un prompt unique

Un seul prompt « fais-moi X » concentre trois fautes : il décide *et* implémente *et* fige en un coup,
sans point d'arrêt pour corriger le tir. Le cycle **sépare les genres** : explorer, décider, planifier,
implémenter, capitaliser sont des étapes distinctes, chacune avec son artefact et son skill. On peut
s'arrêter, réviser, repartir d'une étape sans tout rejouer. La **règle opérationnelle non négociable** :
pour tout travail non trivial (≥ 3 étapes, ou toute modif de config/code), passer par le skill adapté et
**poser une liste de tâches AVANT d'implémenter** — jamais d'édition à la main en aveugle.

### 2. Vue d'ensemble — et des points d'entrée multiples

Le cycle a une colonne vertébrale, mais **on ne démarre pas toujours au même endroit**. Le point
d'entrée dépend du besoin :

| Besoin | Commande | Produit | Nature |
|---|---|---|---|
| Une idée à explorer | `/deep-thought:brainstorm` | brainstorm | périssable |
| Un bug / « pourquoi ça casse » | `/deep-thought:investigate` | finding | périssable |
| « Est-ce cohérent ? » (code/docs/archi) | `/deep-thought:review` | constats (n'écrit rien) | — |
| Décision à fort enjeu / A vs B | `/deep-thought:think` | analyse de tradeoffs | — |
| Cadrer le QUOI/COMMENT | `/deep-thought:architect` | stories + architecture + ADR | figé |
| Planifier | `/deep-thought:plan` | plan (tâches, critères) | périssable |
| Implémenter | `/marvin:work` | config/code appliqué | figé (config vivante) |
| Figer le savoir | `/marvin:compound` | solution + propagation `guide/` | figé |

On **n'enchaîne pas** les huit systématiquement.

### 3. La colonne vertébrale : brainstorm → plan → work

Le flux le plus courant pour une fonctionnalité claire :

```
brainstorm ──► (architect) ──► plan ──► work ──► (compound)
 explorer        figer QUOI    tâches   build      capitaliser
                 + COMMENT      + DoD    + tester
```

`brainstorm` ouvre l'espace (approches, travaux passés, tradeoffs). `plan` le referme en tâches ordonnées
par dépendance, avec **critères d'acceptation mesurables**. `work` exécute le plan, **teste après chaque
changement**, coche les cases. Pour un petit fix, **`plan → work` suffit** : pas besoin de brainstormer
ni d'architecturer.

### 4. Les entrées alternatives

On entre par la porte qui correspond au problème :

- **Un bug** → `/deep-thought:investigate` (lentilles Sherlock/Poirot/Columbo) produit un *finding* :
  cause racine, preuves. De là, un `plan` de fix, puis `work`.
- **Un choix A vs B à fort enjeu** → `/deep-thought:think` (panel d'experts, avocat du diable,
  what-if) tranche un tradeoff **avant** de planifier. Ex. ici : « Modèle A vs B » pour le thème dark.
- **Une stack mal connue** → `/marvin:ground` (survol repo + recherche web datée) avant d'attaquer un
  outil neuf. Indispensable côté webdev (frameworks qui bougent vite).
- **Un petit fix évident** → directement `/deep-thought:plan` (ou même `work` si le plan tient en deux
  lignes). Ne pas sur-outiller un changement trivial.

### 5. Le rôle d'`architect` : figer le QUOI et le COMMENT

`/deep-thought:architect` se place **entre** la décision et l'implémentation : il transforme des
décisions de brainstorm en **stories** (le QUOI, du point de vue du lecteur/utilisateur), un document
d'**architecture** (le COMMENT : gabarit, contraintes, intégrité) et des **ADR** (les décisions figées).
C'est l'étape qui produit du **figé** : on y revient comme contrat, on ne la rejoue pas à chaque session.
Dans ce dépôt, c'est `architect` (26/05) qui a posé les 14 stories et l'architecture du guide — voir la
table § « Correspondance stories ↔ chapitres ».

### 6. Périssable vs figé — et la hiérarchie de vérité

La distinction structurante du cycle :

- **Périssable** (artefacts de *processus*) : `brainstorm`, `finding`, `plan`. Ils datent, ils servent à
  un moment, ils peuvent être archivés. On a le droit de les laisser derrière soi.
- **Figé** (la *cible*) : `solution`, `guide/`, `ADR`. C'est ce qui fait foi dans la durée.

La **hiérarchie des sources de vérité** :

```
journaux (périmables)  <  config vivante (~/.config, ~/GIT)  <  spec / guide (la cible)
```

Quand un journal et la config vivante divergent, **la config vivante fait foi** pour l'état actuel ; le
guide, lui, est la cible raisonnée (il peut même corriger la config). **Corollaire** : on ne copie-colle
pas la config dans le guide — on documente le *pourquoi*. Et le guide est **intemporel** : pas de
`(màj JJ/MM)`, pas de `verdict`, pas de `→ finding` daté ; ces marqueurs de processus restent dans
`findings/`, jamais dans la cible.

### 7. Discipline « vérifier avant d'affirmer »

Le risque dominant d'un agent n'est pas une faille — c'est une **affirmation fausse présentée comme un
fait** (un nom d'outil inventé, une sortie de commande fabriquée, un diagnostic plausible mais faux).
Discipline :

- **Toute affirmation est sourcée ou étiquetée** : doc officielle citée, ou étiquette « retour
  d'expérience » (mesure/test réel).
- **Mesurer la réalité observable**, pas le modèle interne d'un outil. *(Exemple vécu : le « faux plein
  écran » bspwm a reçu deux diagnostics faux — perte d'état, padding — avant qu'on mesure la fenêtre X
  réelle et qu'on trouve un simple problème d'empilement de la barre. Voir chapitre 11.)*
- **Une fausse piste reste utile** : elle élimine des hypothèses. Un plan bâti sur une prémisse qui
  s'avère fausse **se rectifie** — on ne jette pas tout le travail.
- **La perception de l'utilisateur est un signal** : quand il décrit ce qu'il voit avec ses mots
  (« la barre passe au-dessus »), le prendre au sérieux et le vérifier par la mesure, ne pas lui opposer
  le jargon.

### 8. Le rôle des review

`/deep-thought:review` (et `marvin:quick-review`, `marvin:redteam`) **n'écrivent rien** : ils produisent
des constats. Leur place dans le cycle : **après `work`, avant de figer** (ou en audit périodique). Une
review qui lit attentivement vaut mieux que neuf qui survolent. Croiser **guide + ADR + config réelle**,
pas seulement `docs/guide` — un plan qui « complète » oublie souvent de propager vers le guide et les
ADR. *(Exemple : la revue de cohérence 31/05 → plan de passe 01/06.)*

### 9. Reprise quand une session part en vrille

Contexte saturé, agent qui délire, lenteur : **avant de couper**, lancer un `/marvin:compound` rapide
pour capturer l'état même partiel → reprise propre en session fraîche. Ne pas laisser le travail
uniquement dans une session morte : le `finding`/`plan` en cours est le **point de reprise**. La « carte
des fils » (`docs/findings/2026-05-31-session-multi-sujets-carte-des-fils.md`) en est l'exemple.

### 10. Commandes sous-utilisées (à connaître, pas à dégainer par réflexe)

Pertinentes surtout **une fois qu'on aura un vrai build + des tests** (côté webdev) :

- `/marvin:test-writer` — écrit des tests qui **échouent d'abord** (RED) depuis stories + architecture.
- `/marvin:redteam` — review adversariale : expose les faiblesses par des tests qui cassent.
- `/deep-thought:architecture-review` — revue d'archi en profondeur (scaling, failure modes), pour un
  système qui a grandi.
- `/marvin:ground` — briefing daté avant d'attaquer une stack qui bouge.
- `/marvin:harness-up` — pose/maj la doctrine `docs/` + `AGENTS.md` (déjà en place ici).

Les commandes `quellis:*` (coach, reflect, goal-*) sont **perso** (coaching), hors périmètre projet.

### 11. La contrainte transverse : respecter les conventions du poste

Non négociable quand on génère du code/des skills : **préserver le « style titux »** plutôt qu'imposer
les défauts de l'agent. Concrètement : conventions shell du dépôt (header, `printMessage`+`tput`,
camelCase, dispatch `case`, piège de nommage wrapper ≠ binaire), **bun** plutôt que npm, **outils
terminal** sur GPU ancien. Distinguer ce qui est **dur** (shell/bun/terminal) de ce qui est **révisable**
(esthétique : thème, polices, picom — en essai réversible, captures A/B avant d'éliminer).

### 12. Aide-mémoire

| Si… | …alors | Nature du produit |
|---|---|---|
| idée floue à explorer | `brainstorm` | périssable |
| ça casse | `investigate` → finding | périssable |
| A vs B à fort enjeu | `think` | analyse |
| stack inconnue | `ground` → briefing | daté |
| figer QUOI + COMMENT | `architect` → stories/archi/ADR | figé |
| découper le travail | `plan` → tâches + DoD | périssable |
| construire | `work` (teste, coche) | figé (config vivante) |
| vérifier la cohérence | `review` (n'écrit rien) | constats |
| capitaliser une solution | `compound` → solution + guide | figé |
| session qui sature | `compound` rapide (capture l'état) | point de reprise |

## Correspondance stories ↔ chapitres

Le guide a été produit par le cycle : `architect` (26/05) a posé le **QUOI** (14 stories) ; la rédaction
(puis les passes de cohérence) a livré le **COMMENT** (les 14 fichiers). Le mapping est **1:1** —
STORY-00N = chapitre NN. Les cases des stories ont été **cochées a posteriori** (réconciliation 01/06) :
le gate formel n'a pas eu lieu à l'époque, mais les critères sont remplis par le guide livré.

| Story (le QUOI, 26/05) | Chapitre livré (le COMMENT) |
|---|---|
| STORY-001 Audit & baseline | [01](/grimoire-arch/guide/01-audit-baseline/) |
| STORY-002 ext4 → BTRFS ⭐gate | [02](/grimoire-arch/guide/02-ext4-vers-btrfs/) |
| STORY-003 Snapshots | [03](/grimoire-arch/guide/03-snapshots/) |
| STORY-004 Boot moderne | [04](/grimoire-arch/guide/04-boot-moderne/) |
| STORY-005 Récupération | [05](/grimoire-arch/guide/05-recuperation/) |
| STORY-006 Bureau (XFCE + Ly) | [06](/grimoire-arch/guide/06-bureau-xfce-ly/) |
| STORY-007 Réseau & sécurité | [07](/grimoire-arch/guide/07-reseau-securite/) |
| STORY-008 Shell & env modulaire | [08](/grimoire-arch/guide/08-shell-env-modulaire/) |
| STORY-009 Outils terminal | [09](/grimoire-arch/guide/09-outils-terminal/) |
| STORY-010 Hotkeys portables | [10](/grimoire-arch/guide/10-hotkeys-sxhkd/) |
| STORY-011 WM tiling bspwm | [11](/grimoire-arch/guide/11-wm-bspwm-polybar/) |
| STORY-012 Outillage IA | [12](/grimoire-arch/guide/12-outillage-ia/) |
| STORY-013 Annexe A — matériel ancien | [annexe A](/grimoire-arch/guide/annexe-a-materiel-ancien/) |
| STORY-014 Annexe B — index ADR | [annexe B](/grimoire-arch/guide/annexe-b-adr/) |

> Le guide **dépasse** la spec d'origine sur trois points, par enrichissement : les **ADR 0012/0013/0014**
> (puis 0015/0016/0017) n'étaient pas au catalogue initial (figé à 0011) ; **picom** était donné
> « écarté » et a été retenu (ADR 0016) ; les **onglets bspwm-tabs**, notés « reportés » dans STORY-011,
> ont été **adoptés** (ADR 0017, câblés dans `guide/11`). Ce dépassement est documenté, pas masqué.

## Pièges

- **Tout figer, tout le temps** — `compound` ne se justifie qu'une fois **réellement implémenté et
  testé** ; sinon ça reste un finding. _(retour d'expérience.)_

- **Noyer l'utilisateur de commandes** — « une chose à la fois » ne veut pas dire « un seul sujet par
  session » : batcher du petit relié est OK, mais reformuler et **faire confirmer le périmètre** avant
  d'exécuter quand le besoin est ambigu. Préférer le **dialogue** au QCM en phase d'exploration.
  _(retour d'expérience.)_

- **Copier la config dans le guide** — viole la hiérarchie de vérité : le guide documente le *pourquoi*,
  pas le contenu exact des fichiers (qui périme). Renvoyer vers `solutions/` ou l'ADR. _(retour d'expérience.)_

- **Périssable infiltré dans la cible** — dates, `verdict`, `→ finding` daté, TODO « en cours » dans le
  guide : à sortir vers `findings/`. Récidive observée → garde explicite dans la doctrine. _(retour d'expérience.)_
