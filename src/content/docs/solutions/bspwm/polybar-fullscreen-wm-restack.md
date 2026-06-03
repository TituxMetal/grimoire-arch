---
title: "Polybar passe AU-DESSUS des fenêtres plein écran après un reload (fix : wm-restack = bspwm)"
type: solution
date: 2026-06-01
domain: bspwm
component: polybar/config.ini
symptoms:
  - "au reboot frais le plein écran est VRAI (barre cachée) ; après un super+shift+r la barre repasse devant"
  - "une bascule de thème (thememenu) fait aussi réapparaître la barre par-dessus le plein écran"
  - "la fenêtre semble pourtant bien plein écran — c'est juste la barre qui est visible en haut"
root_cause: "polybar est un dock _NET_WM_STATE_ABOVE sans wm-restack : il reste empilé (axe z) au-dessus des fenêtres plein écran. Au boot l'empilement initial met le plein écran devant ; tout ré-empilement (super+shift+r, theme switch, bspc config) laisse le flag ABOVE de la barre reprendre le dessus."
severity: medium
related:
  - docs/findings/2026-05-31-bspwm-fullscreen-perdu-au-reload.md
  - docs/solutions/bspwm/reload-sur.md
  - docs/guide/11-wm-bspwm-polybar.md
---


> **Statut : implémenté et validé en live** (titux, 01/06, plusieurs cycles plein écran ↔ tuilé + reload +
> theme switch). Destiné à être rejoué sur la **devbox**.

## Problème

Sous bspwm + polybar : au **reboot frais**, une fenêtre plein écran (`super + f`) est un **VRAI** plein
écran — elle couvre tout l'écran, la barre est cachée derrière. Mais dès un **`super + shift + r`** (ou
une bascule de thème, ou n'importe quel `bspc config` qui restacke), la **barre repasse visible en haut**,
par-dessus la fenêtre. Le plein écran a l'air « faux » alors qu'il ne l'est pas.

## Root Cause — empilement (axe z), PAS perte d'état

Diagnostic confirmé par mesure live (`xwininfo`, `xprop`, `bspc query`) :

- La fenêtre plein écran a une géométrie X **réelle** de `x=0 y=0 largeur=1280 hauteur=800` : elle couvre
  bien **tout** l'écran (VRAI plein écran géométrique). L'état bspwm reste `state=fullscreen`.
- **Polybar** est un `_NET_WM_WINDOW_TYPE_DOCK` à `0,0,1280,34` avec `_NET_WM_STATE = STICKY, ABOVE` et un
  strut `top=34`. Le flag **`ABOVE`** la maintient au-dessus des autres fenêtres **sur l'axe z** — y compris
  le plein écran. Elle est donc **peinte par-dessus** les 34 px du haut de la fenêtre.

Au boot, l'empilement initial place la fenêtre plein écran au-dessus de la barre (barre cachée). Mais
polybar **n'a pas `wm-restack`** → elle s'appuie sur son seul `_NET_WM_STATE_ABOVE`. Au moindre
**ré-empilement** (reload, theme switch, `bspc config`), le flag `ABOVE` reprend le dessus → barre devant.

> ⚠️ **Piège de diagnostic.** `bspc query -T -n <id>` renvoie un champ `rectangle` = `0,34,1280,766` pour
> ce nœud — c'est le rectangle **de layout interne** (zone monocle avec padding du strut), **pas** la
> géométrie réelle de la fenêtre X. Se fier à ce champ fait croire à tort que la fenêtre est « rabotée à
> y=34 » (perte de plein écran). La **vraie** géométrie (`xwininfo -id <id>`) est `0,0,1280,800`. Toujours
> mesurer la fenêtre X réelle, pas le modèle bspwm. (C'est ce piège qui a produit deux diagnostics faux —
> cf. finding `2026-05-31`, sections « Correction 01/06 ».)

## Fix

Une seule ligne dans `~/.config/polybar/config.ini`, section `[bar/main]` :

```ini
[bar/main]
monitor =
wm-restack = bspwm
...
```

`wm-restack = bspwm` dit à polybar de se **ré-empiler en coordination avec bspwm**, donc **sous** les
fenêtres plein écran, et de le **re-faire à chaque ré-empilement**. Relancer polybar (`launch.sh`) pour
l'appliquer. Le `_NET_WM_STATE_ABOVE` reste posé par polybar, mais c'est `wm-restack` qui pilote
l'empilement réel.

Validé : plusieurs allers-retours plein écran ↔ tuilé + `super + shift + r` + theme switch — la barre
repasse derrière **à chaque fois**, le plein écran reste VRAI.

## Prevention

- **Mesurer la géométrie X réelle** (`xwininfo`) avant de conclure à une perte d'état : un « faux plein
  écran » est presque toujours un problème d'**empilement de dock**, pas de géométrie.
- Sur tout setup bspwm + polybar (barre = dock), poser **`wm-restack = bspwm`** d'emblée : sans lui, la
  barre repasse devant le plein écran au moindre restack. C'est le pendant de « la barre disparaît derrière
  les fenêtres » (qui se règle, lui, par `override-redirect`/`wm-restack` aussi — mêmes leviers).
- Tester le plein écran **après un reload**, pas seulement après un boot frais (le boot masque le bug).

### Rejouer sur la devbox

Identique (polybar y sera aussi un dock). Ajouter `wm-restack = bspwm` dans `[bar/main]` dès la mise en
place de polybar. Indépendant du gestionnaire de reload (le bug n'a rien à voir avec `bspc wm -r` ni avec
le script reload : c'est purement l'empilement de la barre).

## Related

- Finding (enquête + 2 diagnostics faux corrigés) : `docs/findings/2026-05-31-bspwm-fullscreen-perdu-au-reload.md`
- Reload sûr (architecture config-only / `--restart` — confort, PAS le fix de ce bug) : `docs/solutions/bspwm/reload-sur.md`
- Guide : `docs/guide/11-wm-bspwm-polybar.md` (§ Polybar, § single_monocle, § Reload sûr)
