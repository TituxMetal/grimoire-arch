---
title: "ADR 0015 — Reload bspwm sûr : valider avant d'appliquer"
---

- Statut : accepté
- Chapitre lié : 11
- Lié à : ADR 0010 (sxhkd daemon unique)

## Contexte

bspwm n'a **pas** de mécanisme *validate-before-apply* comme i3 : `bspc wm -r` ré-exécute `bspwmrc`
**à l'aveugle**. Deux risques en découlent, plus un défaut d'ergonomie :

1. **Lockout.** `bspwmrc` tue puis relance sxhkd ; une erreur shell *avant* le respawn laisse sxhkd mort,
   donc **aucun raccourci** pour réagir.
2. **Doublons d'autostart.** `bspc wm -r` rejoue `dex -a` sans dédup → nm-applet / polkit-gnome /
   xss-lock / `vpn --up` s'empilent à chaque reload.
3. **Respawn-flash inutile.** Un `bspc wm -r` pour seulement rafraîchir des couleurs/gaps respawn aussi
   picom/polybar/sxhkd et rejoue la valse `dex` — coûteux pour un besoin idempotent.

## Décision

Un reload **validé**, branché sur le `super + shift + r` commun via un aiguilleur par WM, avec un mode
par défaut **config-only** :

- **Aiguilleur** `~/.config/scripts/reload-wm` : `pgrep -x bspwm` → `~/.config/bspwm/scripts/reload` ;
  sinon `pkill -USR1 -x sxhkd` (i3/XFCE, inchangé). **Un seul chord** dans le sxhkdrc commun (pas de
  doublon ombragé : premier chord chargé gagne).
- **Validate-before-apply** : `bash -n` sur `bspwmrc` + `config.bspwm.sh` + `colors.sh` (seul vrai risque
  de lockout, **bloque** si invalide), heuristiques sur sxhkdrc et polybar. Si un bloc est invalide,
  **rien n'est appliqué** (session + sxhkd intacts) + notif dunst nommant le bloc fautif. Notif dunst dans
  les **deux** cas (✓ / refusé).
- **Config-only par défaut** : le mode par défaut re-source un fragment idempotent partagé
  (`config.bspwm.sh`, `applyConfig` = les `bspc config` + `colors.sh`) **à chaud**, **jamais** `bspc wm -r`
  → aucun état de fenêtre touché, pas de respawn picom/polybar/sxhkd.
- **`--restart` pour le structurel** : `bspc wm -r` est relégué à `reload --restart` (règles/monitor/
  autostart), qui réapplique les `bspc rule` et sauve/restaure le plein écran.
- **dex idempotent** : sentinelle run-once `$XDG_RUNTIME_DIR/bspwm-autostart-done`, effacée au **login**
  depuis `.xprofile` (pas au reload) pour garantir un autostart frais à chaque session.

Une seule source de vérité des réglages : `config.bspwm.sh`, sourcé par `bspwmrc` **et** par `reload`.

## Conséquences

- Plus de lockout possible par config cassée : `bash -n` est le garde-fiable (couvre désormais aussi
  `config.bspwm.sh`, sourcé au boot).
- Plus de doublons d'autostart au reload, et autostart frais garanti à chaque login.
- `super + shift + r` ne respawn plus picom/polybar/sxhkd (confort) ; `thememenu` passe par le config-only
  + relance explicite de polybar (le config-only ne respawn pas la barre).
- Portable devbox : sentinelle `$XDG_RUNTIME_DIR`, aiguilleur `pgrep -x <wm>`, validation `bash -n`.

## Alternatives considérées

- **`bspc wm -r` direct** (sans validation) : simple mais expose au lockout et aux doublons — écarté.
- **Dupliquer le chord `super+shift+r` dans le fichier bspwm** : ombragé par le commun (premier chargé
  gagne) → aiguilleur, pas doublon — écarté.
- **`pgrep` par app** pour la dédup dex : plus fragile qu'une sentinelle run-once par session — écarté.
- **Garder `bspc wm -r` comme défaut** pour les couleurs/gaps : destructeur d'état runtime + respawn-flash
  pour un besoin idempotent — relégué à `--restart`.

Détail (validation par bloc, schéma des deux chemins, rejouer sur devbox) :
`docs/solutions/bspwm/reload-sur.md`.
