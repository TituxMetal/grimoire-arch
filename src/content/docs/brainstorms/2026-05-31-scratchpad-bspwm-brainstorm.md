---
title: "Scratchpad bspwm — adoption JAGL pour ancrer l'habitude"
type: brainstorm
date: 2026-05-31
participants: [titux, Claude]
related:
  - docs/findings/2026-05-30-bspwm-reload-et-verdicts-phase6.md
  - docs/plans/2026-05-27-feat-bspwm-polish-jagl-plan.md
  - bspwm-video-transscript.txt
  - ~/GIT/bspwm-setup/bspwm/scripts/scratchpad
  - ~/GIT/bspwm-setup/bspwm/scripts/scratchpad-promote
---


## Problem Statement

Le besoin **n'est pas** « un terminal flottant », ni « le système à 3 fonctions parce que JAGL
l'a ». Le vrai problème, reformulé pendant la discussion, est un problème d'**apprentissage des
outils du WM** :

> titux utilise i3 depuis 10+ ans. i3 a un scratchpad — mais il n'en a **jamais mémorisé
> durablement les raccourcis du mécanisme** (mettre/sortir du scratchpad, tabs, etc.). Sa mémoire
> *spatiale* (app→bureau→écran) est en béton ; le trou, ce sont les binds des **outils** du WM,
> jamais drillés. Sur bspwm (machine d'expérimentation MBP, prépa d'une future migration de la
> devbox), il veut justement **commencer à ancrer ces binds d'outils par la répétition** — comme
> `hjkl` sur nvim : on en connaît de plus en plus à force d'usage.

Donc le risque n°1 n'est pas « manquer de fonctions », c'est **construire un truc qu'on oublie**.
La contrainte qui prime : **peu de binds, une grammaire cohérente, et on s'en sert pour de vrai**.

## Context

**Ce que montrent les références JAGL** (`bspwm-video-transscript.txt` §Scratchpads + les deux
scripts) — trois fonctions, explicitement présentées comme des *value-adds* (« scratchpads not part
of bspwm ») :

1. **Terminal escamotable** — `scratchpad` : classe dédiée, `xdotool search --class` → lance si
   absent, sinon `bspc node -g hidden -f`.
2. **Promotion fenêtre → slot numéroté** — `scratchpad-promote auto {1,2,3}` : range la fenêtre
   focus (floating + hidden), persiste le node dans `~/.cache/bspwm/scratchpads/<slot>`, actions
   `add/toggle/release/auto`.
3. **Slots nommés** — idem (2), clé = un nom (`audio`, `notes`).

**Concept de fond appris pendant la session (gouverne tout) :** bspwm identifie les fenêtres par
**`WM_CLASS`** (fixée au lancement, stable), **jamais par le titre** (`_NET_WM_NAME`, change avec le
contenu : onglet actif, fichier ouvert). `bspc rule` et le script scratchpad (`xdotool --class`)
matchent sur la classe. On maîtrise la classe au lancement (`alacritty --class …`, `brave --app=URL
--class=…`), on ne subit pas le titre.

**Taxonomie des usages titux** (émergée en discussion ; cadre conceptuel, seul le scratchpad est
construit ici) :

| Type | Comportement | Apps citées | Traitement WM |
|---|---|---|---|
| **Jetable** | lance → utilise → ferme | Timeshift, Btop, Pamac, terminal jetable | scratchpad spawn-toggle |
| **Consultable** | démarre 1× puis pop/réduit, vit en fond | Mail (Infomaniak/Thunderbird), Quodlibet, Github (app Brave) | même primitive, on ne ferme pas |
| **Dédié/Fixe** | bureau/écran dédié, ne bouge jamais | 3 navigateurs, éditeur (nvim/VSCode), Claude CLI, terminal principal | `bspc rule … desktop=` (**hors périmètre**) |

