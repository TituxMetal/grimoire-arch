---
title: "ADR 0001 — Login manager : Ly"
---

- Statut : accepté (contrainte de départ)
- Chapitre lié : 6
- Rationale : **faible** (choix de légèreté, assumé)

## Contexte

Il faut un greeter pour lancer la session X. Le choix a été posé d'emblée comme contrainte du projet,
sans étude comparative approfondie.

## Décision

Utiliser **Ly** (greeter ncurses minimal), **jamais LightDM**. Ly source `~/.xprofile` avant la session,
ce qui en fait le point d'entrée commun à tous les WM (chapitre 6).

## Conséquences

- Greeter léger, sans dépendances GTK lourdes.
- L'ajout d'une session (ex. bspwm) suppose un **redémarrage du service `ly`** pour rescanner
  `/usr/share/xsessions/` (chapitre 11).
- `~/.xprofile` devient le point d'entrée de session unique.

## Alternatives considérées

- **LightDM** : écarté par choix initial (plus lourd, dépendances greeter GTK). Pas de raison technique
  forte documentée — le choix relève de la préférence pour le minimalisme.
