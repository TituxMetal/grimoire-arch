---
title: "Trouvailles 30/05 — diagnostic thème dark (GTK 2/3/4, libadwaita, Qt 5/6, portal)"
type: findings
date: 2026-05-30
related:
  - docs/plans/2026-05-30-feat-theme-dark-global-plan.md
status: >-
  Diagnostic confirmé en lecture système (read-only). Alimente le plan "dark global". Décision
  A vs B PAS encore prise (Phase 0 = expérimentation A/B à faire). Rien d'implémenté.
---


> Convention : `[constat]` = vérifié sur la machine ce jour. Tout est read-only.

## Faits système confirmés

- **Aucun daemon XSETTINGS** : `xsettingsd` non installé ; `xfsettingsd.desktop` =
  `OnlyShowIn=XFCE` (pas lancé sous bspwm/i3). [constat]
- **Le portal n'hérite PAS de l'env de session** : `xdg-desktop-portal-gtk` (PID 1040) et
  `xdg-desktop-portal` (926) ont un env **nu** — `HOME`, `DISPLAY=:0`, `DBUS_SESSION_BUS_ADDRESS`
  présents, mais **PAS `GTK_THEME`, PAS `XDG_CURRENT_DESKTOP`**. Marqueurs `INVOCATION_ID`/
  `MANAGERPID`/`SYSTEMD_EXEC_PID` → **activé par systemd --user** (d'où l'env nu). La session bspwm
  (PID 614), elle, a `GTK_THEME=Arc-Dark` + `XDG_CURRENT_DESKTOP=bspwm`. **Rien dans
  `.xprofile`/`bspwmrc` ne fait `dbus-update-activation-environment`.** [constat]
- **GTK config = Arc-Dark partout** : `~/.gtkrc-2.0` et `~/.config/gtk-3.0/settings.ini` →
  `Arc-Dark` ; **`~/.config/gtk-4.0/settings.ini` ABSENT**. gsettings
  `org.gnome.desktop.interface gtk-theme='Arc-Dark'`, `color-scheme='prefer-dark'`. [constat]
- **Arc-Dark fournit bien du gtk-4.0** (`/usr/share/themes/Arc-Dark/gtk-4.0/{gtk.css,gtk-dark.css}`).
- **`xdg-desktop-portal-gtk` = GTK3** (`ldd` → `libgtk-3.so.0`). Son file chooser est donc GTK3 →
  *devrait* lire `gtk-3.0/settings.ini` (HOME présent) — mais le chooser sort clair (cf. captures) :
  point à élucider en Phase 0 (peut-être que le dialogue clair observé venait d'une app GTK4/libadwaita,
  pas du portal GTK3). [constat + à confirmer]
- **Pamac = GTK4 + libadwaita** (`ldd /usr/bin/pamac-manager` → `libgtk-4` + `libadwaita-1`).
  libadwaita **ignore** tout thème custom (Arc) ; ne suit que `color-scheme`. [constat]
- **QtPass = Qt6** (`ldd` → `libQt6Core`). **`qt6ct` ABSENT** ; les platformthemes Qt6
  (`/usr/lib/qt6/plugins/platformthemes/`) = `libqgtk3`, `libqxdgdesktopportal` — **pas de qt5ct** →
  `QT_QPA_PLATFORMTHEME=qt5ct` ne charge aucun thème pour Qt6 → QtPass blanc. [constat]
- **Qt thème** : `~/.config/qt5ct/qt5ct.conf` = `style=kvantum-dark`, `standard_dialogs=xdgdesktopportal`.
  Kvantum installé, thème **`KvArcDark` dispo** (`/usr/share/Kvantum/KvArcDark`). Plugin Kvantum présent
  pour Qt6 (`/usr/lib/qt6/plugins/styles/libkvantum.so`) → `QT_STYLE_OVERRIDE=kvantum` couvre Qt5+Qt6
  **sans qt6ct**. [constat]
- **`~/.config/env/` EST chargé dans la session X** : `QT_QPA_PLATFORMTHEME=qt5ct` (défini dans
  `~/.config/env/00-core.sh`) apparaît dans l'env de bspwm (614). Donc y poser des vars de thème les
  propage aux apps. `GTK_THEME=Arc-Dark` n'est lui que dans `~/.xprofile:4`. [constat]

## Hypothèse centrale (à PROUVER en Phase 0)

Le **pamac « mi-thème » du MBP** (barre/sidebar sombres + **liste blanche**) = **`GTK_THEME=Arc-Dark`
qui fuit dans libadwaita** (le chrome attrape Arc-Dark, le contenu libadwaita résiste → mixte). La
**devbox est propre** (pamac uniformément sombre) probablement parce qu'elle **ne force pas
`GTK_THEME`**. Le rendu *mixte* (et non tout-clair) est la signature d'un **conflit de thème**, pas
d'un simple `color-scheme` absent. → si confirmé : **retirer `GTK_THEME` global**, GTK3 reste sombre
via `settings.ini`, libadwaita redevient Adwaita-dark propre via `color-scheme`.

## Captures de référence (~/screenshots, 30/05)

- `2026-05-30_09-34.png` — file chooser GTK **clair** par-dessus nvim.
- `2026-05-30_11-35.png` (= `09-34_1`) — **pamac MBP mi-thème** (liste blanche).
- `2026-05-30_11-09.png` — **QtPass blanc** (Qt6).
- `~/migration-backup/devbox-PAMAC-dark.png` — **cible** : pamac devbox, sombre uniforme propre.

## Décision en attente

A (« tout env » `GTK_THEME`+`QT_STYLE_OVERRIDE`, virer les fichiers) **vs** B (pas de `GTK_THEME`,
`settings.ini` par famille + `color-scheme`). **Communs** : `dbus-update-activation-environment` (portal),
`QT_STYLE_OVERRIDE=kvantum`+`KvArcDark`, `color-scheme=prefer-dark`. Trancher par **captures A/B**
(override d'env au lancement, non destructif). Voir le plan, Phase 0.

## Related
- Plan : `docs/plans/2026-05-30-feat-theme-dark-global-plan.md`
- Mémoires : `[[titux-theme-dark-minimal-central]]`, `[[pamac-theme-casse]]`,
  jour 7 Leçon 16, day8 PENDING (« GTK live sans xsettingsd »).
