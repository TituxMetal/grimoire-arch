# grimoire-arch — AGENTS.md

## Mission

Publier le guide de migration Arch Linux (ext4→BTRFS + station tiling) sous forme de site statique navigable sur GitHub Pages, auto-déployé au push via GitHub Actions. Le guide existe d'abord comme référence personnelle consultable depuis n'importe quel appareil pendant la migration de la machine de dev principale. C'est un projet autonome — pas un module, pas un portail.

Stack : Astro Starlight, bun end-to-end, GitHub Actions (`oven-sh/setup-bun`).

---

## PIEGE CRITIQUE — deux arbres `docs/`, deux mondes distincts

Ce repo contient **deux arbres qui partagent les mêmes noms de sous-dossiers** (`adr/`, `plans/`, `solutions/`). Ne jamais les confondre.

| Arbre | Chemin | Contenu |
|---|---|---|
| **Doctrine du projet** | `docs/` | Décisions sur *comment on construit le site* — plans, ADRs Starlight/GH Pages, solutions de build |
| **Contenu publié** | `src/content/docs/` | Le guide de migration copié de `~/migration-backup/docs/` — 13 chapitres + substrat |

Règles absolues :
- Le contenu de migration ne va **jamais** dans `docs/` — uniquement dans `src/content/docs/`.
- Les ADRs de `docs/adr/` concernent le site (ex. choix Starlight). Les ADRs de `src/content/docs/adr/` concernent la migration Arch. Ce sont deux corpus différents.
- `archives/` de la source n'est **jamais** copié, jamais publié, jamais lié — exclu par construction (filtre explicite dans la config Astro ou exclusion au moment du `cp`).

---

## Read First

Avant toute modification non triviale, lire dans cet ordre :

