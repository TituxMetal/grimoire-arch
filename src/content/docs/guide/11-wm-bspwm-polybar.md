---
title: "11 — WM tiling : i3 → bspwm + polybar"
---

## Objectif

Ajouter **bspwm** comme environnement tiling, avec **polybar** comme barre, **sans toucher** à i3 ni
XFCE (sélection au login, repli immédiat). À la fin de ce chapitre, bspwm est une session Ly à part
entière, piloté entièrement au clavier via le daemon sxhkd (chapitre 10), avec une barre légère et un
thème cohérent.

Le *pourquoi* : bspwm suit un modèle tiling **scriptable** différent d'i3 — il n'a **aucun raccourci
interne**, tout passe par `bspc` piloté depuis sxhkd. C'est précisément ce qui rend l'ajout *additif* :
on réutilise la fondation hotkeys déjà portable, on n'ajoute que le spécifique bspwm, et i3/XFCE restent
intacts comme filet.

## Procédure

### 1. Installer (approche additive)

```sh
pacman -S bspwm polybar     # bspwm fournit bspwm + bspc
```

bspwm est une session indépendante : on réutilise tel quel `~/.xprofile`, l'autostart XDG (xss-lock,
nm-applet, polkit, VPN), et les scripts communs (`~/.config/scripts/` dans le PATH — voir section 8).
_(Selon Arch Wiki : Bspwm.)_

### 2. `~/.config/bspwm/bspwmrc` (exécutable !)

Le `bspwmrc` est un script déclaratif : il doit être **exécutable** (`chmod +x`), sinon bspwm démarre
« nu » (voir Pièges). Il pose les desktops, les gaps/bordures, les couleurs, quelques règles flottantes,
déclenche l'autostart XDG et lance polybar :

```sh
# ~/.config/bspwm/bspwmrc — exécutable — illustration (extrait)
# 10 bureaux nommés, sans « : » (le « : » casse le parsing du module bspwm — voir Pièges)
bspc monitor -d "/code" ")monit" "/" " Web" " Music" "+blank" " Mail" "+ DevBrowser" "+other"
bspc config window_gap 8
bspc config border_width 2
bspc config single_monocle true                # 1 fenêtre → plein cadre sans gap (choix délibéré)
bspc rule -a Timeshift-gtk state=floating      # classe via xprop (voir Pièges)

# couleurs (bordures) injectées depuis le thème actif — voir section 7
. ~/.config/bspwm/colors.sh

# un seul lanceur sxhkd, ici dans le rc du WM (commun + overlay bspwm).
# setxkbmap AVANT sxhkd : keymap fr-mac prêt avant le grab (sinon raccourcis morts au boot, voir Pièges).
# pkill+attente : inoffensif au boot (rien à tuer), utile au rechargement (bspc wm -r relance ce rc).
setxkbmap -layout fr -variant mac
pkill -x sxhkd; while pgrep -x sxhkd >/dev/null; do sleep 0.2; done
sxhkd -m -1 -c ~/.config/sxhkd/sxhkdrc ~/.config/bspwm/sxhkd/sxhkdrc-bspwm &

# autostart XDG — garde run-once par session (sentinelle $XDG_RUNTIME_DIR) : sans elle,
# « bspc wm -r » ré-exécute ce rc et empile nm-applet/polkit/xss-lock/vpn en doublon (voir Pièges).
autostartFlag="${XDG_RUNTIME_DIR}/bspwm-autostart-done"
[ -e "$autostartFlag" ] || { dex -a -e bspwm & touch "$autostartFlag" ; }   # autostart sur chaque WM
~/.config/polybar/launch.sh &
```

_(Selon man bspwm, man bspc.)_

### 3. Bindings bspwm dans sxhkd

Les touches bspwm vivent dans le fichier `sxhkdrc-bspwm` (chargé seulement sous bspwm, chapitre 10) et
pilotent `bspc`. Conventions retenues :

