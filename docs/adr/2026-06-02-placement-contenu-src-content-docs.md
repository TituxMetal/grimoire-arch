# ADR-0001 : Le contenu publié vit dans `src/content/docs/`, jamais dans le `docs/` doctrine

- **Statut** : accepté
- **Date** : 2026-06-02

## Contexte

Le dépôt a **deux arbres qui portent les mêmes noms de sous-dossiers** (`adr/`,
`plans/`, `solutions/`, `stories/`, `brainstorms/`, `findings/`) :

- le `docs/` **doctrine du repo**, posé par `harness-up` (comment on construit le site) ;
- le contenu de migration à publier, copié de `~/migration-backup/docs/`, qui a la
  **même arborescence** (Open Q8 du brainstorm).

Si on copiait le contenu dans le `docs/` du repo, il **écraserait la doctrine** (deux
`adr/` qui se télescopent, deux corpus distincts mélangés). Starlight, par ailleurs,
sert son contenu depuis une **collection** dédiée.

## Décision

Copier et héberger **tout le contenu publié sous `src/content/docs/`** (collection
Starlight). Le `docs/` du repo reste **exclusivement** la doctrine du projet
(plans, ADR du site, solutions, architecture, ground). Aucun fichier de migration
n'entre dans `docs/`.

Corollaire : les ADR de migration vivent sous `src/content/docs/adr/` ; les ADR du
**site** (dont celui-ci) vivent sous `docs/adr/`. Deux corpus, jamais fusionnés.

## Conséquences

- (+) Zéro collision entre doctrine et contenu ; le PIEGE CRITIQUE de l'AGENTS.md est neutralisé par construction.
- (+) Aligne sur le modèle natif de Starlight (collection `src/content/docs/`).
- (−) Deux dossiers `adr/` coexistent dans le repo → vigilance humaine requise (d'où cet ADR et les rappels AGENTS.md).
- (Neutre) Le contenu est copié une fois ; ensuite le repo est la source de vérité (brainstorm Q4).

## Alternatives rejetées

- **Copier dans le `docs/` du repo** — rejeté : écrase la doctrine `harness-up`, mélange deux corpus ADR distincts.
- **Garder le contenu dans un sous-module / dossier externe synchronisé** — rejeté : pièces mobiles, contraire au critère « simple/autonome » (brainstorm Q4).
