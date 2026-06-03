---
title: "ADR 0014 — Thème dark global : Modèle B (jamais de `GTK_THEME` global)"
---

- Statut : accepté
- Chapitre lié : 11
- Lié à : ADR 0012 (theme switcher bspwm)

## Contexte

Objectif titux : du **dark correct partout** (Arc-Dark là où le toolkit le permet, sinon dark propre),
avec le **minimum de fichiers** et **future-proof** — une app nouvelle doit être au moins dark sans
config par-app. Trois symptômes constatés (captures 30/05) sur un système qui se voulait « tout Arc-Dark » :

1. File chooser GTK « Enregistrer sous » **clair** quelle que soit l'app.
2. **Pamac** (GTK4 + libadwaita) **mi-thème** : barre sombre, **liste blanche** (la devbox, elle, est
   uniformément sombre).
3. **QtPass** et apps **Qt6 blanches**.

Diagnostic puis **expérimentation A/B réversible** (override d'env au lancement, captures côte à côte —
exigée par titux, pas d'élimination sur intuition). Détail : finding + plan du 30/05.

Deux modèles candidats :

- **Modèle A — « tout-env »** : `GTK_THEME=Arc-Dark` global + `QT_STYLE_OVERRIDE=kvantum`, on vire les
  `settings.ini`. Avantage : 1 var couvre toutes les versions GTK.
- **Modèle B — `settings.ini` par famille** : PAS de `GTK_THEME` ; thème via `gtk-3.0`/`gtk-4.0/settings.ini`
  + libadwaita via `color-scheme`.

## Décision

**Modèle B.** L'A/B a prouvé que `GTK_THEME=Arc-Dark` global **fuit dans libadwaita et casse son rendu**
(pamac perd cartes/pastilles). Un test de contrôle (sans `GTK_THEME`, `color-scheme=default` → pamac
clair, alors que `settings.ini` reste Arc-Dark) a démontré que **libadwaita ignore `settings.ini` et ne
suit QUE `color-scheme`**. Modèle A est donc écarté.

Leviers retenus (tous dans `~/.config` / `~`, **pas** dans ce repo de trace) :

| Cible | Levier |
|---|---|
| libadwaita (pamac…) | gsettings `color-scheme='prefer-dark'` (seul qui marche) |
| GTK 3 | `~/.config/gtk-3.0/settings.ini` → `gtk-theme-name=Arc-Dark` |
| GTK 4 natif | `~/.config/gtk-4.0/settings.ini` (`gtk-theme-name=Arc-Dark` + `gtk-application-prefer-dark-theme=true`) |
| Qt 5 **et** Qt 6 | `QT_STYLE_OVERRIDE=kvantum` (Kvantum=`KvArcDark`), couvre Qt6 **sans qt6ct** |
| file chooser (portal) | `dbus-update-activation-environment` + relance `xdg-desktop-portal-gtk` dans `.xprofile` |
| — | `GTK_THEME=Arc-Dark` **retiré** de `~/.xprofile` (cause du mi-thème) |

## Conséquences

- **Cohérent avec l'ADR 0012** : le theme switcher pilote déjà GTK via la clé `gtk` du manifeste appliquée
  aux `settings.ini` (et non via `GTK_THEME`) — Modèle B est l'extension naturelle, sans contradiction.
- **Coût** : ~1 `settings.ini` par famille GTK (3.0, 4.0), posé une fois, à vie ; une famille future
  (GTK5) = 1 fichier de plus, une fois. Pas de config par-app.
- **Le portal (file chooser) dépend de l'env de session** : `dbus-update-activation-environment` **avant**
  la relance du portal, sinon il reste « nu » (lancé par systemd --user à froid).
- **La devbox valide a posteriori** : déjà propre car elle ne force pas `GTK_THEME` → rien à corriger,
  juste reporter `gtk-4.0/settings.ini`, `QT_STYLE_OVERRIDE=kvantum` et le couple portal au besoin.
- **Hors périmètre** : changement de thème **live** sans relog (xsettingsd) reste un PENDING séparé (day8).

## Alternatives considérées

- **Modèle A (`GTK_THEME` global)** : 1 var pour toutes les versions GTK, mais **casse libadwaita**
  (prouvé en A/B) — écarté.
- **Installer `qt6ct`** : ajouterait un outil de config Qt6, mais `QT_STYLE_OVERRIDE=kvantum` couvre déjà
  Qt5+Qt6 avec moins de fichiers — écarté.
- **Thème par-app** (forcer chaque app) : contraire au « minimum de fichiers / future-proof » — écarté.
- **xsettingsd** (GTK live) : apporterait le rechargement à chaud ; complexité pour gain faible (apps
  relancées naturellement) — non implémenté (cohérent avec ADR 0012).
