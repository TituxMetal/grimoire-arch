# ADR-0004 : Thème Starlight par défaut + petit `customCss`, sans Tailwind

- **Statut** : accepté
- **Date** : 2026-06-02

## Contexte

Starlight livre un **thème complet par défaut** (responsive, toggle clair/sombre,
défauts accessibles avec option `contrastLevel`, coloration syntaxique). Rien à
dessiner from scratch (briefing `ground`, 2026-06-02). La personnalisation se fait en
surchargeant les design tokens `--sl-color-*` via un fichier branché par `customCss`.

L'ajout de Tailwind (v4, via `@tailwindcss/vite` + `@astrojs/starlight-tailwind` —
l'ancienne intégration `@astrojs/tailwind` étant dépréciée) est possible mais ajoute de
la surface de build et des dépendances. Le site est un guide linéaire (chapitres +
sidebar), pas un produit avec des pages marketing sur mesure.

## Décision

Utiliser le **thème Starlight par défaut**, personnalisé par un **petit
`src/styles/custom.css`** (couleur d'accent + quelques tokens, éventuellement
`contrastLevel`), branché via `customCss` dans la config Starlight. **Pas de Tailwind.**

## Conséquences

- (+) Empreinte de dépendances minimale (NFR-006), aligné bun-only/simple.
- (+) Look soigné immédiat, accessible, sans travail de design.
- (−) Personnalisations très poussées (layouts bespoke) demanderaient plus d'efforts en CSS pur — acceptable vu le périmètre.
- (Neutre) Réversible : on pourra brancher Tailwind v4 plus tard (le `customCss` global passe alors en premier) si des pages sur mesure apparaissent.

## Alternatives rejetées

- **Tailwind v4** (`@tailwindcss/vite` + `@astrojs/starlight-tailwind`) — rejeté ici : surdimensionné pour un site docs linéaire ; n'apporte un gain que pour des pages/layout sur mesure hors flux de contenu.
- **`@astrojs/tailwind`** — rejeté : intégration **dépréciée** (ne pas utiliser pour v4).
- **Thème communautaire clé en main** — non retenu maintenant : le défaut suffit ; un thème pourra être ajouté plus tard (c'est juste un plugin Starlight).