```
# focus (vim-like) — voir Décisions
super + {h,j,k,l}            → bspc node -f {west,south,north,east}
super + shift + {h,j,k,l}    → bspc node -s {west,south,north,east}
# états (toggles : « ~ » = bascule)
super + f                    → bspc node -t '~fullscreen'
super + shift + space        → bspc node -t '~floating'
# (pas de toggle « tiled » dédié : super + t sert déjà à timeshift dans le sxhkdrc commun)
# bureaux : symboles (fr-mac) pour aller, super+shift+chiffre pour envoyer (chapitre 10)
# recharger : super + shift + r (commun) → reload-wm → reload VALIDÉ (voir Décisions « Reload sûr »)
# menus : super + Escape (power), super + shift + t (thèmes), super + shift + i (cheatsheet)
# bspwm-tabs : super + ctrl + a / super + ctrl + d (attach / detach)
# navigation onglets (dans un groupe) : alt+Tab (suivant), alt+{symboles fr-mac} (onglet N),
#   alt+grave (menu), alt+q (fermer l'onglet) — binds compilés dans ~/.config/bspwm/tabbed/config.h
# fermer : binding WM-aware (voir Pièges)
```

### 4. Polybar

Une barre légère avec **icônes Nerd Font** (FiraCode Nerd Font) : CPU, mémoire, disque, volume, date
française + numéro de semaine, titre de la fenêtre active. Un `launch.sh` tue/relance proprement et force
la locale pour la date :

```sh
# ~/.config/polybar/launch.sh — illustration
pkill -x polybar; while pgrep -x polybar >/dev/null; do sleep 0.2; done   # idempotent au reload
export LC_TIME=fr_FR.UTF-8
polybar main >/tmp/polybar-main.log 2>&1 &
```

Les **couleurs** sont isolées dans `~/.config/polybar/colors.ini`, inclus depuis `config.ini` :

```ini
# ~/.config/polybar/config.ini — extrait
[bar/main]
include-file = ~/.config/polybar/colors.ini
font-0 = FiraCode Nerd Font Mono:size=10
wm-restack = bspwm    # empile la barre SOUS le plein écran (voir Pièges)
```

