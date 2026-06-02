# docs/adr/ — Architecture Decision Records (du **site**)

Une décision structurante sur **la construction du site** = un ADR.
Exemples : pourquoi Starlight, pourquoi GitHub Actions plutôt que Netlify,
stratégie de copie du contenu, config Pagefind FR, exclusion d'`archives/`.

> ⚠️ Ne pas confondre avec les ADR du **contenu de migration** (décisions sur
> l'install Arch elle-même), qui vivent sous `src/content/docs/adr/`. Deux corpus
> distincts qui portent le même nom — voir le PIEGE CRITIQUE dans `../../AGENTS.md`.

## Convention

- Nom : `AAAA-MM-JJ-titre-kebab.md` (ou `NNNN-titre.md` si tu préfères la numérotation).
- Un ADR est **immuable** une fois acté : on ne le réécrit pas, on en ouvre un
  nouveau qui le `supersedes`.

## Gabarit

```markdown
# ADR-NNNN : <titre de la décision>

- **Statut** : proposé | accepté | remplacé par ADR-XXXX
- **Date** : AAAA-MM-JJ

## Contexte
Le problème, les contraintes (bun-only, GH Pages, découplage du hub…).

## Décision
Ce qu'on fait, formulé à l'impératif.

## Conséquences
Ce que ça implique — les bonnes et les mauvaises.

## Alternatives rejetées
Ce qu'on a écarté, et pourquoi.
```
