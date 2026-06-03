---
title: "ADR 0016 — Compositeur picom (backend glx) sur GPU ancien"
---

- Statut : accepté
- Chapitre lié : 11
- Lié à : ADR 0007 (outils terminal sur HD 3000)

## Contexte

Au départ, le compositeur était **écarté a priori** : on supposait la HD 3000 (Sandy Bridge, 2011)
incapable de faire tourner un compositeur correctement, par cohérence avec la contrainte « pas
d'éditeurs GPU-accélérés » (ADR 0007). Cette contrainte a été **réexaminée** à l'essai (Phase 6) : la
limite réelle de la HD 3000 porte sur **Vulkan / compute shaders** (ce qu'exigent GPUI/wgpu/GTK4 —
Zed, Ghostty), **pas sur l'OpenGL classique**.

Par ailleurs, bspwm n'a pas de barre de titre et le rendu « nu » manque de transitions ; deux conforts
étaient souhaités : le **fondu inter-bureaux** et les **coins arrondis**.

## Décision

Adopter **picom en backend `glx`** (OpenGL 3.1, supporté par la HD 3000), **local à bspwm** :

- Lancé depuis `bspwmrc` (idempotent), config `~/.config/bspwm/picom/picom.conf`.
- i3 ne le lance pas (pas de `dex -a`) ; XFCE a déjà `xfwm4` → picom reste **spécifique bspwm**.
- Backend **`glx` obligatoire** pour les coins arrondis : `xrender` ne les rend pas (vérifié à l'essai).

Ce choix **renverse explicitement** la contrainte de départ « compositeur écarté » : la limite HD 3000
est précisée (Vulkan/compute, pas OpenGL GL 3.1).

## Conséquences

- Fondu inter-bureaux et coins arrondis disponibles sous bspwm, sans surcoût perceptible sur la HD 3000.
- Le compositeur est confiné à bspwm (cohérent avec « un autostart par WM ») ; les autres sessions ne
  sont pas affectées.
- La contrainte ADR 0007 est **affinée, pas contredite** : « pas de moteurs Vulkan/compute (Zed/Ghostty) »
  reste vrai ; l'OpenGL classique (picom glx, Brave avec `--disable-gpu-rasterization`) est admis.
- Le câblage local (corner-radius, neutralisation de tout autostart système concurrent) relève de la
  config vivante.

## Alternatives considérées

- **Pas de compositeur** (position de départ) : pas de fondu ni de coins arrondis ; surtout, fondée sur
  une supposition matérielle **fausse** (confusion Vulkan ↔ OpenGL) — écarté après essai.
- **Backend `xrender`** : plus léger mais **ne rend pas les coins arrondis** — écarté pour cet usage.
- **Compositeur global (tous WM)** : inutile (XFCE a xfwm4, i3 n'en veut pas ici) et contraire au modèle
  « autostart par WM » — écarté.

Détail (mesures, leviers) : `docs/guide/11-wm-bspwm-polybar.md` § Compositeur ;
`docs/findings/2026-05-30-bspwm-reload-et-verdicts-phase6.md`.