**État machine vérifié (31/05) :** `xdotool`/`notify-send`/`bspc` présents → scripts JAGL utilisables
tels quels. `st` et `alacritty` installés ; GL **3.3** confirmé sur la HD 3000 (alacritty viable).
Helper existant : `super+shift+i` → `~/.config/bspwm/scripts/help` (cheatsheet rofi texte brut).
**Collision détectée** : `super+shift+Return` est déjà pris par **PCManFM** (donc le bind terminal de
JAGL n'est pas libre).

## Chosen Approach

**Adopter le scratchpad JAGL tel quel (les 3 mécanismes, scripts de référence), avec des adaptations
de touches mineures, + un helper dédié.** On ne sur-conçoit pas : titux prend l'habitude de l'outil
*tel qu'il existe* sur le MBP, puis améliore et ajoute les notions avancées **ensuite**. Décision
explicite de titux pour **arrêter la dérive multi-sujets**.

Pierre angulaire de l'adaptation : **toute la famille scratchpad sous un seul modificateur
`super + alt`** (un modificateur = un outil, comme `Alt` = onglets) → sert directement l'objectif de
mémorisation.

| Bind | Action | Source |
|---|---|---|
| `super + alt + Return` | terminal escamotable (st) | adapté (JAGL = `super+shift+Return`, **pris par PCManFM**) |
| `super + alt + & / é / "` | slots 1/2/3 (`scratchpad-promote auto`) | adapté fr-mac (keysyms-symboles au repos) |
| `super + alt + shift + & / é / "` | release slot 1/2/3 | adapté fr-mac (keysym exact à tester) |
| `super + alt + a` | slot nommé « audio » (Quodlibet probable) | JAGL |
| `super + alt + n` | slot nommé « notes » | JAGL |
| `super + alt + i` | **helper dédié scratchpad** (rofi, miroir de `help`) | nouveau |

Terminal du scratchpad = **st** (`st -c scratchpad`), en **essai réversible** : on vit avec, et on
bascule sur `alacritty --class scratchpad` (en jetant st) seulement si c'est moche/galère.

Helper : script **dédié** `scratchpad-help` (miroir de `help`), simplement **référencé** dans le
`help` principal (`super+shift+i`).

## Why This Approach

- **Optimise la mémorabilité** (le vrai problème) : famille `super+alt` unique = un seul « geste
  d'outil » à ancrer, pas un annuaire de touches éparpillées.
- **Apprentissage par la pratique** : adopter l'existant et le *vivre* avant d'optimiser — même
  logique que `hjkl`/nvim. Évite la sur-ingénierie en chambre.
- **Réversibilité** : st en essai (pas un paquet lourd), bascule alacritty documentée.
- **Empêche la dérive** : un seul sujet livré ; les notions avancées sont explicitement gelées
  (voir *Out of Scope*).

## Key Design Decisions

### Q1 : Modèle du scratchpad — RESOLVED
**Décision :** adopter les **3 mécanismes JAGL tels quels** (terminal, slots numérotés, slots nommés).
**Rationale :** titux veut ancrer l'outil par l'usage, pas concevoir un système sur mesure d'emblée.
JAGL est éprouvé et complet ; on améliorera après l'avoir vécu.
**Alternatives rejetées :**
- *Spawn-on-demand nommé (1 bind mnémonique = 1 app)* → c'est du **mapping d'apps**, pas
  l'apprentissage d'un *outil* ; titux range déjà ses apps par bureau, il ne veut pas refaire ça en binds.
- *Promotion seule / hybride réduit* → amputerait JAGL sans bénéfice clair pour l'apprentissage.
- *Tout JAGL mais entièrement re-customisé maintenant* → re-dérive multi-sujets que titux veut stopper.

### Q2 : Famille de binds unifiée `super + alt` — RESOLVED
**Décision :** tous les binds scratchpad sous `super + alt`.
**Rationale :** un modificateur = un outil → mémorabilité maximale, qui adresse directement le
problem statement (oubli des binds d'outils sur i3).
**Alternatives rejetées :** les binds JAGL d'origine — `super+shift+Return` (collision PCManFM avérée)
et `super+alt+{1,2,3}` (sur fr-mac le chiffre est au niveau Shift → `super+alt+1` ≡
`super+alt+shift+&`, collision avec le release). Cf. mémoire `[[fr-mac-binds-chiffres-niveau-shift]]`.

### Q3 : Terminal du scratchpad = st (essai réversible) — RESOLVED
**Décision :** `st -c scratchpad`, gardé en terminal d'appoint, jeté seulement si pénible.
**Rationale :** « essayer pour de vrai » avant de trancher ; st est léger et fidèle à l'identité
suckless ; le prompt initial (écrit par un agent) ne fait pas autorité.
**Alternatives rejetées (pour l'instant) :** alacritty d'emblée — repli documenté, GL 3.3 OK sur la
HD 3000, mais on ne jette pas st sans l'avoir essayé. Cf. `[[titux-choices-revisitable]]`.

### Q4 : Helper dédié scratchpad — RESOLVED
**Décision :** script séparé `scratchpad-help` (rofi, miroir de `help`), **référencé** dans le `help`
principal ; bind `super + alt + i`.
**Rationale :** titux a demandé un helper *dédié* au scratchpad (pas tout fondre dans `help`), mais
veut un point d'entrée depuis le cheatsheet principal.

### Q5 : Keysyms des slots fr-mac — RESOLVED (principe) / à tester (exact)
**Décision :** slots sur les **keysyms-symboles au repos** (`ampersand`, `eacute`, `quotedbl` = touches
1/2/3) ; le keysym exact pour le **release** (symbole vs `shift`+chiffre) sera **validé en live** au /plan.
**Rationale :** cohérent avec la convention fr-mac déjà en place pour les bureaux ; le comportement
réel de sxhkd avec le niveau Shift se vérifie mieux par essai que sur le papier.

## Open Questions

- **Keysym exact slots/release fr-mac** : symbole au repos vs `shift`+chiffre — à figer par essai au /plan.
- **st agréable ?** : à vivre ; bascule `alacritty --class scratchpad` (et st jeté) si galère.
- **Apps réelles dans les slots** : à découvrir en vivant avec (slot « audio » → Quodlibet très probable).
- **Rendu futur des helpers** : passer le cheatsheet de rofi texte brut → **Markdown rendu via `glow`**
  (`extra/glow`, léger, zéro GPU ; ex. `st -c scratchpad-help -e glow -p help.md`). Piste, pas un blocage.

## Out of Scope (gelé pour plus tard)

- **Épinglage dédié** (`bspc rule -a <Classe> desktop='^N'`, l'équivalent du `assign` i3) — sujet
  voisin, lié au **rituel reboot triple-écran** « chaque chose à sa place ». À brainstormer à part.
- **nvim « par projet » façon VSCode** — deux couches : identité fenêtre (`alacritty --class
  dev-<projet>`) **et** session projet (sessions nvim / tmux). Workflow de dev = sujet à part entière.
- **Navigateurs multiples** — piège de la **classe partagée** (`Brave-browser`, `firefox`) :
  `--class`/profils distincts requis pour les distinguer/épingler. À traiter avec l'épinglage.
- **Mail en scratchpad** (Infomaniak-web `brave --app` vs Thunderbird natif) — reporté avec l'épinglage.

## Next Steps

- `/plan docs/brainstorms/2026-05-31-scratchpad-bspwm-brainstorm.md` — transformer ces décisions en
  plan (copier/adapter les 2 scripts JAGL dans `~/.config/bspwm/scripts/`, `bspc rule -a scratchpad
  state=floating` dans `bspwmrc`, binds `super+alt+*` dans `sxhkdrc-bspwm`, script `scratchpad-help`,
  test live des keysyms fr-mac).
- Candidat `/compound` : le **concept WM_CLASS vs titre** + la **taxonomie d'usage 3-types** sont
  réutilisables pour la future migration devbox.
