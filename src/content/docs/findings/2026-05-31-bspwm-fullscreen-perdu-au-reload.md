---
title: "Le reload bspwm (Super+Shift+r → bspc wm -r) fait retomber le plein écran en tuilé (« faux plein écran »)"
type: findings
date: 2026-05-31
domain: bspwm
component: scripts/reload / bspwmrc / polybar
symptoms:
  - "après un reboot fresh le plein écran est VRAI ; après un Super+Shift+r il devient FAUX"
  - "une fenêtre plein écran « remplit l'écran » mais la barre polybar réapparaît en haut + fine bordure"
  - "le plein écran ne survit pas à un reload, alors qu'il survit à un reboot"
root_cause: "bspc wm -r (bspwm 0.9.12) ne réapplique pas l'état fullscreen au redémarrage de l'arbre ; single_monocle + gapless_monocle + le strut polybar (padding top=34) déguisent la fenêtre redevenue tuilée en quasi-plein-écran"
severity: medium
related:
  - docs/solutions/bspwm/reload-sur.md
  - docs/findings/2026-05-30-bspwm-reload-et-verdicts-phase6.md
  - docs/guide/11-wm-bspwm-polybar.md
status: >-
  RÉSOLU (01/06). VRAIE cause = empilement (axe z) : polybar (dock _NET_WM_STATE_ABOVE) sans wm-restack
  repasse au-dessus du plein écran après tout ré-empilement. La fenêtre est bien plein écran (géométrie X
  réelle 0,0,1280,800) ; ce n'est PAS une perte d'état. Fix = `wm-restack = bspwm` dans polybar (1 ligne).
  Deux diagnostics faux corrigés en chemin (perte d'état, puis padding) — voir « Corrections ». Solution
  figée : docs/solutions/bspwm/polybar-fullscreen-wm-restack.md.
---


> **✅ RÉSOLU 01/06 — vraie cause : empilement (axe z), PAS perte d'état.** Mesuré en live (`xwininfo`,
> `xprop`) : la fenêtre plein écran a une géométrie X **réelle** de `0,0,1280,800` — elle couvre bien tout
> l'écran. **Polybar** est un dock `_NET_WM_STATE_ABOVE` **sans `wm-restack`** → elle reste empilée
> **au-dessus** de la fenêtre et peint les 34 px du haut. Au boot l'empilement initial met le plein écran
> devant ; tout ré-empilement (`super+shift+r`, theme switch, `bspc config`) laisse le flag `ABOVE` de la
> barre reprendre le dessus. **Fix = une ligne `wm-restack = bspwm`** dans `[bar/main]` (polybar).
> Indépendant du script reload et de `bspc wm -r`. Solution :
> `docs/solutions/bspwm/polybar-fullscreen-wm-restack.md`.
>
> **Deux diagnostics faux corrigés en chemin (à garder comme leçon) :**
> 1. *(agent, 31/05)* « `bspc wm -r` perd l'état fullscreen → la fenêtre retombe tiled ». FAUX : l'état
>    `state=fullscreen` est conservé.
> 2. *(agent, 01/06)* « la géométrie est rabotée à `y=34` (padding moniteur) ». FAUX aussi : c'était le
>    champ `rectangle` du **modèle interne** bspwm (`bspc query`), pas la fenêtre X réelle. La vraie
>    géométrie est `0,0,1280,800`. **Toujours mesurer la fenêtre X (`xwininfo`), pas le rectangle bspwm.**
>
> C'est l'utilisateur qui, par sa perception (« la barre passe au-dessus, axe z »), a remis le diagnostic
> sur les rails. L'analyse historique ci-dessous est conservée comme trace — lire avec ces corrections.

> Convention de sourcing : `[officiel]` = doc/man ; `[retex]` = retour d'expérience de cette machine.
> Investigation menée en lecture seule (aucune config modifiée) sur la session bspwm en cours.

## Problème

Sous bspwm, une fenêtre en plein écran (`super + f` → `bspc node -t '~fullscreen'`) :

- **après un reboot fresh** → plein écran **VRAI** : la fenêtre couvre tout le moniteur, la barre est cachée ;
- **après un `Super + Shift + r`** (reload) → plein écran **FAUX** : la fenêtre remplit l'écran *sauf*
  la barre polybar (réapparue en haut), avec une fine bordure. Ça **ressemble** à du plein écran mais
  n'en est plus un.

Le reload lui-même est sain (la validation `validate-before-apply` fonctionne) ; le bug est un **effet
de bord** de ce que le reload exécute au bout de la chaîne.

## Root Cause

**Chaîne déclenchée par `Super + Shift + r`** (vérifiée fichier par fichier) :

```
~/.config/sxhkd/sxhkdrc            super + shift + r
  → ~/.config/scripts/reload-wm    (aiguilleur : sous bspwm…)
    → ~/.config/bspwm/scripts/reload   (validateConfig OK)
      → bspc wm -r                  ← le coupable
```

