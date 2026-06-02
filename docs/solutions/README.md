# docs/solutions/ — journal problème → solution

Quand un problème de **build du site** t'a coûté du temps et que tu l'as résolu,
capture-le ici (à la main ou via `/compound`). But : ne jamais re-galérer deux
fois sur la même chose, et nourrir un futur `/compound` réutilisable pour les
autres projets du labo.

> Concerne le site (config Astro, Pagefind, GH Action, liens cassés au build).
> Le `solutions/` du **contenu de migration** est ailleurs : `src/content/docs/solutions/`.

## Candidat `/compound` déjà identifié

La recette « publier un dossier `docs/` toolkit (guide + substrat) en Starlight /
GitHub Pages avec toolchain bun, sans exposer `archives/` » est réutilisable —
à capturer une fois le proof-slice validé (cf. brainstorm, section *Candidat `/compound`*).

## Convention

- Nom : `titre-kebab.md` (cherchable par mots-clés).
- Gabarit court :

```markdown
# <symptôme en une ligne>

## Problème
Ce qu'on observait (message d'erreur exact, contexte).

## Cause
Pourquoi ça arrivait.

## Solution
Le correctif, reproductible.

## Pour la prochaine fois
Le signal à reconnaître / la prévention.
```