**`wm-restack = bspwm` est indispensable** : sans lui, polybar (dock `_NET_WM_STATE_ABOVE`) repasse
**au-dessus** des fenêtres plein écran dès le premier ré-empilement (un `super + shift + r`, un theme
switch). Le boot frais masque le bug (le plein écran est d'abord empilé devant). Détail et mesures :
`docs/solutions/bspwm/polybar-fullscreen-wm-restack.md`.

`colors.ini` est écrasé par le theme switcher (section 7) à chaque changement de thème.

Pour afficher **numéro + nom** de bureau (« 1: /code »), le module `internal/bspwm` rend le format
`%index%:%name%` — le `:` est **produit par polybar**, pas stocké dans le nom (qui, lui, ne doit
contenir aucun `:`, voir Pièges) :

```ini
# [module/bspwm] — illustration
label-focused  = %index%:%name%
label-occupied = %index%:%name%
```

Pour la zone de notification, utiliser le **module `tray` dédié** (polybar ≥ 3.7) plutôt que les
anciennes clés `tray-position`/`tray-maxsize` de `[bar/main]` (dépréciées — warnings dans les logs) ;
une seule instance du module tray peut être active à la fois. _(Selon wiki polybar : modules bspwm et tray.)_

### 5. Session Ly + power menu

La session est fournie par le paquet : `/usr/share/xsessions/bspwm.desktop` existe déjà — il suffit de
**redémarrer le service `ly`** pour qu'il rescanne et affiche « bspwm ». Le power menu est
`~/.config/bspwm/scripts/powermenu` (rofi thémé, style titux), bindé sur `super + Escape` — il propose
Verrouiller / Déconnexion / Veille / Redémarrer / Éteindre (via logind+polkit, sans sudo).
_(Selon Arch Wiki : Ly.)_

### 6. Confort : cheatsheet et captures d'écran

La cheatsheet des raccourcis est bindée sur `super + shift + i` (rofi `-dmenu`, lecture seule) :
```sh
# ~/.config/bspwm/scripts/help — rofi cheatsheet
```

Les captures d'écran passent par Flameshot, bindé dans le fichier commun `sxhkdrc` :
- `super + shift + p` — capture immédiate → `~/screenshots/YYYY-MM-DD_HH-MM.png`
- `super + shift + ctrl + p` — capture différée 3 s (pour capturer menus/rofi ouverts)

### 7. Theme switcher

Le script `~/.config/bspwm/scripts/thememenu` (rofi) bascule entre plusieurs thèmes dark sans relancer
la session. Bind : `super + shift + t`.

Chaque thème est un répertoire `~/.config/bspwm/themes/<nom>/` contenant un manifeste `theme.conf` et
deux fichiers de couleurs (`colors.ini` pour polybar, `colors.sh` pour les bordures bspwm). Un switch
copie ces fichiers vers les emplacements actifs, recharge polybar, applique les couleurs bspwm via
`bspc config`, met à jour dunst et le thème rofi (thème officiel).

**Portée du switch :** polybar (couleurs), bordures bspwm, dunst, rofi (thème officiel).
**Hors scope :** Alacritty (couleurs du terminal inchangées, hors switcher), wallpaper (fond X par défaut).

9 thèmes dark retenus : arc-dark, catppuccin, dracula, everforest, github-dark, gruvbox, kanagawa,
monokai, rose-pine. → ADR 0012.

### 8. Scripts par portée

Les scripts perso ne vivent plus dans un dossier `bin` fourre-tout : ils sont rangés par portée, sans
mélanger manuel et autostartés (l'ancien dossier de scripts est vidé → ADR 0013) :

| Dossier | Portée | Exemples |
|---------|--------|---------|
| `~/.config/scripts/` | Commun à tous les WM, dans le PATH | `gpgctl`, `vpn`, `lock`, `pinentry-auto` |
| `~/.config/bspwm/scripts/` | Spécifique bspwm | `powermenu`, `thememenu`, `help` |

Tous les autostart `.desktop` et références config pointent vers ces chemins. → ADR 0013.

## Décisions & pourquoi

### Focus/déplacement en `h/j/k/l` (vim-like) — écart assumé avec i3

Sous bspwm, les touches de focus sont **`h/j/k/l`** (ouest/sud/nord/est), la convention vim standard, et
adjacentes sur la rangée de repère AZERTY fr-mac. C'est un **choix délibéré pour le nouveau WM** :
l'i3 historique utilisait un mapping idiosyncrasique (`k/l/o/m`), volontairement **non repris** ici. Cet
écart est assumé, ce n'est pas un bug — on profite du nouveau WM pour adopter la convention vim.

### bspwm pilote tout via sxhkd

bspwm n'ayant aucun raccourci interne, `sxhkd + bspc` est l'approche standard et portable. On exploite le
daemon déjà en place (chapitre 10) plutôt que d'introduire un mécanisme propre à bspwm. → modèle figé :
`docs/adr/0010-hotkeys-sxhkd-daemon-unique.md`.

### Session séparée, pas remplacement d'i3

Sur une machine d'expérimentation, on veut **comparer** les WM : bspwm s'ajoute, i3/XFCE restent le repli
sélectionnable. Toute la mise en place est additive et réversible (paquets + fichiers neufs).

### polybar plutôt que lemonbar

polybar fournit des modules prêts à l'emploi (cpu/mem/disk/volume/date) proches de l'i3status existant,
en config déclarative — moins de scripting que lemonbar, et léger.

### `single_monocle` activé

`bspc config single_monocle true` : quand un bureau ne contient **qu'une seule** fenêtre, elle s'affiche
en plein cadre, sans gap ni bordure. C'est un **choix délibéré** (confort en mono-écran). Un journal a pu
le noter « écarté » à un stade antérieur — c'est périmé : la config vivante l'a activé, et c'est elle qui
fait foi.

> **NB — pas en cause dans le « faux plein écran ».** Un temps soupçonné de « déguiser » une perte de
> plein écran au reload, `single_monocle` n'y est **pour rien** : le bug (barre qui repasse devant le
> plein écran après un `super + shift + r`) était un problème d'**empilement** de polybar (dock
> `_NET_WM_STATE_ABOVE` sans `wm-restack`), pas une perte d'état ni un padding. La fenêtre était bien
> plein écran (`0,0,1280,800`) ; seule la barre passait au-dessus. Fix = `wm-restack = bspwm` (voir
> § Polybar et `docs/solutions/bspwm/polybar-fullscreen-wm-restack.md`).

