---
title: "ADR 0006 — Runtime JS : bun"
---

- Statut : accepté
- Chapitre lié : 9 / 12

## Contexte

Le poste a besoin d'un runtime/gestionnaire de paquets JavaScript pour le développement web. Par
ailleurs, Mason (gestionnaire d'outils de Neovim) installe certains outils via npm.

## Décision

**bun** est le runtime et gestionnaire de paquets explicite. **npm** (via nvm) n'est conservé **que**
comme béquille pour Mason (limitation upstream : Mason ne sait pas utiliser bun). On ne lance jamais
`npm` à la main.

## Conséquences

- Installations globales via bun (`bun add -g`), souvent avec `--ignore-scripts` (sécurité).
- npm reste présent mais cantonné à Mason ; les `nodejs`/`npm` **système** peuvent être retirés sans
  impact (chapitre 9).
- Les installeurs natifs (ex. Claude Code) sont préférés à toute voie npm (chapitre 12).

## Alternatives considérées

- **npm/nvm comme PM principal** : écarté (préférence perf/philosophie pour bun).
- **Retirer npm complètement** : impossible tant que Mason en dépend → garder la béquille minimale.
