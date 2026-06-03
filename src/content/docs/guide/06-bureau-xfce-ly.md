---
title: "06 — Bureau (XFCE + Ly)"
---

## Objectif

Monter un environnement de bureau léger : un **login manager minimal** (Ly), une session XFCE
correctement localisée, la connectivité réseau, et un **suspend/lock cohérent** quel que soit le WM
utilisé ensuite (i3, XFCE, bspwm). À la fin de ce chapitre, on se connecte via Ly, la session source un
point d'entrée commun, et fermer le capot verrouille **avant** de suspendre.

Le *pourquoi* : le bureau est la couche où convergent des composants qui se marchent dessus
(gestionnaire d'alimentation, verrouillage, session). Poser dès maintenant un **point d'entrée de
session unique** (`~/.xprofile`) et un verrouillage piloté par logind évite d'avoir à reconfigurer ces
briques pour chaque WM ajouté plus tard.

## Procédure

### 1. Login manager : Ly

Ly est un greeter minimal en ncurses. Il **source `~/.xprofile`** avant de lancer la session choisie —
c'est ce comportement qui en fait le point d'entrée commun à tous les WM. _(Selon Arch Wiki : Ly.)_
→ décision figée : `docs/adr/0001-login-manager-ly.md`.

### 2. Point d'entrée de session : le bon `~/.xprofile`

`~/.xprofile` (à la **racine du home**) est le fichier sourcé au login. Il porte les réglages X communs
à toutes les sessions (locale, numlockx, DPMS, agent de fichiers) :

```sh
# ~/.xprofile — illustration (extrait)
export LANG=fr_FR.UTF-8
numlockx on
xset s off -dpms          # réglages d'écran
```

Le **daemon de hotkeys (sxhkd) n'est volontairement pas lancé ici** : il est démarré par le rc de chaque
WM (chapitre 10), pour éviter une course de processus au démarrage. Attention aussi : un fichier
`~/.config/xprofile` n'est **pas** lu par Ly (voir Pièges). _(Selon Arch Wiki : Xprofile.)_

### 3. XFCE en français

Vérifier d'abord que la locale existe (`locale -a | grep fr`) — sinon la générer (chapitre 5, piège du
`sed` silencieux). Puis exporter `LANG` dans le **vrai** `~/.xprofile`. La langue débloque au passage la
recherche des greffons par leur nom localisé (voir Pièges, greffon « Boutons de fenêtres »). _(Selon Arch Wiki : Xfce, Locale.)_

### 4. Réseau : NetworkManager

NetworkManager fournit la connectivité et son applet (`nm-applet`) en zone de notification, lancé via
l'autostart XDG. Sa cohabitation avec le VPN est traitée au chapitre 7. _(Selon Arch Wiki : NetworkManager.)_

### 5. Suspend/lock cohérent via xss-lock

`xss-lock` relie le verrouillage de session à logind : il lance le verrou **avant** la mise en veille,
de façon identique sous tous les WM.

```sh
# autostart — illustration
xss-lock -- ~/.config/scripts/lock
```

logind gère l'action du capot (`HandleLidSwitch=suspend`). La chaîne complète : capot → logind →
inhibiteur pre-suspend → `xss-lock` → `~/.config/scripts/lock` → veille matérielle. _(Selon Arch Wiki : Power management#Suspend and hibernate, man logind.conf.)_
→ décision figée : `docs/adr/0009-lock-suspend-xss-lock.md`.

## Décisions & pourquoi

### Verrouillage piloté par logind, pas par le gestionnaire XFCE

On confie la veille à logind + xss-lock plutôt qu'à `xfce4-power-manager`. Raison : le gestionnaire XFCE
pose un **inhibiteur D-Bus** (`handle-lid-switch` en mode *block*) qui **empêche logind de suspendre** ;
et surtout, une solution liée à XFCE ne serait pas portable vers i3/bspwm. On neutralise donc
`xfce4-power-manager` (override autostart `Hidden=true`) et on centralise sur logind + un script de
verrouillage commun (`~/.config/scripts/lock`, voir ADR 0013). C'est ce qui garantit un comportement
**identique sur les trois WM**.

### Un point d'entrée de session unique

Mettre les lancements communs dans `~/.xprofile` (sourcé par Ly) plutôt que dans la config de chaque WM
évite la duplication et les divergences. Chaque WM ajouté hérite ainsi automatiquement du verrouillage,
du réseau et du VPN. **Exception** : le daemon de hotkeys (sxhkd) est lancé par le rc de chaque WM, pas
par `~/.xprofile`, pour éviter une course de processus (chapitre 10).

### Thème dark cohérent — couche bureau, pas couche WM

Comme le verrouillage, l'apparence **dark** est une couche bureau **transverse** (GTK 2/3/4, libadwaita,
Qt 5/6), réglée une fois pour tous les WM. Elle se pose via un `settings.ini` **par famille GTK**
(`gtk-3.0/`, `gtk-4.0/`) + `color-scheme=prefer-dark` (gsettings) pour libadwaita + `QT_STYLE_OVERRIDE=kvantum`
pour Qt ; et `~/.xprofile` propage l'env de session au portal (`dbus-update-activation-environment` +
relance `xdg-desktop-portal-gtk`) pour que le file chooser « Enregistrer sous » hérite du thème. Point
clé : **ne jamais forcer `GTK_THEME` global** — il s'impose au chrome mais **casse libadwaita** (rendu
mixte, prouvé en A/B). → décision complète : `docs/adr/0014-theme-dark-modele-b-sans-gtk-theme.md`
(piège côté WM minimal : chapitre 11).

## Pièges

- **Deux fichiers `xprofile`** — `~/.config/xprofile` n'est **jamais lu** par Ly ; seul `~/.xprofile` (à
  la racine du home) l'est. Éditer le mauvais donne des reboots sans effet → vérifier lequel existe
  (`ls -la ~/.xprofile`) avant d'écrire dedans. _(retour d'expérience.)_

- **`xfce4-power-manager` bloque la mise en veille** — son inhibiteur `handle-lid-switch` en mode block
  empêche logind de suspendre → le neutraliser (override `~/.config/autostart/…desktop` avec
  `Hidden=true`, qui tient au reboot). _(retour d'expérience.)_

- **Nom de greffon de panneau introuvable** — en anglais, le greffon des fenêtres ouvertes s'appelle
  *Window Buttons* ; cherché sous un autre nom (ou une autre langue), on tombe sur *Window Menu* qui ne
  fait pas la même chose → passer XFCE en français débloque le bon nom (« Boutons de fenêtres »). _(retour d'expérience.)_

- **Daemon qui réécrit sa config à la fermeture** — certains daemons (ex. le gestionnaire de fichiers)
  réécrivent leur configuration en mémoire quand on les ferme, annulant une modif appliquée à chaud →
  **tuer le daemon avant** d'appliquer le réglage, puis le relancer. _(retour d'expérience.)_

> _Matériel ancien._ L'init du serveur X peut être notablement plus rapide avec le bon pilote vidéo sur
> GPU ancien — détaillé en **annexe A** (pilote `intel` vs `modesetting`).
