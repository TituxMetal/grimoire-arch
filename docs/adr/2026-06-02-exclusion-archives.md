# ADR-0005 : `archives/` exclu par construction (scope de copie = sous-arbre `docs/`)

- **Statut** : accepté
- **Date** : 2026-06-02

## Contexte

Le brainstorm et l'AGENTS.md insistent : `archives/` (premiers journaux bruts, faits
par un agent web sans accès machine) est **potentiellement personnel/fuyant** et ne doit
**jamais** être publié ni lié.

Le survey de la source (2026-06-02) précise un point clé : **`archives/` n'est pas dans
`~/migration-backup/docs/`** — il est **sibling de `docs/`** (au niveau
`~/migration-backup/`). Le risque réel de copie accidentelle est donc faible, à condition
que la copie cible **uniquement le sous-arbre `docs/`**.

## Décision

La copie du contenu cible **exclusivement le sous-arbre `~/migration-backup/docs/`**
(guide + substrat), excluant de fait `archives/` qui est en dehors. **Garde-fou
obligatoire** après chaque copie :

```
find src/content/docs -path '*archives*'   # doit ne RIEN renvoyer
```

Aucun lien explicite vers `archives/` n'est introduit, où qu'il soit.

## Conséquences

- (+) Exclusion garantie sans filtre complexe : on ne copie simplement pas ce qui est hors `docs/`.
- (+) Garde-fou cheap et automatisable (vérif `find`) intégrable au build/CI.
- (−) Repose sur la discipline du scope de copie : un `cp` trop large (depuis `~/migration-backup/` au lieu de `.../docs/`) ramènerait `archives/`. D'où le garde-fou explicite.
- (Neutre) Si `archives/` devait un jour apparaître dans `docs/`, le garde-fou le détecterait avant publication.

## Alternatives rejetées

- **Filtre d'exclusion explicite dans la config Astro** — non nécessaire : `archives/` n'arrive pas dans `src/content/docs/` si le scope de copie est correct ; un filtre ajouterait de la config pour un risque déjà neutralisé.
- **Copier tout `~/migration-backup/` puis nettoyer** — rejeté : expose transitoirement le contenu sensible et inverse la charge (supprimer au lieu de ne pas copier).
