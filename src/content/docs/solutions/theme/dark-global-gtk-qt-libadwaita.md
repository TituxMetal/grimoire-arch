---
title: "Dark correct partout : GTK 2/3/4 + libadwaita + Qt 5/6 (Modèle B, sans GTK_THEME)"
type: solution
date: 2026-05-30
domain: theme
component: .xprofile / gtk-3.0+gtk-4.0/settings.ini / env/00-core.sh / Kvantum / xdg-desktop-portal
symptoms:
  - "file chooser GTK « Enregistrer sous » clair quelle que soit l'app"
  - "pamac (GTK4/libadwaita) mi-thème : barre sombre mais liste de paquets blanche"
  - "QtPass et apps Qt6 blanches (fond clair)"
  - "une app fraîchement installée n'est pas dark sans config par-app"
root_cause: "GTK_THEME=Arc-Dark global fuit dans libadwaita et CASSE son rendu ; le portal xdg-desktop-portal-gtk n'hérite pas l'env de session ; Qt6 n'a aucun thème (qt6ct absent)"
severity: medium
related:
  - docs/findings/2026-05-30-theme-dark-gtk-qt-portal-diagnostic.md
  - docs/plans/2026-05-30-feat-theme-dark-global-plan.md
  - docs/adr/0012-theme-switcher-bspwm.md
---


> **Statut : implémenté et validé en live** (titux, 30/05, captures `~/screenshots` 19:1x après reboot).
> Destiné à être rejoué sur la **devbox**.

## Problème

Trois symptômes de thème, sur un système qui se voulait « tout Arc-Dark » :

1. **File chooser** GTK « Enregistrer sous » **clair** quelle que soit l'app.
2. **Pamac** (GTK4 + libadwaita) **mi-thème** sur le MBP : barre/sidebar sombres mais **liste de
   paquets blanche** (la devbox, elle, est uniformément sombre — propre).
3. **QtPass** (Qt6) et apps Qt6 **blanches**.

## Root Cause

- **`GTK_THEME=Arc-Dark` (env global, posé dans `~/.xprofile`) fuit dans libadwaita et CASSE son
  rendu.** L'A/B 30/05 l'a prouvé : avec `GTK_THEME`, pamac perd ses cartes/pastilles (rendu dégradé) ;
  **sans** `GTK_THEME`, pamac est uniformément sombre et propre.
- **libadwaita ignore `gtk-theme-name` (settings.ini ET GTK_THEME-en-tant-que-thème) et ne suit QUE
  `color-scheme`.** Test de contrôle décisif : pamac **sans** `GTK_THEME` mais `color-scheme=default`
  (settings.ini toujours `Arc-Dark`) → pamac **clair**. Donc `settings.ini` ne thème pas libadwaita ;
  seul `color-scheme=prefer-dark` le rend sombre. (`GTK_THEME` est un cran plus fort : libadwaita tente
  de charger le thème nommé → casse.)
- **Le portal n'hérite pas de l'env de session.** `xdg-desktop-portal-gtk` (GTK3, activé par
  `systemd --user`) a un env **nu** : ni `XDG_CURRENT_DESKTOP`, ni les vars Qt. Rien ne faisait
  `dbus-update-activation-environment` → file chooser non thémé.
- **Qt6 sans thème.** `qt6ct` absent → `QT_QPA_PLATFORMTHEME=qt5ct` ne charge aucun plugin de thème pour
  Qt6 → défaut clair.

## Fix — « Modèle B » (PAS de `GTK_THEME`)