1. `../_INCUBATOR/2026-06-02-wiki-migration-arch-starlight-brainstorm.md` — le QUOI/POURQUOI verrouillé, la hiérarchie des buts, et le périmètre du proof-slice. Note : ce fichier sera déplacé vers `../_INCUBATOR/grimoire-arch/` (slug du projet, cf. invariant de l'incubateur) une fois la graine germée — chercher là si absent à la racine de l'incubateur.
2. `docs/agents-md-standard.md` — les 12 checks PASS/FAIL qui gouvernent ce fichier et les artefacts de doctrine.
3. `docs/adr/` — les décisions architecturales *du projet* (Astro config, GH Pages deploy strategy, content copy strategy).

---

## Task Routing

- **Modifier la configuration Astro, le thème, ou le sidebar** → lire `docs/adr/` d'abord (des décisions de structure sont probablement actées). Modifier `astro.config.mjs` à la racine.
- **Ajouter ou éditer du contenu guide** → travailler exclusivement sous `src/content/docs/guide/` ou `src/content/docs/` selon la cible. Ne jamais toucher `docs/` pour ça.
- **Ajouter ou éditer le substrat (brainstorms, findings, plans, solutions, stories, adr de migration)** → travailler sous `src/content/docs/{brainstorms,findings,plans,solutions,stories,adr}/`. Le substrat est la section "Coulisses / journal" dans le sidebar — il ne doit pas noyer le guide hero.
- **Décision sur le build ou le deploy** → ouvrir un ADR dans `docs/adr/`. Format : `AAAA-MM-JJ-titre.md`.
- **Problème de build diagnostiqué et résolu** → logger dans `docs/solutions/` (format problem→fix). Voir le README de `docs/solutions/`.
- **Planification d'une tranche de travail** → écrire un plan dans `docs/plans/`. Le skill `/plan` écrit ici.
- **Le lien `guide/annexe-b → ../adr/`** (17 occurrences) est la seule couture inter-dossiers du contenu. C'est aussi la seule cible du proof-slice. Si ce lien est cassé, le build `bun run build` doit le détecter — c'est le canari.

---

## Repo Map

```
20260602-grimoire-arch/
├── astro.config.mjs          # config Starlight (sidebar, i18n, search)
├── public/                   # assets statiques
├── src/
│   └── content/
│       └── docs/             # CONTENU PUBLIÉ — guide + substrat migration
│           ├── guide/        # hero : 13 chapitres + annexes (ordre linéaire)
│           ├── adr/          # ADRs migration Arch (≠ docs/adr/)
│           ├── brainstorms/
│           ├── findings/
│           ├── plans/
│           ├── solutions/
│           └── stories/
├── .github/
│   └── workflows/
│       └── deploy.yml        # bun install + bun run build + GH Pages deploy
├── docs/                     # DOCTRINE DU PROJET (pas du contenu publié)
│   ├── agents-md-standard.md
│   ├── adr/                  # ADRs sur le site lui-même
│   ├── plans/                # plans de travail
│   └── solutions/            # problem→fix log
└── .claude/
    └── settings.json         # allowlist bun, plugins projet-scoped
```

`astro.config.mjs`, `public/`, `src/`, et `.github/` n'existent pas encore — ils arrivent avec `bun create astro` (template starlight) à l'étape `marvin:scaffold`, **avant** `/plan` (le plan vise alors des fichiers réels).

---

## Toolkit Output Paths

Les skills `/architect` et `/plan` tournent **dans ce projet** (pas à la racine du labo). Ils lisent le brainstorm originel via `$BRAINSTORM_PATH` :

```
$BRAINSTORM_PATH = ../_INCUBATOR/2026-06-02-wiki-migration-arch-starlight-brainstorm.md
```

(Ce chemin est valide tant que la graine n'a pas germé. Après germination il sera dans `../_INCUBATOR/grimoire-arch/2026-06-02-wiki-migration-arch-starlight-brainstorm.md`.)

| clé | valeur |
|---|---|
| `brainstorms_path` | `docs/brainstorms/` |
| `architecture_path` | `docs/architecture/` |
| `stories_path` | `docs/stories/` |
| `plans_path` | `docs/plans/` |
| `adr_path` | `docs/adr/` |
| `solutions_path` | `docs/solutions/` |

---

## Trust / Boundaries

- **bun uniquement.** Aucune commande `npm`, `pnpm`, ou `yarn`. Le GH Action utilise `oven-sh/setup-bun`.
- **Pas de Python, pas de Vue, pas de Next.** Stack : Astro Starlight + TypeScript/MDX + bun.
- **`archives/`** du dépôt source ne doit jamais apparaître sous `src/content/docs/`. Le vérifier après tout `cp -r` depuis `~/migration-backup/docs/`.
- **Le contenu publié est copié une fois** depuis `~/migration-backup/docs/`, puis édité directement dans ce repo. Pas de script de sync, pas de submodule. Ce repo devient la source de vérité unique.
- **`lgdweb.fr` est hors périmètre** — au plus un lien sortant dans le footer plus tard. Ne pas architecturer pour ça maintenant.

---

## Verification

Astro n'est pas encore scaffoldé. Jusqu'à ce que `bun create astro` ait tourné à l'étape `marvin:scaffold` :

**Verification: TBD — lands when Astro is scaffolded.**

Une fois scaffoldé, la commande de vérification est :

```
bun run build
```

Le build Astro échoue sur les liens internes cassés — c'est le check de correction principal pour un site docs. Vérifications complémentaires :

- Pagefind FR : chercher un terme français dans l'UI déployée, vérifier les résultats (accents, césure).
- GH Pages : page visible au refresh après push sur `main`.

---

## Done Criteria — Proof Slice

Le proof-slice est atteint quand :

1. 2–3 chapitres du guide + annexe B (qui contient les 17 liens `../adr/`) sont sous `src/content/docs/`.
2. `bun run build` passe sans erreur de lien cassé.
3. Le site est visible sur un vrai `*.github.io` au refresh après push.
4. La navigation sidebar respecte l'ordre linéaire du guide (le hero ne se noie pas dans le substrat).

Critères de rejet : un lien interne cassé ; un fichier `archives/` exposé ou lié ; le guide enterré derrière le substrat ; un build nécessitant autre chose que bun ; perte de l'ordre de lecture.

Ensuite : propagation à l'ensemble de `src/content/docs/`.

---

## First-time Setup

Les plugins projet-scoped sont déjà déclarés dans `.claude/settings.json` — un clone les obtient. Si tu dois les (ré)installer à la main :

```
# heart-of-gold-toolkit (deep-thought, marvin)
/plugin marketplace add ondrej-svec/heart-of-gold-toolkit
/plugin install deep-thought@heart-of-gold-toolkit
/plugin install marvin@heart-of-gold-toolkit
```

---

<!-- Drafted by marvin:harness-author for /home/titux/webdev/MBP/20260602-grimoire-arch/AGENTS.md on 2026-06-02. Edit freely — this comment is informational. -->
