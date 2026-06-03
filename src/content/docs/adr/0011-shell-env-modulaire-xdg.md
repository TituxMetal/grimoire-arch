---
title: "ADR 0011 — Shell/env : modulaire XDG"
---

- Statut : accepté
- Chapitre lié : 8

## Contexte

Un `.bashrc` monolithique mélange environnement, options interactives, alias et init de runtimes : peu
lisible, difficile à porter sélectivement entre machines.

## Décision

Découper en **fragments XDG ordonnés** : `~/.profile` source `~/.config/env/NN-*.sh` (environnement
POSIX, dash-safe), `~/.bashrc` source `~/.config/bash/NN-*.bash` (interactif bash). Convention de préfixe
numérique `NN-`. **Tout export PATH/env va dans un fragment `~/.config/env/`**, jamais dans `.bashrc` ;
chaque runtime (nvm, bun) a son module dédié.

## Conséquences

- Activer/désactiver un réglage = ajouter/retirer (ou `.disabled`) un fichier.
- `~/.profile` reste POSIX (lisible par dash/greeter) ; `~/.bashrc` peut être bash-only.
- Portabilité facilitée, mais attention : une autre machine peut être monolithique → prévoir les deux
  emplacements pour un réglage partagé (chapitre 8).

## Alternatives considérées

- **`.bashrc` monolithique** : simple au départ, ingérable à l'échelle, peu portable — écarté.
- **Outils de dotfiles tiers** : non nécessaires ici ; le split natif suffit.
