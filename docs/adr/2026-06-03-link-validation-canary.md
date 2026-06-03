# ADR-0006 : Le canari « lien cassé » est `starlight-links-validator`, pas le build Astro nu

- **Statut** : accepté
- **Date** : 2026-06-03

## Contexte

Le brainstorm, l'AGENTS.md et le ground briefing posaient tous le même invariant :
**« `bun run build` échoue sur un lien interne cassé — c'est le canari »**, le canari
de référence étant la couture `guide/annexe-b → ../adr/` (17 liens).

Vérifié empiriquement au moment d'implémenter le proof-slice (`/work`, phase 1) :
**cet invariant est faux** pour la stack réelle (Astro 6.4 + `@astrojs/starlight`
0.39 sur collection `docsLoader`).

1. Astro **ne réécrit pas** les liens Markdown relatifs `../adr/00NN-slug.md` : ils
   fuient tels quels dans le HTML (`href="../adr/0001-...md"`).
2. Le build **reste vert** alors que les 17 liens sont cassés sur deux axes :
   - **profondeur** : depuis `/grimoire-arch/guide/annexe-b-adr/`, un seul `..`
     pointe vers `/grimoire-arch/guide/adr/...` (il en faut deux) ;
   - **extension** : `.md` au lieu de l'URL-dossier servie (`/adr/<slug>/`).

Sans garde-fou, le canari du proof-slice est un **canari fantôme** : la seule
couture inter-dossiers du contenu n'est protégée par rien, et la propagation
STORY-008 (tout `docs/`) ne pourra pas s'appuyer sur le build pour détecter les
régressions de liens.

## Décision

Ajouter le plugin Starlight **`starlight-links-validator`** (devDependency, installé
via bun) dans `astro.config.mjs` :

```js
plugins: [starlightLinksValidator()],
```

`bun run build` échoue désormais réellement sur un lien interne cassé — le canari
devient réel.

**Forme de lien retenue : root-relative AVEC base** — `/grimoire-arch/adr/<slug>/`.
Justification (toutes les autres formes ont été testées empiriquement) :

| Forme | Validée par le plugin ? | Correcte dans le navigateur (sous-chemin) ? |
|---|---|---|
| `../adr/<slug>.md` (source d'origine) | non (non réécrite, fuit) | **non** (mauvaise profondeur + `.md`) |
| `../../adr/<slug>/` (relative corrigée) | **non** — le plugin **ignore** les liens relatifs (même avec `errorOnRelativeLinks: false` il ne les valide pas, il les saute) | oui |
| `/adr/<slug>/` (root-relative sans base) | — | **non** — Starlight ne préfixe pas `base` aux liens Markdown |
| **`/grimoire-arch/adr/<slug>/`** (root-relative avec base) | **oui** | **oui** |

Seule la dernière forme est à la fois **validée** et **correcte en prod**. Bonus :
si `base` change un jour, les pages bougent et le plugin **détecte** les 17 liens
devenus invalides — le canari couvre aussi la régression de base.

## Conséquences

- (+) Le build est un vrai garde-fou : un lien cassé fait échouer `bun run build`
  en local **et** en CI. Le proof-slice tient sa promesse.
- (+) Protège la propagation STORY-008 sans inspection HTML manuelle.
- (−) Les liens internes du contenu **codent en dur** `/grimoire-arch/` (le `base`).
  Atténué : `base` = nom de repo stable, et toute dérive est rattrapée par le canari.
- (−) Une devDependency de plus. Acceptable : maintenue, ciblée, bun-only.
- Contredit la consigne littérale du plan (« garder les liens en `.md` relatif,
  laisser Astro résoudre ») — déviation actée ici, validée par l'utilisateur.

## Alternatives écartées

- **Build Astro nu** (le plan d'origine) : ne détecte rien. Rejeté — c'est le bug.
- **Liens relatifs `../../adr/<slug>/` + `errorOnRelativeLinks: false`** :
  base-agnostique mais **non validé** (le plugin saute les liens relatifs, prouvé
  par un lien `9999` cassé non détecté). Perd le canari sur les 17 liens. Rejeté.
- **Script grep custom dans la CI** : plus de plomberie, moins robuste qu'un plugin
  maintenu qui comprend le graphe de routes Starlight. Rejeté.
