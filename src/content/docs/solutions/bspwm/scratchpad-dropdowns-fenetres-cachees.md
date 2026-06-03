---
title: "Scratchpad bspwm : dropdowns d'app, classe WM réelle, fenêtres cachées (4 pièges)"
type: solution
date: 2026-05-31
domain: bspwm
component: "scripts/scratchpad, scripts/winswitch, sxhkd/sxhkdrc-bspwm, bspwmrc"
severity: medium
symptoms:
  - "super+alt+Entrée ouvre DEUX terminaux (un st dans un st)"
  - "une app dropdown (pavucontrol) s'ouvre en tiling au lieu de flotter"
  - "le même dropdown se ré-ouvre au lieu de se montrer/cacher"
  - "btop scratchpad trop petit : 'Terminal size too small'"
  - "un bureau reste allumé/occupé alors qu'il paraît vide (fenêtre cachée)"
tags: [bspwm, scratchpad, sxhkd, wm-class, hidden, dropdown, jagl]
root_cause: "script JAGL st -e CMD imbrique deux st ; classe WM réelle ≠ nom supposé ; apps GTK ignorent -g ; une fenêtre hidden garde le bureau occupé sans rien afficher"
related:
  - docs/plans/2026-05-31-feat-scratchpad-bspwm-plan.md
  - docs/brainstorms/2026-05-31-scratchpad-bspwm-brainstorm.md
  - docs/solutions/bspwm/reload-sur.md
---


Quatre pièges rencontrés (et résolus en live) en montant le scratchpad bspwm
sous `super + alt` sur le MBP. Tous **vérifiés** avec le bon `XAUTHORITY`
(`/run/user/1000/lyxauth`) — sans lui, `xdotool` renvoie « Authorization
required » et tout diagnostic X est faux.

## Problème

1. **Double terminal.** `super+alt+Entrée` ouvrait deux st imbriqués.
2. **Dropdown en tiling + qui se duplique.** `pavucontrol` ne flottait pas et un
   nouvel exemplaire s'ouvrait à chaque appui au lieu de se montrer/cacher.
3. **btop trop petit.** « Terminal size too small: Width=72, needed 80 ».
4. **Bureau fantôme.** Un bureau restait marqué occupé (icône allumée) alors que
   rien ne s'affichait — impossible de savoir quoi était caché, ni de le fermer.

## Root Cause

1. Le script scratchpad JustAGuyLinux fait `st -c "$CLASS" -e "$CMD"`. Avec un
   bind du type `scratchpad scratchpad st …`, `$CMD` valait `st` → **`st -c
   scratchpad -e st`** = un st qui lance un st dedans. Process visibles :
   `st -c scratchpad -e st` + `st`.
2. La classe WM **réelle** de pavucontrol est `pavucontrol` (minuscule), pas
   `Pavucontrol`. `bspc rule -a Pavucontrol` et `xdotool search --class
   Pavucontrol` ne matchaient donc rien → ni float, ni détection (donc relance).
3. Les apps **GTK** (pavucontrol, pamac) ignorent `-g`/`--geometry` ; on ne peut
   pas leur imposer une taille en CLI. btop avait la taille par défaut de la
   fenêtre, trop étroite pour ses 80 colonnes.
4. Une fenêtre `hidden` dans bspwm **garde son bureau occupé** (c'est voulu),
   mais aucun outil natif ne liste/cible les fenêtres cachées d'un coup d'œil.

## Fix

- **Script `scratchpad` réécrit** : prend `<classe> <commande complète…>` et lance
  la commande telle quelle (`"$@" &`), jamais `-e`. Toggle sur le **bureau
  courant** (4 cas : absente→lance / cachée→montre ici / visible ici→cache /
  visible ailleurs→ramène ici), via `bspc node … -d focused` + `-g hidden=off/on`.
- **Classe WM en minuscule** dans le bind ET la règle (`pavucontrol`).
- **Taille/centrage par `bspc rule … rectangle=LxH+X+Y`** (et non `-g`) pour les
  apps GTK. Écran 1280×800 → ex. `pavucontrol rectangle=900x600+190+100`,
  `pamac-manager rectangle=1000x650+140+75`, `scratch-btop rectangle=1000x600+140+100`.
  btop tourne dans un `alacritty --class scratch-btop -e btop` (classe dédiée
  pour ne pas taper toutes les fenêtres alacritty).
- **`winswitch` (super+Tab)** : menu rofi listant `bspc query -N -n .window`
  (visibles + `.hidden`), marqueur `[réduit]`, classe + titre + n° de bureau.
  Entrée = `hidden=off` + ramener sur le bureau courant + focus ; Alt+k
  (`-kb-custom-1`, sortie 10) = `bspc node -c` (fermeture propre).

## Prevention

- **Ne jamais réutiliser un script tiers sans lire ce qu'il fait des args.** Le
  `-e "$CMD"` de JAGL est un piège dès qu'on lui passe une commande en 2e arg.
- **Toujours confirmer la classe WM réelle** avec `xprop WM_CLASS` /
  `xdotool search --class` AVANT d'écrire une `bspc rule` ou un toggle — ne pas
  se fier au nom « logique » de l'app. Le 2e champ de `WM_CLASS` est la classe.
- **Apps GTK : taille via `bspc rule rectangle=`**, pas via `-g` (ignoré).
- **Diagnostic X depuis un shell hors session** : exporter le bon `XAUTHORITY`
  (le lire dans `/proc/$(pgrep -x sxhkd)/environ`), sinon `xdotool` échoue et
  toute observation est fausse. Cf. `[[polybar-x-session-restart]]`.
- Pour l'inventaire/ménage des fenêtres cachées : `super+Tab` (winswitch).

## Related

- Plan : `docs/plans/2026-05-31-feat-scratchpad-bspwm-plan.md` (section « Écarts vs plan initial »)
- Brainstorm : `docs/brainstorms/2026-05-31-scratchpad-bspwm-brainstorm.md`
- Reload sûr (ne pas relancer sxhkd à la main) : `docs/solutions/bspwm/reload-sur.md`
