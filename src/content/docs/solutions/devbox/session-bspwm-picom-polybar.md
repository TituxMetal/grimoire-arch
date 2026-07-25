---
title: "Devbox — Session bspwm : picom, polybar, autostart"
type: solution
date: 2026-07-16
domain: devbox / bspwm
component: picom, polybar, autostart XDG, sudoers.d, sxhkd
status: clos
related:
  - /grimoire-arch/findings/devbox/session-bspwm-assign-workspaces
---

> **Statut : session réalisée le 2026-07-16. Modifications effectuées.**
> **clos** — tout le contenu de cette session est vérifié (audit 18/07). Reste-à-faire exécuté en session 18/07 ou résolu. Suivi : `MIGRATION_STATUS.md`.

## Résumé

Session de consolidation section 11 (bspwm) : picom, polybar multi-écran, refonte autostart XDG, float rules centrées, VPN.

## Ce qui a été fait

### Picom — config globale + override bspwm

- Config globale : `~/.config/picom/picom.conf` (ombres, fondu, vsync, sans coins arrondis)
- Override bspwm : `~/.config/bspwm/picom/picom.conf` avec `@include` (picom v13) + `corner-radius = 5`
- Lancé depuis i3 (30-autostart.conf, config globale) et bspwmrc (kill/relance avec override)
- **Leçon** : picom v13 utilise `@include`, pas `include`. Le `~` n'est pas expandu.

### Polybar multi-écran

- `[bar/primary]` (DP-0) : tous les modules + tray
- `[bar/secondary]` (HDMI-0, DVI-D-0) : `inherit = bar/primary`, override modules → bspwm + xwindow + date seulement
- `launch.sh` : 3 instances avec `MONITOR=`

### Refonte autostart

Architecture 3 niveaux :
1. `.xprofile` : keymap, DPMS, screen layout, pcmanfm
2. XDG autostart via `dex -a -e <WM>` : polkit-gnome, vpn-up, xss-lock (`.desktop` copiés du MBP)
3. WM-spécifique : i3 `30-autostart.conf` / bspwm `bspwmrc`

Suppression de qtpass.desktop autostart (choix utilisateur : lancement manuel via Rofi).

### Float rules

Toutes les règles bspwm float avec `center=on` : Pcmanfm, Pavucontrol, Galculator, Timeshift-gtk, pamac-manager, Blueman-manager.
QtPass : règle float présente ; au 16/07 bloquée par `maximized=true` dans `~/.config/IJHack/QtPass.conf` (laissé tel quel). **Suivi 17/07 :** conf lue à `maximized=false` — à revalider en session (float effectif).

### VPN autostart

- Cause du bug : `/etc/sudoers.d/wheel` chargé APRÈS `02-wg-quick` (ordre alpha) → NOPASSWD écrasé
- Fix : `wheel` → `01-wheel` pour charger avant
- Ajout de `vpn-up.desktop` dans `~/.config/autostart/`

### Lock

- `ctrl+alt+l` → `~/.config/scripts/lock` dans `~/.config/sxhkd/sxhkdrc`
- `xss-lock` migré de `.xprofile` vers XDG autostart (`xss-lock.desktop`)

### Traduction commentaires

8 fichiers passés en anglais : picom.conf (×2), bspwmrc, config.bspwm.sh, sxhkdrc-bspwm, polybar config.ini + launch.sh, sxhkdrc. Refs MBP/XFCE nettoyées.

## Fichiers modifiés/créés

| Fichier | Action |
|---------|--------|
| `~/.config/picom/picom.conf` | Créé (config globale) |
| `~/.config/bspwm/picom/picom.conf` | Modifié (`@include` + `corner-radius`) |
| `~/.config/bspwm/bspwmrc` | Float rules centrées, commentaires EN, refs MBP/XFCE nettoyées |
| `~/.config/polybar/config.ini` | `[bar/primary]` + `[bar/secondary]` avec `inherit` |
| `~/.config/polybar/launch.sh` | 3 instances multi-moniteur |
| `~/.config/i3/config.d/30-autostart.conf` | `dex -a -e i3` + sxhkd + picom |
| `~/.config/i3/config.d/20-assignments.conf` | QtPass float rule |
| `~/.config/sxhkd/sxhkdrc` | Lock keybinding `ctrl+alt+l` |
| `.xprofile` | xss-lock retiré (→ XDG autostart) |
| `~/.config/autostart/*.desktop` | 4 fichiers copiés du MBP + picom.desktop (Hidden=true) |
| `/etc/sudoers.d/02-wg-quick` | Créé (NOPASSWD wg-quick) |
| `/etc/sudoers.d/wheel` | Renommé `01-wheel` (ordre de chargement) |

## Leçons apprises

- Picom v13 : `@include` (pas `include`), pas d'expansion `~`
- sudoers.d : chargement alpha, dernier match gagne. Toujours préfixer avec numéros
- BSPWM rules ne s'appliquent qu'à la création de fenêtre — pas aux fenêtres unmapped/remapped (tray)
- Toujours vérifier l'état réel avant faire des suppositions (résolutions, chemins, packages)

## Addendum 2026-07-18 (audit doc↔réalité)

Tous les items du « Reste à faire » ci-dessous sont résolus :

- **Assign app→workspace :** fait en session 18/07 (voir [session bspwm assign workspaces](/grimoire-arch/findings/devbox/session-bspwm-assign-workspaces)).
- **Scratchpad :** `st` est installé et câblé (`scratchpad` + `scratch-btop` dans sxhkdrc-bspwm).
- **Wallpaper :** `~/.config/wallpaper` → symlink vers `~/wallpapers/blackCat2.jpg`, `screen-layout` lit ce chemin.
- **Sections 12-13 :** restent planifiées, suivies dans `MIGRATION_STATUS.md`.

### Reste à faire original (historique, résolu)

> **Addendum 2026-07-17 (discussion, aucune modif config) :** trou documentaire confirmé — la parité **placement app → workspace** (i3 `assign` → bspwm `bspc rule desktop=`) n'a jamais été planifiée ni exécutée. À traiter en session planifiée, pas en one-shot.

- [x] **Parité assign app→workspace i3 → bspwm** — fait 18/07
- [x] Scratchpad — `st` installé, câblé
- [x] Wallpaper — `~/.config/wallpaper` symlink créé, `screen-layout` restauré
- [ ] Sections 12-13 : Finitions + IA — planifié, suivi MIGRATION_STATUS
