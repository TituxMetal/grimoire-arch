# Pattern : structure d'abord, promotion ensuite

> « Le relieur pose les rayonnages avant que les livres arrivent. »
>
> Capture de **workflow**, pas un problème de build — écart assumé au périmètre de ce
> dossier (acté à la capture, 2026-06-07). Statut : **validation à l'usage pendante**
> — à confirmer quand une première promotion hero aura traversé l'étape « slug
> sidebar » de `/publish`.

## Problème

Un pipeline incrémental (`/publish`) doit livrer des chapitres un à un dans des
contenants qui n'existent pas encore (groupes sidebar « Acte II — Devbox » et
« Tronc commun »). Deux tentations symétriques, toutes deux coûteuses :

- **Lazy** : faire créer la structure par le pipeline à la première livraison → le
  pipeline porte groupe + index + slug d'un coup, et embarque des hypothèses non
  vérifiées (« Starlight accepte-t-il un groupe à items explicites vide ? »).
- **Placeholder** : poser des pages « coming soon » → du contenu promis non tenu, le
  contraire d'un livre relié.

## Cause

Confondre deux gestes de natures différentes : **poser la structure** (un acte
d'atelier, délibéré, rare) et **livrer du contenu** (un acte de pipeline, répétable).
Quand le second porte le premier, le pipeline devient complexe et fragile exactement
là où il doit être bête et fiable.

## Solution

Séparer les gestes, structure d'abord, en un passage atelier unique :

1. **Acter** la structure (ADR — ici ADR-0007, `docs/adr/2026-06-07-structure-acte-2-sidebar.md`).
2. **Poser** les contenants + leurs pages d'accueil — index courts, *situants* (« ce
   que cet acte contient, ce qu'il référence »), jamais des promesses de contenu.
3. **Outiller** le pipeline au même passage (étape « slug sidebar » dans `/publish`),
   pour que la première livraison n'ait plus qu'à livrer.
4. Un canari par phase (`bun run build` vert, commit par phase).

Les hypothèses du genre « groupe vide » ne sont jamais posées — évitées par
construction, pas résolues.

## Pour la prochaine fois

Le signal : une livraison future « exige une structure qui n'existe pas encore »
(c'est mot pour mot la garde de l'étape Routage de `/publish`). Réflexe : ne pas
faire porter la création de structure au pipeline — brainstorm court + ADR + pose de
structure en geste atelier, *puis* les livraisons coulent.

## Validation

- ✅ **Pose** : session du 2026-06-07 (commits `e98a3ca..335bf65`) — build vert à
  chaque phase, zéro friction, déployé.
- ⬜ **Usage** : première promotion hero via `/publish` (récit nvim pressenti pour le
  tronc commun) — à cocher ici quand elle aura eu lieu. Si elle révèle un défaut du
  pattern, le noter ici aussi.