`bspc wm -r` (« restart ») ré-exécute tout `bspwmrc` et reconstruit l'arbre. Sur **bspwm 0.9.12**, ce
restart **ne réapplique pas l'état `fullscreen`** des nœuds : la fenêtre retombe à son état précédent
(`tiled`). [retex + officiel]

**Preuve live** (`bspc query -T -d`, capturée pendant l'investigation) :

```
win Alacritty  state=tiled  lastState=fullscreen
rectangle: x=0 y=34 width=1280 height=766
```

`state=tiled` + `lastState=fullscreen` = la fenêtre **était** en plein écran et a été **rétrogradée en
tuilée** sans qu'on re-presse `super + f`. Une autre fenêtre (`0x02800003`), passée en plein écran
*après* le dernier reload, est restée `fullscreen` → cohérent : seul ce qui **traverse** un reload perd
l'état.

**Pourquoi le faux plein écran est trompeur** — trois réglages combinés : [retex]

- `single_monocle = true` → une fenêtre seule passe automatiquement en layout `monocle` ;
- `gapless_monocle = true` → pas de gap en monocle ;
- **strut polybar** : le moniteur `LVDS1` (1280×800) porte un `padding {top: 34}` que **polybar** réserve
  via son strut (ce padding n'est **pas** dans `bspwmrc`).

Résultat : la fenêtre redevenue tuilée remplit tout l'écran **sauf les 34 px de la barre** (`y=34,
height=766`), avec la bordure de 2 px (`borderless_monocle = false`). Un *vrai* plein écran bspwm couvre
`y=0, 1280×800` en **ignorant** padding et barre. Sans `single_monocle`, la régression sauterait aux yeux
(fenêtre tuilée classique) ; avec lui, elle est **déguisée** en plein écran.

`ignore_ewmh_fullscreen = none` (défaut) → bspwm honore bien l'EWMH : **ce n'est donc pas un réglage
manquant**, c'est le comportement de `bspc wm -r` lui-même.

## L'insight transverse (le vrai nœud)

Le problème dépasse le plein écran : **le reload utilise un marteau (`bspc wm -r`, qui ré-exécute *tout*
`bspwmrc`) pour ce qui est, le plus souvent, un simple rafraîchissement de `bspc config`** (couleurs,
thème, gaps). **Tous** les effets de bord connus du reload en découlent :

- retombée du plein écran (ce finding) ;
- respawn de picom / polybar / sxhkd à chaque reload ;
- la valse de la sentinelle dex (cf. `docs/solutions/bspwm/reload-sur.md`).

Un reload *config-only* qui se contenterait de re-sourcer `colors.sh` et de rejouer les `bspc config`
(idempotents) **ne toucherait à aucun état de fenêtre**.

## Pistes de fix (NON implémentées — à trancher)

- **(A) Reload « config-only » sans `bspc wm -r`.** Le `reload` re-source `colors.sh` + rejoue les
  `bspc config` au lieu de redémarrer le WM. Corrige ce bug **et** supprime la moitié des effets de bord
  ci-dessus. Limite : ne reprend pas les changements structurels de `bspwmrc` (règles, monitor) — mais
  ceux-ci sont rares et peuvent garder un chemin « restart » explicite si besoin.
- **(B) Garder `bspc wm -r` et réappliquer le plein écran après.** Avant le restart :
  `bspc query -N -n .fullscreen` (mémoriser les nœuds) ; après : `bspc node <id> -t fullscreen`.
  Plus simple à greffer sur l'existant, mais conserve les autres effets de bord.

## Prevention

- Considérer `bspc wm -r` comme **destructeur d'état runtime** (plein écran, et probablement positions
  flottantes / sticky / layer — **à vérifier** : poser une flottante + une sticky, reload, observer).
- Tester toute évolution du reload avec une fenêtre **en plein écran** ouverte, pas seulement à vide.
- Doc à mettre à jour une fois le fix choisi : `docs/solutions/bspwm/reload-sur.md` (mentionne le reload
  comme « sûr » sans signaler cet effet de bord) et `guide/11` (§ « Reload sûr », § `single_monocle`).

### Rejouer sur la devbox

Le même piège vaut pour tout reload bspwm basé sur `bspc wm -r`. Préférer d'emblée le reload *config-only*
(piste A) sur la devbox, ou intégrer la réapplication du plein écran (piste B).

## Related

- Solution reload sûr (validate-before-apply, dex idempotent) : `docs/solutions/bspwm/reload-sur.md`
  — même chaîne de reload, root cause **différente** (lockout / doublons dex) ; cet effet de bord
  plein écran n'y est pas couvert.
- Finding mécanisme reload : `docs/findings/2026-05-30-bspwm-reload-et-verdicts-phase6.md` (§1-§3).
- Guide : `docs/guide/11-wm-bspwm-polybar.md` (§ « Reload sûr », § `single_monocle`).
- Mémoire : `[[polybar-x-session-restart]]` (DISPLAY=:0 pour piloter X hors session ; ne jamais relancer
  sxhkd à la main).
