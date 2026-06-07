# docs/solutions/ — journal problème → solution

Quand un problème de **build du site** t'a coûté du temps et que tu l'as résolu,
capture-le ici (à la main ou via `/compound`). But : ne jamais re-galérer deux
fois sur la même chose, et nourrir un futur `/compound` réutilisable pour les
autres projets du labo.

> Concerne le site (config Astro, Pagefind, GH Action, liens cassés au build).
> Le `solutions/` du **contenu de migration** est ailleurs : `src/content/docs/solutions/`.

## Solutions capturées

- [`starlight-gh-pages-bun.md`](starlight-gh-pages-bun.md) — recette « docs Starlight
  → GitHub Pages → bun » + 3 pièges silencieux (canari de liens inexistant par
  défaut, Pagefind en anglais, sidebar autogenerate v0.39). Capturé au proof-slice
  validé (commits `92d5ea3..0c85222`).
- [`pattern-structure-d-abord-promotion-ensuite.md`](pattern-structure-d-abord-promotion-ensuite.md)
  — pattern de **workflow** (écart assumé au périmètre build) : poser les contenants
  en geste atelier avant que le pipeline de promotion ne livre. Capturé à la pose de
  l'acte II (commits `e98a3ca..335bf65`) ; validation à l'usage pendante.

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
