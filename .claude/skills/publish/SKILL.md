---
name: publish
description: Promote a finished note from anywhere in the home (calepin ~/sandbox, terrain repos like ~/.config/nvim, future ~/migration-devbox) into the grimoire book under src/content/docs/ — one-way, artifact by artifact, once each, never a sync. Use when Titux wants to publish or promote a note into the grimoire. Triggers: publish, publier, promote, promotion, promouvoir.
---

# /publish — promotion d'un artefact vers le livre

Spec d'origine : `~/sandbox/grimoire/2026-06-07-spec-skill-publish.md` (validée le
2026-06-07), qui prolonge la capture
`~/sandbox/grimoire/2026-06-06-architecture-documentaire-atelier-livre-terrain.md`
(les quatre lieux : terrain / calepin / livre / atelier).

## Cadre — à ne jamais violer

- **À sens unique, artefact par artefact, une fois chacun.** Pas une sync, pas un script.
- **Après publication, le repo grimoire fait foi** (frontière ADR
  `docs/adr/2026-06-02-placement-contenu-src-content-docs.md`). On ne retouche plus
  jamais la note source — si l'histoire continue, c'est dans le livre, ou dans une
  *nouvelle* note datée.
- La skill tourne **dans ce repo** (le grimoire). La source, elle, est n'importe où
  dans le home.
- **Pas de déploiement** : commit, jamais de push. Titux décide quand le site bouge.

## Pipeline en six temps

### 1. Entrée

`$ARGUMENTS` = chemin de la note source (`~/sandbox/...`, `~/.config/nvim/docs/...`,
futur `~/migration-devbox/...`). Si absent, demander.

Garde-fous, dans l'ordre, avant toute autre chose :

1. Lire la source **en entier**.
2. **Anti-republication** : si la source porte déjà une bannière (`Promu vers le livre`
   ou `Consommé par`), ou si son chemin figure dans `docs/promotions.md` → **STOP**.
   La version du livre fait foi ; proposer d'éditer le livre à la place.

### 2. Routage — la skill propose, Titux confirme

Règles de placement actées (capture du 06-06) :

| Nature de la source | Destination |
|---|---|
| Spécifique machine | l'acte concerné (acte I = MBP, acte II = devbox) |
| Agnostique machine (nvim, dotfiles, workflow IA, scripts) | tronc commun |
| Artefact brut (note, finding, plan, incident) | Coulisses : `src/content/docs/{brainstorms,findings,plans,solutions,stories}/` — sous-dossier `devbox/` si pertinent (l'`autogenerate` l'absorbe seul, précédent `solutions/bspwm/`) |
| Décision | `src/content/docs/adr/` — numérotation en continuité, **0018+** |

Deux modes :

| Mode | Geste | Trace dans la source |
|---|---|---|
| **Coulisses** | quasi tel quel : frontmatter + liens, l'artefact historique est exposé | « Promu » au sens strict |
| **Récit** | la note est la matière première d'un chapitre rédigé ; plusieurs sources peuvent nourrir un seul chapitre | « Consommé par » le chapitre |

**Toujours** confirmer destination + mode via AskUserQuestion avant d'écrire quoi
que ce soit dans le repo.

Les destinations hero `devbox/` et `tronc-commun/` existent — structure posée en
atelier (ADR-0007, `docs/adr/2026-06-07-structure-acte-2-sidebar.md`). Si une
destination future exige une structure qui n'existe pas encore : le **signaler et
s'arrêter** — c'est un préalable atelier (brainstorm court + ADR dans `docs/adr/`),
pas à `/publish` d'inventer la structure du livre.

### 3. Adaptation

- **Frontmatter Starlight** : `title:` obligatoire. Les clés riches (`type`,
  `related`, `participants`, `status`, …) sont tolérées par le schéma — **ne pas les
  stripper** (piège 4A, `docs/solutions/starlight-gh-pages-bun.md`). **Jamais de
  `slug:`** (piège 4B — collision d'URL) : le slug dérivé du chemin est déjà unique.
- **Liens internes** réécrits vers le livre : root-relative **avec base** —
  `/grimoire-arch/...` (canari `starlight-links-validator`,
  `docs/adr/2026-06-03-link-validation-canary.md`). Un lien vers un fichier **non
  publié** → le neutraliser en texte simple et le signaler à Titux.
- **Sidebar** : Coulisses et `adr/` sont en `autogenerate` — rien à faire ici. Une
  destination hero (`devbox/`, `tronc-commun/`) exige une entrée explicite dans
  `astro.config.mjs` → c'est l'étape 4 (slug sidebar).
- **Mode Récit** : rédiger le chapitre à partir de la source (et des autres sources
  qu'il consomme, le cas échéant), dans la langue et le ton du guide existant.

### 4. Slug sidebar — destinations hero uniquement

Ne concerne que les fichiers écrits sous `devbox/` ou `tronc-commun/` (groupes à
items explicites, ADR-0007). Coulisses et `adr/` : étape sautée — l'`autogenerate`
fait le travail.

1. **Calculer le slug** : chemin relatif à `src/content/docs/`, sans extension
   (ex. `devbox/02-reseau` pour `src/content/docs/devbox/02-reseau.md`).
2. **Lire le groupe cible** dans `astro.config.mjs` et présenter ses items dans
   l'ordre actuel.
3. **Proposer la position** via AskUserQuestion — défaut : **fin de groupe**. Les
   chapitres arrivent dans le désordre ; l'ordre narratif est arbitré par Titux,
   jamais déduit.
4. **Ajouter** `{ slug: '<slug>' }` à la position confirmée.

Filet : un slug mal formé fait échouer le `bun run build` de l'étape 6.

### 5. Trace anti-republication

Les deux gestes, systématiquement (coût marginal) :

1. **Bannière dans la source** — écriture HORS repo, permissions prévues dans
   `.claude/settings.json` — juste sous le titre :
   - mode Coulisses : `> Promu vers le livre le AAAA-MM-JJ → src/content/docs/<chemin>`
   - mode Récit : `> Consommé par le chapitre <X> le AAAA-MM-JJ → src/content/docs/<chemin>`

   Date réelle du jour (`date +%F`), pas une date inventée.
2. **Registre** : ajouter une ligne à la table de `docs/promotions.md`
   (source → destination → date → mode).

Si un README index existe dans le dossier de la source et y liste la note → passer
sa ligne au statut **promu** (cycle de vie du calepin : vivant / clos / promu).

### 6. Commit

1. `bun run build` — DOIT être vert (le canari liens est le critère d'acceptation).
2. `grep -rn '^slug:' src/content/docs` — doit rester vide.
3. Commit dans le grimoire, **message en anglais** (convention repo), ex. :
   `feat(content): promote boot-var-plein incident to stories/devbox (coulisses mode)`.
4. **Jamais de push.** Annoncer que le commit est posé et que le déploiement reste
   sous la main de Titux.