### Compositeur (picom) — retenu

picom était écarté **a priori** (GPU HD 3000). L'essai l'a **adopté** : la contrainte GPU porte sur
Vulkan/compute shaders (moteurs GPUI/wgpu/GTK4), pas sur l'OpenGL classique. picom en backend **`glx`**
(OpenGL GL 3.1, supporté par la HD 3000) tourne proprement — il fournit déjà le **fondu inter-bureaux** (en
usage quotidien) et apporte les **coins arrondis** (qui **exigent `glx`** : `xrender` ne les rend pas,
vérifié 30/05). C'est un compositeur **local à bspwm** (i3 ne le lance
pas — pas de `dex -a` ; XFCE a `xfwm4`) → config `~/.config/bspwm/picom/picom.conf`, lancée depuis
`bspwmrc` (idempotent), avec corner-radius et neutralisation de tout autostart système concurrent.
→ ADR 0016 (compositeur picom glx), ADR 0007.

### Reload sûr : valider avant d'appliquer (façon i3)

bspwm n'a pas de *validate-before-apply* : `bspc wm -r` ré-exécute `bspwmrc` à l'aveugle. Deux risques en
découlent. **(1) Lockout** — `bspwmrc` tue puis relance sxhkd ; une erreur shell *avant* le respawn
laisserait sxhkd mort, sans aucun raccourci pour réagir. **(2) Doublons d'autostart** — sans garde, chaque
reload réempile nm-applet/polkit/xss-lock/vpn (voir Pièges, et la garde sentinelle § 2).

D'où le reload **validé**, branché sur le `super + shift + r` commun via l'aiguilleur (chapitre 10) :
`~/.config/bspwm/scripts/reload` valide chaque bloc **avant** de toucher la session — sinon rien n'est
appliqué (session et sxhkd intacts) et dunst nomme le bloc fautif. Notif dunst à **chaque** reload
(réussi ✓ ou refusé). Granularité :

| Bloc | Validation | Si invalide |
|---|---|---|
| `bspwmrc` + `config.bspwm.sh` + `colors.sh` | `bash -n` (syntaxe) | **bloque** (seul vrai risque de lockout) |
| `sxhkdrc` (commun + bspwm) | heuristique (lisible, non vide, ≥ 1 raccourci + ≥ 1 commande) | bloque |
| polybar `config.ini` | heuristique (section `[bar/…]`) | bloque |

`bash -n` ne couvre que la **syntaxe** : l'invariant tacite est que `bspwmrc` n'avorte pas avant le
respawn de sxhkd (pas de `set -e`, et les erreurs `bspc` n'interrompent pas le script).
→ ADR 0015, `docs/solutions/bspwm/reload-sur.md` § 1-§ 4.

**Config-only par défaut, `--restart` pour le structurel.** Le mode par défaut
n'est **plus** un `bspc wm -r` : il re-source un fragment idempotent partagé (`config.bspwm.sh`,
`applyConfig` = les `bspc config` + `colors.sh`) **à chaud**, sans reconstruire l'arbre. Intérêt :
**pas de respawn-flash** de picom/polybar/sxhkd à chaque `super + shift + r` ni de valse dex. Le
`bspc wm -r` est relégué à `reload --restart` (appel manuel, pour règles/monitor/autostart), qui
**réapplique les `bspc rule`** (ex. pamac → flottant). `thememenu` passe lui aussi par le config-only
(+ relance polybar pour ses couleurs). Une seule source de vérité des réglages : `config.bspwm.sh`,
sourcé par `bspwmrc` **et** par `reload`. → `docs/solutions/bspwm/reload-sur.md` § 5.

