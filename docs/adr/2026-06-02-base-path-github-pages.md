# ADR-0002 : `base: '/grimoire-arch'` — le sous-chemin GitHub Pages suit le nom du repo, pas le dossier local

- **Statut** : accepté
- **Date** : 2026-06-02

## Contexte

GitHub Pages sert un repo « projet » (non `<user>.github.io`) sous un **sous-chemin**
égal au **nom du repo** : `https://<user>.github.io/<repo>/`. Astro exige alors `base`
réglé sur ce sous-chemin, sinon CSS/JS/liens cassent.

Piège spécifique ici : la **convention locale** préfixe le dossier par la date de
création → `20260602-grimoire-arch/`. Mais le **repo GitHub** portera seulement
`grimoire-arch` (sans la date). Le briefing `ground` initial avait à tort recopié le
nom de dossier daté.

## Décision

Dans `astro.config.mjs` :

- `site: 'https://<user>.github.io'`
- **`base: '/grimoire-arch'`** — le **nom exact du repo GitHub**, pas le dossier daté.

Vérifier au moment du `git remote add` que `base` correspond caractère pour caractère
au nom du repo distant.

## Conséquences

- (+) Liens, assets et nav résolvent correctement sous le sous-chemin déployé.
- (+) Découple le nom de publication (propre, sans date) de la convention de rangement locale.
- (−) Une incohérence `base` ↔ nom de repo casse tout le rendu de façon non évidente (ne se voit que sur le vrai sous-chemin, pas en localhost root) → point de vérification explicite dans STORY-007.
- (Neutre) Si un jour le site passe sur `<user>.github.io` dédié ou un domaine custom, `base` sera retiré (nouvel ADR).

## Alternatives rejetées

- **`base` = `/20260602-grimoire-arch`** (nom du dossier local) — rejeté : ne correspond pas au repo GitHub, produirait un sous-chemin erroné et des liens cassés.
- **Omettre `base`** — rejeté : valide seulement pour un repo `<user>.github.io` ou un domaine custom, ce qui n'est pas le cas (différé, brainstorm Q6).
