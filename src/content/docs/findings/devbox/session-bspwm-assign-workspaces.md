---
title: "Devbox — Session bspwm : parité assign app→workspace"
type: findings
date: 2026-07-18
domain: devbox / bspwm
component: bspwmrc / bspc rule / Brave PWA
symptoms:
  - "apps i3 assignées n'atterrissent pas sur le bon moniteur/desktop sous bspwm"
  - "ouverture d'une app vole le focus / bascule la vue courante"
  - "PWA Infomaniak ne matche pas la règle (typo crx_)"
root_cause: "sélecteur desktop multi-écran incorrect (desktop=^N relatif au moniteur focus) ; IDs Brave PWA retapés de mémoire ; focus_on_window_activation non équivalent sans ignore_ewmh_focus + focus=off follow=off"
severity: medium
status: resolved
---

> **Statut : session réalisée le 2026-07-18. Modifications effectuées.**
> **clos** — tout le §11 assign est fait et vérifié (audit 18/07). Reste optionnel : binds split/resize.

## Résumé

Parité des assignations fenêtre→bureau i3 → bspwm. Les apps ciblées atterrissent
sur le bon moniteur/desktop **sans voler le focus** (comportement type i3
`focus_on_window_activation none`). btop flottant dimensionné comme le max i3.

## Ce qui a été fait

### Règles d'assign (`~/.config/bspwm/bspwmrc`)

Sélecteur : `desktop=MONITOR:^N` (index 1-based **sur le moniteur**).
Format `-a` : `class[:instance]`. Brave PWA = `Brave-browser:crx_<app-id>`.

| App | Match | Cible |
|-----|--------|--------|
| Zed | `dev.zed.Zed` | `DP-0:^1` → `1  code` |
| btop | `btop` | `HDMI-0:^1` → `3  monit` + float `1400x950` center |
| Quodlibet | `Quodlibet` | `DP-0:^4` → `6  music` |
| GitHub PWA | `Brave-browser:crx_mjoklplbddabcmpepnokjaffbmgbkkgg` | `HDMI-0:^3` → `7  github` |
| Infomaniak / kSuite | `Brave-browser:crx_gmlmjilidfaokblmholipklacfhclogc` | `DP-0:^5` → `8  mail` |
| Firefox ESR | `firefox-esr` | `DVI-D-0:^1` → `9  webdev` |

Toutes avec `focus=off follow=off`.

### Comportement focus

- `bspc config ignore_ewmh_focus true` dans `config.bspwm.sh` (idempotent).
- Équivalent i3 : l'app s'ouvre sur son bureau, **sans** basculer la vue courante.

### btop

- Super+b (`alacritty -c btop`) : float + `rectangle=1400x950+0+0` + `center=on`
  (reprend `floating_maximum_size 1400 x 950` d'i3).
- Scratchpad Super+Alt+b (`scratch-btop`) : même rectangle.

### Source de vérité des IDs Brave

Les `StartupWMClass` des `.desktop` PWA :

- GitHub → `crx_mjoklplbddabcmpepnokjaffbmgbkkgg`
- kSuite Infomaniak → `crx_gmlmjilidfaokblmholipklacfhclogc`

Alignés sur i3 `20-assignments.conf`.

## Ce qui a été essayé puis retiré

- Script `externalRules` + `external_rules_command` : **supprimé**. Inutile une fois
  l'ID Infomaniak correct. Les règles statiques `bspc rule` suffisent.
- Tentatives de match `*:crx_…`, titres, etc. : bruit autour d'une typo (voir leçons).

## Leçons (à ne pas rejouer)

1. **Lire l'ID depuis le `.desktop` / i3, ne jamais le retaper de mémoire.**
   Une typo `crx_ajm…` au lieu de `crx_gml…` a fait perdre beaucoup de temps :
   GitHub (id correct) marchait, Infomaniak non — d'où de fausses pistes
   (« instance posée trop tard », external rules, etc.).
2. **Quand « ça marchait tout à l'heure »** : diff les règles live / fichiers
   contre l'état connu bon **avant** d'inventer un nouveau mécanisme.
3. **Nommage scripts** : camelCase, **pas** de tiret ni underscore
   (`externalRules`, pas `external-rules`).
4. **Sélecteur desktop multi-écran** : `MONITOR:^N` ou nom exact ; un
   `desktop=^N` seul est relatif au moniteur focus, pas global.
5. **`colors.sh` / `config.bspwm.sh` non +x** : normal — ils sont **sourcés**
   (`. file`), pas exécutés. `bspwmrc` et `scripts/*` sont +x, c'est voulu.

## Fichiers touchés

| Fichier | Changement |
|---------|------------|
| `~/.config/bspwm/bspwmrc` | règles assign + btop rectangle |
| `~/.config/bspwm/config.bspwm.sh` | `ignore_ewmh_focus true` |
| `~/.config/bspwm/scripts/externalRules` | créé puis **supprimé** |

## Addendum 2026-07-18 (audit doc↔réalité)

- **Scratchpad :** `st` est bien installé (`pacman -Q st 0.9.3-1`) et déjà câblé
  (`scratch-btop`, `scratchpad` via sxhkdrc-bspwm). Pas de migration alacritty nécessaire.
- **Wallpaper :** `~/.config/wallpaper` → symlink créé vers `~/wallpapers/blackCat2.jpg`, `screen-layout` restauré pour lire ce chemin.
- Le seul vrai reste optionnel du §11 = binds split/resize type i3. Suivi : `MIGRATION_STATUS.md`.