> ⚠️ **C'est du confort, pas le fix du « faux plein écran ».** Ce dernier était un problème
> d'**empilement** de polybar (la barre repassait *devant* le plein écran, axe z), réglé par
> **`wm-restack = bspwm`** côté polybar (§ 4 « Polybar » et
> `docs/solutions/bspwm/polybar-fullscreen-wm-restack.md`). Le plein écran n'a jamais perdu son état :
> `bspc wm -r` le préserve (vérifié 01/06).

### Écarts tiling i3 → bspwm (état actuel, honnête)

bspwm est du tiling **pur** : pas de conteneurs *stacked/tabbed* comme i3, et `bspc rule` matche par
**classe/nom/instance**, jamais par `window_role` (d'où la perte des règles i3 `for_window
[window_role=…]`). Plusieurs fonctionnalités i3 ne sont **pas encore rebindées** ; le mécanisme bspwm
existe, c'est le binding qui reste à poser :

| Fonctionnalité i3 | Mécanisme bspwm | État actuel |
|---|---|---|
| Resize | `bspc node -z <dir> …` | absent |
| Drag souris flottantes | **défauts bspwm** (`pointer_modifier mod4`, `pointer_action1 move`, `pointer_action3 resize_corner`) | **en place** — natif, rien à poser : `super+clic gauche` = déplacer, `super+clic droit` = redimensionner par le coin (vérifié 06/06) |
| Scratchpad | scripts `scratchpad` (terminal) + dropdowns d'app, sous `super + alt` | **en place** — voir `docs/solutions/bspwm/scratchpad-dropdowns-fenetres-cachees.md` (4 pièges résolus) |
| Stacked/tabbed | `bspwm-tabs` (compilé depuis JAGL) ou monocle | **adopté** — `super+ctrl+a` / `super+ctrl+d` (ADR 0017) |
| Preselect (split) | `bspc node -p <dir>` | absent |
| Focus tiling↔floating | `bspc node -f`/`-g` | absent |
| Workspace next/prev, back_and_forth | `bspc desktop -f {next,prev,last}.local` | absent |
| Assign app→bureau | `bspc rule -a <class> desktop='^N'` | absent (seules des règles floating existent) |

Ce tableau est l'**état vérifié**, pas une cible : à compléter au fil des besoins, sans prétendre que
c'est déjà en place.

## Pièges

- **`bspwmrc` non exécutable** — bspwm démarre « nu » (écran noir, pas de desktops) → `chmod +x`, et
  tester `bspc wm -d` avant un logout complet. _(retour d'expérience.)_

- **Raccourcis de bureau morts au reboot (keymap pas prêt)** — sur un WM qui démarre vite (bspwm), le rc
  lance sxhkd **avant** que les keysyms accentués du layout fr-mac (`é è ç à §`) soient résolvables :
  sxhkd loggue `No keycodes found for keysym …`, et la séquence `super + {symboles}` ne s'appariant plus
  aux 10 commandes `^{1-9,10}`, **aucun** bureau ne switche (pas seulement les accentués). Après coup
  (relance, relogin) le keymap est prêt → ça marche, d'où un bug **propre au reboot**. Fix : forcer le
  layout **avant** sxhkd dans le rc — `setxkbmap -layout fr -variant mac` (synchrone) — et lancer sxhkd
  avec `-m -1`. Diagnostic : rediriger la stderr de sxhkd vers un log et y chercher `No keycodes found`.
  _(retour d'expérience.)_

- **sxhkd lancé en double (`.xprofile` + rc du WM)** — deux instances grabbent les mêmes touches, symptôme
  intermittent → hygiène « un lanceur par WM » (chapitre 10) : un seul lanceur, dans le rc du WM.
  _(NB : c'est de l'hygiène — ce n'était pas la cause du bug clavier au reboot ci-dessus.)_ _(retour d'expérience.)_

- **`:` dans un nom de bureau** — le `:` est le séparateur de champs du rapport d'état bspwm ; un `:`
  *dans un nom* casse le parsing du module `internal/bspwm` (spam `Undefined tag`). L'habitude i3
  `numéro:nom` ne se transpose pas → noms **sans `:`**, et afficher le numéro via `%index%:%name%`
  côté polybar. _(retour d'expérience.)_

- **Autostart XDG non déclenché selon le WM** — bspwm ne lance pas l'autostart XDG nativement (d'où
  `dex -a -e bspwm` dans `bspwmrc`) ; et i3, dans la config existante, **n'a pas** de `dex -a` → nm-applet,
  xss-lock et le VPN ne s'y lancent pas automatiquement (incohérence connue). Modèle cible : `dex -a -e
  <wm>` sur **chaque** WM concerné. _(retour d'expérience.)_

- **`bspc wm -r` empile les doublons d'autostart** — un reload ré-exécute `bspwmrc`, donc `dex -a` :
  nm-applet/polkit/xss-lock/vpn se relancent en double à chaque reload. Fix : garde *run-once* par session
  (sentinelle `$XDG_RUNTIME_DIR`, tmpfs vidé au logout) autour de `dex` (voir § 2) ; la sentinelle est
  effacée au **login** depuis `.xprofile` (et non au reload) pour garantir un autostart frais à la session
  suivante même si `/run/user` survit à une autre session. _(retour d'expérience.)_

- **Fermeture de fenêtre peu fiable** — `xdotool getactivewindow windowkill` est capricieux sous bspwm →
  binding WM-aware : `bspc node -c 2>/dev/null || xdotool getactivewindow windowkill`. _(retour d'expérience.)_

- **Règle flottante par la mauvaise classe** — la classe WM_CLASS réelle peut différer du nom attendu
  (ex. `Timeshift-gtk`, pas `Timeshift`) → la lire avec `xprop WM_CLASS` avant d'écrire la règle. _(retour d'expérience.)_

- **Thème GTK clair sous WM minimal** — sans daemon XSETTINGS (comme `xfsettingsd` sous XFCE), les apps
  GTK retombent sur leurs fichiers statiques. **Ne pas forcer `GTK_THEME`** : il s'impose au chrome mais
  **casse libadwaita** (apps GTK4 modernes type pamac : le contenu résiste → rendu *mixte*, prouvé en A/B
  le 30/05). Voie correcte : un `settings.ini` **par famille** (`gtk-3.0/`, `gtk-4.0/`), libadwaita via
  `color-scheme=prefer-dark` (gsettings), et `dbus-update-activation-environment` au login pour que le
  portal (file chooser « Enregistrer sous ») hérite du thème. Qt5/6 : `QT_STYLE_OVERRIDE=kvantum`.
  → décision complète (A/B, leviers, alternatives) dans l'**ADR 0014** (thème dark Modèle B). _(retour d'expérience.)_

- **Nouvelle session invisible dans Ly** — Ly scanne `/usr/share/xsessions/` au démarrage : un `.desktop`
  ajouté n'apparaît qu'après **redémarrage du service `ly`**. _(retour d'expérience.)_

- **polybar en anglais pour la date** — polybar n'hérite pas forcément du `LANG` de session → forcer
  `LC_TIME` dans le script de lancement. _(retour d'expérience.)_

> _Référence et perspective._ Le dépôt **JustAGuyLinux bspwm-setup**
> (<https://codeberg.org/justaguylinux/bspwm-setup>) est gardé **cloné en référence** (sources du
> theme switcher, polybar, `thememenu`, modèle « un lanceur par WM »). Le code de `bspwm-tabs` et du
> scratchpad y a d'abord été lu en référence ; leur état réel figure dans le tableau « Écarts tiling »
> (bspwm-tabs et scratchpad **adoptés**). Ne pas confondre dépôt-référence cloné et fonctionnalité
> implémentée. bspwm n'a par ailleurs pas de barre de titre (→ module polybar `xwindow`) ; les coins
> arrondis sont fournis par **picom** (adopté — voir Décisions et ADR 0016).
