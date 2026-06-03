---
title: "feat: thème dark correct partout (GTK 2/3/4 + libadwaita + Qt 5/6), le moins de fichiers possible"
type: plan
date: 2026-05-30
status: complete
confidence: high
related:
  - docs/findings/2026-05-30-theme-dark-gtk-qt-portal-diagnostic.md
  - docs/solutions/theme/dark-global-gtk-qt-libadwaita.md
  - docs/adr/0014-theme-dark-modele-b-sans-gtk-theme.md
---


Forcer **Arc-Dark là où c'est possible**, **dark correct partout ailleurs**, avec le **minimum
de fichiers** et de façon **future-proof** (toute app future = au moins dark, sans suivre quelle
version de quel toolkit elle utilise). Décision finale tranchée par une **expérimentation A/B**.

## Problème (constaté, captures 30/05)

- File chooser GTK « Enregistrer sous » **clair** quelle que soit l'app.
- **QtPass** (Qt6) **blanc** : `qt6ct` absent → `QT_QPA_PLATFORMTHEME=qt5ct` ne charge aucun plugin
  de thème pour Qt6 → défaut clair.
- **Pamac** (GTK4 + libadwaita) **mi-thème** sur le MBP : barre/sidebar sombres mais **liste de
  paquets blanche**. Sur la devbox, pamac est **uniformément sombre** (propre).

## Diagnostic (confirmé en lecture système)

- **Aucun daemon XSETTINGS** (xsettingsd absent ; xfsettingsd = `OnlyShowIn=XFCE`).
- **Le portal n'hérite pas de l'env de session** : `xdg-desktop-portal-gtk` (GTK3, lancé par
  systemd --user) n'a ni `GTK_THEME` ni `XDG_CURRENT_DESKTOP`. Rien ne fait
  `dbus-update-activation-environment`.
- Config GTK = Arc-Dark partout (`gtkrc-2.0`, `gtk-3.0/settings.ini`), gsettings = `gtk-theme
  Arc-Dark` + `color-scheme prefer-dark`. **Pas de `gtk-4.0/settings.ini`.**
- **Pamac = libadwaita** : ignore structurellement tout thème custom ; ne suit que `color-scheme`.
- **QtPass = Qt6**, `qt6ct` absent. Kvantum a un thème **KvArcDark** dispo.
- `GTK_THEME=Arc-Dark` est dans `.xprofile` (override **dur**, hérité par toutes les apps).

**Hypothèse centrale (à prouver en Phase 0)** : le pamac « mi-thème » du MBP = `GTK_THEME=Arc-Dark`
qui **fuit dans libadwaita** (chrome attrape Arc-Dark, contenu libadwaita résiste → mixte). La
devbox serait propre car elle ne force PAS `GTK_THEME`.

## Les deux modèles candidats (l'A/B tranche)

- **Modèle A — « tout env »** : `GTK_THEME=Arc-Dark` + `QT_STYLE_OVERRIDE=kvantum`, on vire les
  `settings.ini`. Avantage : 1 var couvre toutes les versions GTK. Risque : casse libadwaita (pamac
  mixte).
- **Modèle B — « settings.ini par famille »** : **PAS** de `GTK_THEME` ; thème via
  `gtk-3.0/settings.ini` (existe) + `gtk-4.0/settings.ini` (neuf) ; libadwaita via `color-scheme`
  (propre, non contaminé). Avantage : libadwaita propre (devbox-like). Coût : ~1 fichier par famille
  GTK (3.0, 4.0), posé une fois, couvrant toutes les apps de la famille à vie (jamais par-app) ; une
  nouvelle famille (GTK5) = 1 fichier de plus, une fois.

**Communs aux deux** (quel que soit le gagnant) :
- `dbus-update-activation-environment --systemd <vars> XDG_CURRENT_DESKTOP DISPLAY XAUTHORITY` dans
  `.xprofile` + relance portal → file chooser thémé.
- **Qt** : `QT_STYLE_OVERRIDE=kvantum` (couvre Qt5 **et** Qt6, sans qt6ct) + Kvantum=**KvArcDark**.
- **libadwaita** : `color-scheme=prefer-dark` (gsettings, déjà posé).

