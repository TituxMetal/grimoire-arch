---
title: "ADR 0010 — Hotkeys : sxhkd daemon unique, split par WM"
---

- Statut : accepté
- Chapitre lié : 10 / 11

## Contexte

Plusieurs WM cohabitent (i3, XFCE, bspwm). Redéfinir les raccourcis dans chacun duplique le travail et
diverge. Par ailleurs, bspwm n'a **aucun raccourci interne** — il faut un mécanisme externe pour piloter
`bspc`.

## Décision

Utiliser **`sxhkd` comme daemon de hotkeys unique**, lancé depuis `~/.xprofile`, avec un découpage
**commun + par WM** : un `sxhkdrc` commun (apps, média, volume, luminosité) valable partout, et un
fichier par WM (ex. `sxhkdrc-bspwm`) chargé seulement sous le WM concerné via `sxhkd -c`.

## Conséquences

- Une seule source de vérité pour les raccourcis non-tiling ; réutilisation maximale entre WM.
- Les bindings spécifiques (bspwm) n'existent que sous leur WM → aucun conflit inter-WM.
- Sous bspwm, **toutes** les touches passent par sxhkd→bspc (approche standard).
- Spécificités clavier (fr-mac : symboles vs chiffres) et relance propre (`while pgrep`) à respecter
  (chapitres 10 et 11, annexe A).

## Alternatives considérées

- **Raccourcis natifs par WM** : duplication, divergence → écarté.
- **xbindkeys** : remplacé par sxhkd (syntaxe plus claire, multi-fichiers, standard bspwm).
