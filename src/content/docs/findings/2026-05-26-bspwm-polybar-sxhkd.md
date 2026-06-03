---
title: "Trouvailles bspwm / polybar / sxhkd — matière chapitres 10-11"
type: findings
date: 2026-05-26
related:
  - docs/brainstorms/2026-05-26-guide-migration-arch-btrfs-tiling-brainstorm.md
  - day7.md
status: RÉSOLU — vraie cause = keymap fr-mac pas prêt quand sxhkd grabbe au boot ; fix = setxkbmap avant sxhkd dans bspwmrc (voir §1). Correctifs appliqués.
---


> Matière brute pour les chapitres 10 (hotkeys/sxhkd) et 11 (WM tiling) du guide.
> Investigation menée le 26/05. **Aucune correction n'est encore appliquée à la config** : ce doc
> consigne les diagnostics et les fixes décidés, à exécuter au moment du plan.
> Convention de sourcing : `[officiel]` = doc/man ; `[retex]` = retour d'expérience de cette machine.

## 1. Bug clavier au reboot (raccourcis morts) — diagnostic

**Symptôme :** au démarrage à froid (reboot), les raccourcis bspwm ne répondent pas ; après un
logout/relogin « à chaud », ils marchent.

**CAUSE RÉELLE (confirmée par le log) — keymap pas prêt quand sxhkd grabbe au boot.** ⚠️ Le
raisonnement initial « ce n'est pas un layout tardif » était **FAUX**. Le clavier est bien déclaré dans
`/etc/X11/xorg.conf.d/00-keyboard.conf` (`XkbLayout fr`, `XkbVariant mac`), mais au tout début de
`bspwmrc` (bspwm démarre très vite) les **keysyms accentués ne sont pas encore résolvables**. Preuve, le
log de sxhkd au boot (`/tmp/sxhkd-boot.log`) :
`No keycodes found for keysym 233/167/232/231/224` = **é, §, è, ç, à** (5 des 10 symboles de bureau).
Une séquence `{…}` à 10 touches ne pouvant plus s'apparier aux 10 commandes `^{1-9,10}`, **toute** la
règle de switch casse → **aucun** bureau ne change (pas seulement les 5 accentués).
**Fix appliqué** : `setxkbmap -layout fr -variant mac` (synchrone) dans `bspwmrc` **avant** sxhkd → keymap
complet garanti au grab → résolu, validé au reboot.

**Piste INVALIDÉE — course de process `[retex, testée]`** : rebooté après dédoublonnage du lanceur
(sxhkd retiré de `.xprofile`, un seul lanceur dans `bspwmrc`) **et** ajout de `-m -1` → le bug
**persistait** (`pgrep` ne montrait d'ailleurs qu'une seule instance). Ce n'était donc **pas** la course.
Description conservée pour mémoire :
- `~/.xprofile` fait `sleep 1` puis `sxhkd&` (instance commune).
- `~/.config/bspwm/bspwmrc` fait `pkill -x sxhkd` → attend la mort → relance `sxhkd -c sxhkdrc-bspwm sxhkdrc`.

Au boot chargé, si `bspwmrc` exécute `pkill` **avant** que le `sxhkd&` de `.xprofile` ait fini son
`fork`/`exec`, le pkill ne trouve rien, l'instance bspwm démarre, **puis** celle de `.xprofile` démarre
en doublon → deux daemons grabbent les mêmes touches → grabs en conflit. Dépendant du timing → ne se
voit qu'au reboot.

**Test décisif (depuis SSH, juste après un reboot dans bspwm) :**
```
DISPLAY=:0 pgrep -a sxhkd
```
- 2 instances → course confirmée. 1 = problème de grab. 0 = pas lancé.

**Test complémentaire** (raccourcis KO, sans relogin) :
```
pkill sxhkd; DISPLAY=:0 sxhkd -c ~/.config/sxhkd/sxhkdrc-bspwm ~/.config/sxhkd/sxhkdrc &
```
Si les touches reviennent → c'est bien une course au démarrage, la config est saine.

## 2. Fix sxhkd : un seul lanceur par WM

**Décision** (hygiène « un lanceur par WM » — appliquée ; ⚠️ mais ce n'est **PAS** le fix du bug clavier
au boot : la vraie cause est le keymap, voir §1) :
- **Retirer** `sxhkd&` (et le `sleep 1`) de `~/.xprofile`.
- `bspwmrc` lance `sxhkd -c ~/.config/sxhkd/sxhkdrc ~/.config/bspwm/sxhkd/sxhkdrc-bspwm &`. Garder le
  `pkill -x sxhkd` + boucle d'attente **uniquement** pour le rechargement `bspc wm -r` (plus de
  concurrent au boot).