Choisi sur captures A/B (non destructif, override d'env au lancement), pas sur intuition. Tout est dans
`~/.config` / `~`, **pas** dans ce repo de trace.

| Cible | Changement |
|---|---|
| **libadwaita** (pamac…) | gsettings `org.gnome.desktop.interface color-scheme='prefer-dark'` (seul levier qui marche) |
| **GTK 3** | `~/.config/gtk-3.0/settings.ini` → `gtk-theme-name=Arc-Dark` (déjà présent) |
| **GTK 4 natif** (hors portal) | `~/.config/gtk-4.0/settings.ini` **créé** : `gtk-theme-name=Arc-Dark` + `gtk-application-prefer-dark-theme=true` |
| **Qt 5 ET Qt 6** | `export QT_STYLE_OVERRIDE=kvantum` dans `~/.config/env/00-core.sh` (couvre Qt6 **sans qt6ct**) ; `~/.config/Kvantum/kvantum.kvconfig` → `theme=KvArcDark` |
| **file chooser (portal)** | dans `~/.xprofile` : `dbus-update-activation-environment --systemd QT_QPA_PLATFORMTHEME QT_STYLE_OVERRIDE XDG_CURRENT_DESKTOP DISPLAY XAUTHORITY` puis `systemctl --user restart xdg-desktop-portal-gtk.service` |
| **suppression** | `export GTK_THEME=Arc-Dark` **retiré** de `~/.xprofile` (la cause du mi-thème) |

Pourquoi B et pas A (« tout-env » `GTK_THEME` global) : A est séduisant (1 var couvre toutes les
versions GTK) mais **casse libadwaita**. Coût de B : ~1 fichier `settings.ini` par famille GTK (3.0,
4.0), posé une fois, à vie ; une famille future (GTK5) = 1 fichier de plus, une fois.

## Prevention

- **Ne JAMAIS revendre `GTK_THEME` global comme solution miracle** : il fuit dans libadwaita. Pour du
  dark libadwaita, le seul levier est `color-scheme`.
- **Le portal (file chooser) doit recevoir l'env de session** : `dbus-update-activation-environment`
  **avant** de relancer le portal, sinon il reste nu (lancé par systemd --user à froid).
- **Qt6 sans qt6ct** : `QT_STYLE_OVERRIDE=kvantum` est la voie portable (couvre Qt5+Qt6) ; vérifier le
  plugin `/usr/lib/qt6/plugins/styles/libkvantum.so`.
- **Future-proof** : une app nouvelle = au moins dark sans config par-app (GTK→settings.ini de sa
  famille, libadwaita→color-scheme, Qt→kvantum). C'est le critère titux (cf. `[[titux-theme-dark-minimal-central]]`).
- **Méthode** : trancher un choix de thème par **A/B réversible** (override d'env + captures côte à
  côte), jamais sur affirmation. Le test de contrôle (`color-scheme=default`) isole la vraie cause.

### Rejouer sur la devbox

La devbox est déjà « propre » (pamac sombre) parce qu'elle **ne force pas `GTK_THEME`** — elle valide a
posteriori le Modèle B. À reporter si besoin : `gtk-4.0/settings.ini`, `QT_STYLE_OVERRIDE=kvantum` +
`KvArcDark`, et le couple `dbus-update-activation-environment` + relance portal pour le file chooser.
Attention au split env : MBP = `~/.config/env/*.sh` ; devbox = `~/.bashrc` monolithique.

## Related
- Finding (diagnostic read-only, avant A/B) : `docs/findings/2026-05-30-theme-dark-gtk-qt-portal-diagnostic.md`
- Plan (Phases 0→2, A/B + application) : `docs/plans/2026-05-30-feat-theme-dark-global-plan.md`
- ADR 0014 (décision figée : Modèle B, jamais `GTK_THEME` global) : `docs/adr/0014-theme-dark-modele-b-sans-gtk-theme.md`
- ADR 0012 (theme switcher bspwm — thèmes dark multiples) : `docs/adr/0012-theme-switcher-bspwm.md`
- Mémoires : `[[titux-theme-dark-minimal-central]]`, `[[pamac-theme-casse]]`, `[[feedback-ne-jamais-ressortir-nord]]`
- Hors périmètre (séparé) : changement de thème **live** sans relog (xsettingsd) = day8 PENDING
