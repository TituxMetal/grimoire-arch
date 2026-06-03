---
title: "ADR 0009 — Lock/suspend : xss-lock + script commun"
---

- Statut : accepté
- Chapitre lié : 6

## Contexte

On veut un verrouillage d'écran **avant** la mise en veille, identique sous tous les WM (i3, XFCE,
bspwm). Le gestionnaire d'alimentation XFCE pose un inhibiteur D-Bus qui empêche logind de suspendre, et
serait de toute façon lié à XFCE.

## Décision

Confier la veille à **logind** (`HandleLidSwitch=suspend`) et le verrouillage à **`xss-lock`**, qui lance
un script commun `~/.config/scripts/lock` (voir ADR 0013) **avant** la mise en veille. Neutraliser `xfce4-power-manager` (override
autostart `Hidden=true`).

## Conséquences

- Comportement suspend/lock **identique sur les trois WM** (portable).
- Chaîne : capot → logind → inhibiteur pre-suspend → xss-lock → `~/.config/scripts/lock` → veille.
- `xfce4-power-manager` désactivé ; pas de double gestion de l'alimentation.

## Alternatives considérées

- **xfce4-power-manager** : lié à XFCE, non portable, et son inhibiteur bloquait la veille — écarté.
- **Verrou propre à chaque WM** : duplication et divergences → écarté au profit du script commun.