## Phase 0 — Expérimentation A/B (NON destructive, captures à l'appui)

Tester par **override d'env au lancement** (la session globale n'est PAS modifiée tant qu'on n'a pas
décidé). Lancer côte à côte, capturer, comparer **avec titux** :

- [x] **T0.1** — pamac (libadwaita) : `env GTK_THEME=Arc-Dark pamac-manager` **vs** `env -u GTK_THEME
  pamac-manager`. → prouve si `GTK_THEME` casse libadwaita (mixte) et si sans = propre (devbox-like).
- [ ] **T0.2** — file chooser : ouvrir un « Enregistrer sous » d'une app GTK3 **vs** GTK4, avec/sans
  `GTK_THEME`, portal vif. → quelle voie donne le chooser sombre.
- [x] **T0.3** — QtPass (Qt6) : `env QT_STYLE_OVERRIDE=kvantum qtpass` **vs** sans. → confirme le fix Qt.
- [x] **T0.4** — décider A ou B (ou hybride) **sur les captures**, pas sur l'intuition.
  → **Décision : Modèle B.** A/B 30/05 : `GTK_THEME=Arc-Dark` ne laisse pas pamac « mi-thème »,
  il **casse** libadwaita (perte cartes/pastilles). Test de contrôle (sans `GTK_THEME`,
  `color-scheme=default` → pamac clair) prouve que `settings.ini` ne thème pas libadwaita :
  seul `color-scheme` compte. **T0.2 (file chooser) non joué en A/B** : le fix portal est
  **commun aux deux modèles**, donc non discriminant — vérifié en application (portal hérite l'env).

## Phase 1 — Appliquer le gagnant (minimal)

- [x] **T1.1** — `dbus-update-activation-environment` dans `.xprofile` (+ relance portal une fois).
- [x] **T1.2** — Qt : `export QT_STYLE_OVERRIDE=kvantum` dans `~/.config/env/00-core.sh` (à côté de
  `QT_QPA_PLATFORMTHEME`) ; `~/.config/Kvantum/kvantum.kvconfig` → `theme=KvArcDark` (déjà posé).
- [x] **T1.3** — gsettings `color-scheme=prefer-dark` (déjà posé, vérifié).
- [ ] **T1.4 (si modèle A)** — `GTK_THEME=Arc-Dark` centralisé dans un seul fichier env ; purge des
  `settings.ini` GTK comme sources de thème.
- [x] **T1.4bis (si modèle B)** — **retirer** `GTK_THEME` de `.xprofile` ; créer
  `~/.config/gtk-4.0/settings.ini` (`gtk-theme-name=Arc-Dark` + `gtk-application-prefer-dark-theme=true`).

## Phase 2 — Vérifier (captures réelles)

- [x] **T2.1** — relancer une session/les apps ; capture pamac (doit être devbox-propre), file chooser
  (sombre), QtPass (sombre). Ajuster si un cas résiste.
  → **Validé post-reboot 30/05** (captures ~/screenshots 19:1x) : pamac propre, **file chooser sombre**
  (symptôme d'origine résolu), flameshot/Qt6 sombre. Bonus : bug « faux plein écran » bspwm disparu au
  relog ; régression autostart (sentinelle `dex` du plan précédent) corrigée par `rm -f` dans `.xprofile`.

## Critères d'acceptation

- Pamac **uniformément sombre** (comme devbox), plus de liste blanche.
- File chooser « Enregistrer sous » **sombre** quelle que soit l'app.
- QtPass (et apps Qt6) **sombres**.
- Le thème dark tient pour une **app nouvellement installée** sans config par-app (test : lancer une
  app GTK/Qt non encore ouverte → dark).

## Contraintes / notes

- **Install paquet** éventuelle (selon décision) = `sudo pacman` lancé **par titux** (pas de sudo agent).
- **xsettingsd hors périmètre** (c'est l'upgrade « changement de thème live », day8 PENDING) — séparé.
- Relances d'apps/portal : respecter la mémoire `polybar-x-session-restart` (shell hors-X, préfixe
  `DISPLAY=:0 XAUTHORITY=…`, ne pas toucher sxhkd/polybar à la main).
