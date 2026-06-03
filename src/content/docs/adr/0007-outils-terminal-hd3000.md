---
title: "ADR 0007 — Édition : outils terminal sur GPU ancien"
---

- Statut : accepté (contrainte matérielle)
- Chapitre lié : 9 / annexe A

## Contexte

Le GPU de référence (Intel HD 3000, 2011) n'a ni compute shaders ni pilote Vulkan. Les éditeurs et
terminaux GPU-accélérés (moteurs GPUI/wgpu, GTK4 accéléré) échouent au lancement — limite **matérielle**,
pas de configuration.

## Décision

Sur ce matériel, l'édition et les outils principaux passent par le **terminal** (Neovim, etc.), qui
ignorent le GPU. Les outils GPU-accélérés sont réservés à une machine plus récente.

## Conséquences

- Neovim (chapitre 9) est l'éditeur principal ; les éditeurs GPU sont désinstallés du poste.
- Le navigateur Chromium/Brave nécessite `--disable-gpu-rasterization` (annexe A).
- Choix cohérent avec une philosophie minimaliste/terminal.
- **Compositeur picom : adopté** (mise à jour 30/05/2026). La contrainte GPU porte sur **Vulkan / compute
  shaders** (moteurs GPUI/wgpu/GTK4) ; elle **n'empêche pas** picom, dont le backend **`glx`** n'utilise
  que de l'**OpenGL classique** (GL 3.1, supporté par la HD 3000). picom tourne proprement — fondu
  inter-bureaux déjà en usage et **coins arrondis** (qui **exigent `glx`** : le backend `xrender` ne les
  rend pas — vérifié 30/05). Adopté comme compositeur **local à bspwm**
  (`~/.config/bspwm/picom/picom.conf`, lancé depuis `bspwmrc`). Revient sur l'exclusion *a priori* du
  brainstorm 26/05. Preuve : finding `2026-05-30` §5 (essai Phase 6). *(Câblage local propre encore à
  finaliser — voir guide 11, « Compositeur (picom) — retenu ».)*

## Alternatives considérées

- **Éditeurs GPU (Zed, etc.)** : impossibles matériellement ici (wgpu ne crée aucun device) — écartés.
- **Forcer le rendu logiciel** (`LIBGL_ALWAYS_SOFTWARE=1`) : testé, ne suffit pas à les faire démarrer.
- **Éditeur Electron** (VSCodium) : tourne mais lourd ; possible en dépannage souris-friendly, pas le défaut.
