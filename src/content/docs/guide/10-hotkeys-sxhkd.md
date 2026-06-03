---
title: "10 — Hotkeys portables"
---

## Objectif

Centraliser les raccourcis clavier dans un **daemon unique et indépendant du WM**, partagé entre i3,
XFCE et bspwm. À la fin de ce chapitre, un seul `sxhkd` tourne, lancé depuis le point d'entrée de
session ; une base commune de raccourcis vaut partout, et chaque WM ajoute sa couche spécifique sans
conflit.

Le *pourquoi* : redéfinir les raccourcis dans chaque WM (les `bindsym` d'i3, les réglages XFCE, etc.)
duplique le travail et diverge avec le temps. Un daemon de hotkeys externe découple les raccourcis du WM
— c'est exactement ce qui rend la base portable quand on ajoute bspwm (chapitre 11).

## Procédure

### 1. Remplacer xbindkeys par sxhkd

`sxhkd` lit un ou plusieurs fichiers de configuration et exécute des commandes sur des combinaisons de
touches. Il remplace xbindkeys partout (lancement d'apps, luminosité, volume, média, fermeture de
fenêtre). Point structurant : **sxhkd est lancé par le rc de chaque WM, pas par `~/.xprofile`** (voir
Décisions — c'est ce qui évite la course de processus au démarrage). _(Selon man sxhkd, Arch Wiki : Sxhkd.)_

### 2. Découper commun / par-WM

`sxhkd` accepte plusieurs fichiers de config : `-c` désigne la config **principale**, et les fichiers
suivants sont des **configs additionnelles positionnelles** (`sxhkd -c PRINCIPALE [EXTRA …]`). On garde un
`sxhkdrc` **commun** (apps, média, volume, luminosité — valable sous tous les WM) et un fichier **par WM**
pour les bindings spécifiques. Chaque WM lance sxhkd dans son propre rc :

```sh
# i3 (config i3) — commun seul
exec_always --no-startup-id sxhkd -c ~/.config/sxhkd/sxhkdrc

# bspwm (bspwmrc) — commun + overlay bspwm
sxhkd -c ~/.config/sxhkd/sxhkdrc ~/.config/bspwm/sxhkd/sxhkdrc-bspwm &
```

Ainsi les touches bspwm n'existent **que** sous bspwm, sans collision avec i3. → modèle figé :
`docs/adr/0010-hotkeys-sxhkd-daemon-unique.md`.

### 3. Recharger et envelopper

- Rechargement : un seul `super + shift + r` (commun) appelle l'**aiguilleur** `~/.config/scripts/reload-wm`,
  qui détecte le WM (`pgrep`) et route : sous **bspwm** → reload **validé** (chapitre 11) ; sous **i3/XFCE**
  → `pkill -USR1 -x sxhkd` (à chaud, inchangé). Un seul chord, jamais dupliqué : sxhkd résout un doublon par
  ordre de parsing (premier chargé gagne), donc un second `super + shift + r` dans l'overlay serait **ombragé**
  — l'aiguilleur évite et l'ombrage et le warning `already grabbed`.
- Les applis terminal s'enveloppent : `alacritty -e <cmd>`, jamais le binaire seul.
- Syntaxe sxhkd : la commande est précédée d'une **tabulation** obligatoire (vérifiable avec `cat -A` → `^I`).

## Décisions & pourquoi

### Un lanceur par WM

Le *fichier* commun (`sxhkdrc`) est partagé, mais le *processus* ne l'est pas : **chaque WM lance sa
propre instance de sxhkd dans son rc**, avec la composition de fichiers qui lui convient (commun seul sous
i3/XFCE qui ont leurs bindings de tiling internes ; commun + overlay sous bspwm qui n'a aucun raccourci
interne). C'est légitime car on ne change jamais de WM dans une même session X (logout = X tué = clients
tués). Lancer sxhkd **aussi** depuis `~/.xprofile` recréerait un second processus concurrent → c'est
précisément la cause de la course aux grabs (voir Pièges). Modèle « un lanceur par WM » : réutilisation
maximale, zéro conflit inter-WM.

### Pourquoi pas un raccourci par config de WM

Garder les raccourcis applicatifs dans i3/XFCE/bspwm séparément reproduirait le problème qu'on cherche à
éliminer. Le daemon externe est le point unique de vérité pour tout ce qui n'est pas du tiling pur.

## Pièges

- **Clavier fr-mac/AZERTY : binder les chiffres pour les bureaux** — sur fr-mac, les chiffres exigent
  Shift au niveau matériel ; sxhkd résout alors `super + 1` en `super + shift + <touche>`, ce qui entre
  en collision avec le binding d'envoi `super + shift + 1`, tandis que `super + <chiffre>` sans shift
  tombe sur un symbole non bindé. **Fix** : binder les **symboles** (`ampersand`, `eacute`, `quotedbl`,
  `apostrophe`, `parenleft`, `section`, `egrave`, `exclam`, `ccedilla`, `agrave`) pour aller au bureau,
  et `super + shift + {1-9,0}` pour y envoyer. _(retour d'expérience — différence avec i3, qui grabbe par
  keycode et masque donc le problème.)_

- **Deux lanceurs de sxhkd (`.xprofile` + rc du WM)** — au démarrage chargé, le rc du WM peut tuer/relancer
  avant que l'instance de `.xprofile` ait fini son `fork`/`exec` : deux daemons finissent par grabber les
  mêmes touches → grabs en conflit, raccourcis morts (visible surtout au reboot, pas au relogin à chaud).
  **Fix structurel** : un seul lanceur, dans le rc du WM ; retirer sxhkd de `.xprofile`. Diagnostic :
  `DISPLAY=:0 pgrep -a sxhkd` (2 instances = course confirmée). _(retour d'expérience.)_

- **Recharger sxhkd après modif de l'overlay** — `pkill -USR1` relit seulement les fichiers passés au
  lancement ; pour ajouter/retirer un fichier (overlay bspwm), il faut **relancer** en attendant la mort
  de l'ancien process pour ne pas recréer une course :

  ```sh
  pkill -x sxhkd; while pgrep -x sxhkd >/dev/null; do sleep 0.2; done
  sxhkd -c ~/.config/sxhkd/sxhkdrc ~/.config/bspwm/sxhkd/sxhkdrc-bspwm &
  ```

  _(retour d'expérience.)_

- **Clavier non-QWERTY et `MappingNotify`** — sxhkd ignore les `MappingNotify` par défaut ; sur un layout
  non standard (fr-mac), `sxhkd -m 1` peut être passé en option défensive (ce n'est pas la cause du bug de
  course ci-dessus). _(Selon man sxhkd.)_

- **Lancer une appli terminal sans terminal** — `btop`, `nvim` lancés en binaire seul ne s'affichent
  pas → `alacritty -e <cmd>`. _(retour d'expérience.)_

- **Espace au lieu d'une tabulation devant la commande** — la règle sxhkd est ignorée silencieusement →
  tabulation obligatoire (`cat -A` pour vérifier). _(Selon man sxhkd.)_

> _Matériel ancien._ Certaines touches Apple (F7-F12, Fn) **n'émettent aucun keysym** X11 sur ce clavier ;
> les binds média correspondants restent dormants — détail en **annexe A**.
