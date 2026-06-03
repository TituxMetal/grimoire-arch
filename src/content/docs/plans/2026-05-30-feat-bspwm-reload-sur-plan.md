---
title: "feat: reload bspwm sûr (validate-before-apply) + dex idempotent"
type: plan
date: 2026-05-30
status: complete
finding: docs/findings/2026-05-30-bspwm-reload-et-verdicts-phase6.md
confidence: high
---


Rendre le rechargement de bspwm **sûr** (valider chaque bloc avant d'appliquer, façon i3)
et **idempotent** (plus de doublons d'autostart au reload). Matière : finding 30/05 §1-§3 +
day8 Leçon 27.

## Problème

- `bspc wm -r` ré-exécute `bspwmrc` → relance `dex -a -e bspwm` **sans dédup** : nm-applet,
  polkit-gnome, xss-lock, `vpn --up` s'**empilent en doublon** à chaque reload (finding §1).
- bspwm/sxhkd/polybar appliquent **à l'aveugle** : une **erreur shell dans `bspwmrc`** (ou dans
  `colors.sh` qu'il source) **avant** le respawn de sxhkd (l.50) = **vrai lockout** (sxhkd tué l.48,
  jamais relancé). Pas de validate-before-apply comme i3 (finding §3).
- Sous bspwm, deux chemins de reload coexistent (`super+shift+r` sxhkd à chaud / `super+shift+c`
  `bspc wm -r`). titux veut **un seul** reload sûr sous bspwm, en gardant le `super+shift+r` commun
  (sxhkd à chaud) pour i3/XFCE tant que leurs configs ne sont pas reprises.

## État cible

- `dex -a -e bspwm` ne tourne qu'au **1er démarrage de la session** (sentinelle `$XDG_RUNTIME_DIR`),
  pas à chaque `bspc wm -r`.
- `super+shift+r` sous bspwm → **reload validé** ; sous i3/XFCE → `pkill -USR1 -x sxhkd` (inchangé).
- Reload validé : si `bspwmrc`/`colors.sh`/`sxhkdrc`/polybar OK → `bspc wm -r` ; sinon **rien**
  n'est appliqué (session intacte, sxhkd vivant) + **notif dunst** nommant le bloc fautif.
- Notif dunst **à chaque** reload (réussi ✓ ou refusé).

## Décisions (tranchées avec titux)

- **Idempotence dex** : sentinelle run-once dans `$XDG_RUNTIME_DIR` (tmpfs, vidé au logout →
  re-autostart à la session suivante). Plus simple/robuste qu'un `pgrep` par app.
- **Mécanisme reload = aiguilleur commun** (et non doublon de chord) : un seul `super+shift+r` dans
  le commun appelle `~/.config/scripts/reload-wm`, qui détecte le WM (`pgrep`) et route. Raison :
  sxhkd résout un chord dupliqué **par ordre de parsing, premier chargé gagne** (vérifié dans la
  source : `add_hotkey` appende en queue, `find_hotkey` renvoie le 1er match) → un doublon dans le
  fichier bspwm serait **ombragé** par le commun. L'aiguilleur évite le doublon **et** le warning
  `already grabbed`, et s'étend proprement à i3/XFCE plus tard.
- **picom** : on **garde** le masque `~/.config/autostart/picom.desktop` (`Hidden=true`). Nécessaire
  pour empêcher le picom **système** sous bspwm (course/double) et sous XFCE (xfwm4 composite déjà) ;
  **sans objet pour i3** (i3 ne fait pas `dex -a`) → ne bloque pas le futur picom i3 (lancé explicitement).

## Sûreté : ce qui bloque vs ce qui alerte

| Bloc | Validation | Si invalide |
|---|---|---|
| `bspwmrc` + `colors.sh` | `bash -n` (fiable) | **BLOQUE** (seul vrai risque de lockout) |
| `sxhkdrc` (commun + bspwm) | heuristique légère (lisible, non vide, ≥1 raccourci + ≥1 commande) | BLOQUE (sxhkd survit de toute façon, mais on refuse pour cohérence) |
| polybar `config.ini` | heuristique (lisible, non vide, section `[bar/…]`) | BLOQUE |

## Tâches

- [x] **T1** — `bspwmrc` : envelopper `dex -a -e bspwm` dans une garde sentinelle `$XDG_RUNTIME_DIR`.
- [x] **T2** — créer `~/.config/scripts/reload-wm` (aiguilleur par WM, exécutable).
- [x] **T3** — créer `~/.config/bspwm/scripts/reload` (validate-before-apply, notif dunst, `--check`).
- [x] **T4** — commun `~/.config/sxhkd/sxhkdrc` : `super+shift+r` → `~/.config/scripts/reload-wm`.
- [x] **T5** — `~/.config/bspwm/sxhkd/sxhkdrc-bspwm` : supprimer le bloc `super+shift+c` (`bspc wm -r`).
- [x] **T6** — vérifs : `bash -n` sur les scripts ; `reload --check` ; titux teste `super+shift+r` en live
  (notif attendue) — **ne pas relancer sxhkd à la main** (cf. mémoire `polybar-x-session-restart`).

## Critères d'acceptation

- Après plusieurs `super+shift+r` sous bspwm : **un seul** nm-applet/polkit/xss-lock (pas de doublon).
- Une erreur volontaire dans `bspwmrc` (ex. `if` non fermé) → `super+shift+r` **refuse**, notif dunst
  « Reload refusé — bspwmrc … », session et sxhkd intacts.
- Config saine → `super+shift+r` recharge tout + notif « Config rechargée ✓ ».
- Sous i3/XFCE, `super+shift+r` fait toujours `pkill -USR1 -x sxhkd` (aucune régression).

## Hors périmètre

- Reprise i3/XFCE (on étendra l'aiguilleur le moment venu).
- Câblage picom (déjà fait 30/05), scratchpad (gelé, brainstorm), dualscreen.
