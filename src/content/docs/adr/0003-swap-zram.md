---
title: "ADR 0003 — Swap : zram"
---

- Statut : accepté (contrainte de départ)
- Chapitre lié : 1 / 4
- Rationale : **faible** (performance implicite, assumé)

## Contexte

La machine a besoin d'un mécanisme de swap. Le stockage est un SSD d'entrée de gamme ; on veut ménager
les écritures et garder de la réactivité sous pression mémoire.

## Décision

Utiliser **zram** (swap compressé en RAM) uniquement, **pas de swap disque**.

## Conséquences

- Pas d'écritures de swap sur le SSD (durée de vie ménagée).
- Pas d'hibernation possible (pas de swap disque pour le `resume`).
- Réactivité correcte sous pression mémoire grâce à la compression.

## Alternatives considérées

- **Swap sur disque/partition** : écarté (usure SSD, et pas de besoin d'hibernation sur cette machine).
- Le choix relève surtout d'une préférence perf/longévité ; aucune mesure comparative formelle documentée.