- i3 : `exec_always --no-startup-id sxhkd -c ~/.config/sxhkd/sxhkdrc &` (commun seul ; overlay i3 plus tard).

**Ancrages `[officiel]` (`man sxhkd`)** :
- Syntaxe `sxhkd [OPTIONS] [EXTRA_CONFIG ...]` : `-c` = config principale, les fichiers suivants sont
  des **configs additionnelles positionnelles**. Donc `sxhkd -c A B` lit bien A **et** B.
- Rechargement par `SIGUSR1` (`pkill -USR1 -x sxhkd`) — relit les fichiers passés au lancement (donc
  ne suffit pas pour ajouter l'overlay bspwm : il faut relancer avec les deux fichiers).
- `-m COUNT` : pour clavier **non-QWERTY / layout non standard**, passer `-m 1` (ou `-m -1`) car sxhkd
  ignore les MappingNotify par défaut. Option **défensive** envisageable (fr-mac), pas la cause du bug.

**Validation par l'exemple `[retex]`** : JustAGuyLinux (`~/GIT/bspwm-setup/bspwm/bspwmrc`) lance sxhkd
**uniquement** dans `bspwmrc`, jamais via xprofile — confirme le modèle « un lanceur par WM ».

**Principe d'organisation décidé** : le *fichier* commun `~/.config/sxhkd/sxhkdrc` est partagé ; le
*process* ne l'est pas (on ne change jamais de WM dans une même session X — logout = X tué = clients tués).

## 3. Polybar — tray déprécié

**Source autoritaire `[officiel + log polybar]`** : polybar (3.7.2) écrit au démarrage
(`/tmp/polybar-main.log`) :
```
tray: bar/main.tray-position is deprecated, use the dedicated tray module
tray: bar/main.tray-maxsize is deprecated, use the dedicated tray module
```
Le module tray dédié est **« New in version 3.7.0 »** (polybar.readthedocs.io/.../modules/tray.html).

**Fix** : retirer `tray-position`/`tray-maxsize` de `[bar/main]`, ajouter un module dédié et le
référencer dans une liste `modules-*` :
```ini
[module/tray]
type = internal/tray
tray-size = 66%      ; défaut, relatif à la hauteur de barre
tray-spacing = 8px
; tray-padding, tray-background = ${root.background} dispos aussi
```
```ini
modules-right = cpu memory filesystem pulseaudio tray
```
Limite `[officiel]` : une seule instance du module tray active à la fois (toutes barres confondues).

## 4. Polybar — le `:` dans les noms de bureaux : RÉSOLU par titux

**Le `:` a été retiré des noms** dans la config vivante (`bspwmrc`) :
`/code  !command  )monit  /  " Web"  " Music"  +blank  " Mail"  "+ DevBrowser"  +other` — plus aucun `:`.

**Pourquoi c'était cassé `[log polybar, état périmé]`** : le `:` est le séparateur de champs du rapport
d'état bspwm ; un `:` *dans un nom* cassait le parsing du module `internal/bspwm` → spam
`Undefined tag`. La syntaxe `numéro:nom` était une habitude i3, pas idiomatique bspwm. **Réglé** par le
renommage sans `:` (à reconfirmer en relançant polybar : le log lu plus tôt datait de l'ancien état).

**Affichage numéro + nom — À FAIRE (titux le veut) `[officiel, wiki polybar Module:-bspwm]`** : la
config actuelle affiche `%name%` seul → « /code » **sans le chiffre**. titux veut « 1:/code ». Le
module `internal/bspwm` accepte `%name%`, `%index%`, `%icon%` ; passer les labels de `%name%` à
**`%index%:%name%`** (le `:` est rendu par polybar, pas stocké dans le nom) :
```ini
label-focused  = %index%:%name%
label-occupied = %index%:%name%
label-urgent   = %index%:%name%
```
Tous les bureaux ayant un nom, **aucun cas « 6:6 »** à gérer. NB : `%index%` est l'index du bureau
(1-based) ; vérifier qu'il colle bien aux numéros voulus à la première relance de polybar.

## 5. Écarts i3 → bspwm (fonctionnalités tiling)

Basé sur `~/.config/i3/config` (réel) vs `~/.config/sxhkd/sxhkdrc-bspwm` actuel. **Focus : RÉSOLU**
(on garde `h/j/k/l` vim-like sous bspwm — décision Q7 du brainstorm, ce n'est PAS un bug).

| Fonctionnalité i3 | Mécanisme bspwm | État bspwm actuel |
|---|---|---|
| Resize (mode `$mod+r`) | `bspc node -z {dir} …` | absent |
| Drag souris flottantes (`floating_modifier`) | `bspc config pointer_modifier` + `pointer_action1 move` | absent |
| Scratchpad | pas de natif → script (JAGL en a un) | absent |
| Layout stacked/tabbed (`$mod+Tab`) | pas de natif → `bspwm-tabs` (JAGL) ou monocle | absent |
| Split direction (`$mod+b`/`$mod+v`) | `bspc node -p {dir}` (preselect) | absent (et `super+b`=btop) |
| Focus tiling↔floating (`$mod+space`) | `bspc node -f` / `-g` | absent |
| Workspace next/prev (`$mod2+Tab`) | `bspc desktop -f {prev,next}.local` | absent |
| back_and_forth | `bspc desktop -f last` | absent |
| Assign app→workspace | `bspc rule -a <class> desktop='^N'` | absent (que floating) |
| Règles floating riches | `bspc rule` (classe/nom **seulement**) | pauvres + limite officielle |
| 12 bureaux | `bspc monitor -d … 12` | 10 |

**Limite paradigme `[officiel, man bspwm]`** : bspwm est du tiling **pur** — pas de conteneurs
stacked/tabbed comme i3. `bspc rule` matche par **classe/nom/instance**, **pas** par `window_role`
(d'où la perte des nombreuses règles i3 `for_window [window_role=…]`).

## 6. Autostart — vérité par WM

`[retex, lecture des configs]` :
- **XFCE** : `xfce4-session` lance le XDG autostart automatiquement.
- **bspwm** : `dex -a -e bspwm` dans `bspwmrc`.
- **i3** : **PAS** de `dex -a` — seulement `dex ~/.config/autostart/StartGpg.desktop` (+ polkit, pamac-tray).
  → d'après la config, nm-applet/xss-lock/vpn **ne sont pas auto-lancés sous i3** (incohérence existante).

`[officiel]` : `dex` et `xfce4-session` respectent `OnlyShowIn=`/`NotShowIn=` des `.desktop`.

**Modèle décidé** : daemons *communs* (vpn, nm-applet, xss-lock, polkit) en XDG autostart, lancés par
`dex -a -e <wm>` sur **chaque** WM concerné (→ **ajouter `dex -a` à i3** pour réparer l'incohérence) ;
le *WM-spécifique* (overlay sxhkd, polybar) lancé dans le **rc du WM**, **jamais** en autostart (sinon
il « fuite » vers les autres WM).

## 7. Bons keybindings JAGL à reprendre (adaptés `h/j/k/l`, voir Q7)

Concepts repris de `~/GIT/bspwm-setup/bspwm/sxhkd/sxhkdrc` `[référence]`. **Les touches exactes restent
à définir par titux** au chapitre 11 (les binds ci-dessous sont ceux de JAGL, à arbitrer) :
- script d'aide affichant tous les raccourcis (+ notif de bienvenue). Très utile. *(touche à définir)*
- **`bspwm-tabs`** attach/detach = le concept « onglets dwm » du PENDING day7. Script dans le dépôt JAGL. *(touches à définir)*
- rééquilibrer toutes les fenêtres : `bspc node @/ -B`. *(touche à définir)*
- rotation : `bspc node -R ±90`. *(touches à définir)*
- resize symétrique (zoom des deux côtés). *(touches à définir)*
- `xsetroot -cursor_name left_ptr` dans `bspwmrc` (curseur-flèche du PENDING day7).

⚠️ JAGL est QWERTY et bind les bureaux sur `super + {1-9,0}`. La config de titux **utilise déjà les
symboles** (`ampersand eacute quotedbl …`, Leçon 13 day7) pour les bureaux sur fr-mac — on n'importe
donc PAS les binds de bureaux de JAGL.

## 8. `single_monocle` — TRANCHÉ (la config vivante fait foi)

`bspwmrc` a `bspc config single_monocle true` : **choix délibéré de titux**, décision en vigueur. Le
PENDING de `day7.md` qui le disait « écarté » est **périmé** — c'est le journal qui est en retard sur
la config, pas l'inverse. Le guide documente la config vivante (`true`).
**Note :** entre config et journal, la config (décision actuelle) prime sur le journal périmé ; mais la
**cible** reste le guide raisonné, qui peut corriger la config. Hiérarchie : journaux < config vivante < spec.

## Renvois
- Hook plugin marvin neutralisé + garde-fou natif : voir la mémoire `marvin-plugin-hooks`.
- Décision touches focus `h/j/k/l` : Q7 du brainstorm lié.
