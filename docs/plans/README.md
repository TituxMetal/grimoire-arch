# docs/plans/ — plans de travail

Un plan par tranche de travail, écrit par `/plan`, exécuté par `/work`.
Les cases à cocher du plan **sont** le tracker : `/work` les coche en avançant.

> Ces plans concernent **la construction du site** (scaffold Astro, GH Action,
> proof-slice). Ils n'ont rien à voir avec les `plans/` du contenu de migration,
> qui vivent sous `src/content/docs/plans/`. Voir le PIEGE CRITIQUE dans `../../AGENTS.md`.

## Cycle de vie

| status | sens |
|---|---|
| `approved` | validé, prêt à exécuter |
| `in_progress` | `/work` est dessus |
| `complete` | livré et vérifié (`bun run build` vert + deploy) |
| `superseded` | remplacé par un plan plus récent — garder pour la trace |
| `captured` | les apprentissages ont été versés dans `../solutions/` via `/compound` |

## Convention

- Nom : `AAAA-MM-JJ-titre-kebab.md`
- Un plan terminé reste en place (archive vivante) ; on ne le supprime pas.
- Frontmatter `status:` tenu à jour à la main ou par `/work`.
