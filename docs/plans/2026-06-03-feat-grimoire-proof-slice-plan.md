---
title: "feat: publier le proof-slice grimoire-arch (build + sidebar héros + deploy GH Pages)"
type: plan
date: 2026-06-03
status: in_progress
brainstorm: ../../../_INCUBATOR/2026-06-02-wiki-migration-arch-starlight-brainstorm.md
architecture: ../architecture/grimoire-arch.md
stories: ../stories/grimoire-arch.md
confidence: high
---

# feat — Proof-slice grimoire-arch bout-en-bout

**En une ligne :** copier le slice (guide ch.1–3 + annexe B + 17 ADR), le rendre
buildable et navigable sous le sous-chemin GitHub Pages `/grimoire-arch`, puis le
déployer au push sur `https://TituxMetal.github.io/grimoire-arch/` — la boucle
complète, pas une capture locale.

---

## Problem Statement

Le scaffold Astro Starlight est posé et `bun run build` passe sur le template
vierge (STORY-001 faite, commit `2094698`). Mais le site ne contient encore **aucun
contenu réel**, n'est pas configuré pour le bon utilisateur GitHub, n'a pas de
workflow de déploiement, et n'existe pas en ligne. Il faut prouver que la boucle
**contenu → build → sidebar héros → deploy GH Pages** fonctionne sur une tranche
représentative avant de propager tout `docs/` (STORY-008, hors périmètre).

Le slice est représentatif parce qu'il exerce **la seule couture inter-dossiers du
contenu** : les 17 liens `guide/annexe-b → ../adr/`. Si ce sous-graphe build,
navigue et déploie proprement, le reste n'est que répétition.

## Target End State

Quand ce plan a atterri :

1. `src/content/docs/guide/` contient `01-audit-baseline.md`, `02-ext4-vers-btrfs.md`,
   `03-snapshots.md`, `annexe-b-adr.md` — chacun avec frontmatter `title:`.
2. `src/content/docs/adr/` contient les 17 fichiers `0001-…` à `0017-…` — chacun
   avec frontmatter `title:`.
3. `bun run build` passe **sans aucun avertissement de lien cassé** (les 17 liens
   de l'annexe B résolvent — c'est le canari).
4. `astro.config.mjs` sert le site sous `site: 'https://TituxMetal.github.io'` +
   `base: '/grimoire-arch'`, sidebar = groupe **Guide** ordonné (01→02→03→annexe B)
   avant un groupe **Coulisses** subordonné ; le contenu template est retiré.
5. `.github/workflows/deploy.yml` déploie sur push `main` via `withastro/action@v6`
   (bun auto-détecté) + `actions/deploy-pages@v4`, aucune commande npm/pnpm/yarn.
6. Le repo `TituxMetal/grimoire-arch` existe, `main` est poussé, Pages Source =
   GitHub Actions, et le site est **visible au refresh** sur le vrai sous-chemin.
7. Recherche Pagefind FR : un terme accentué (ex. « récupération ») renvoie des
   résultats corrects. Aucun fichier `archives/` exposé ni lié.

## Scope and Non-Goals

**Dans le périmètre (STORY-002 → STORY-007) :** config site/base/sidebar, copie du
slice, frontmatter des 21 fichiers, résolution des 17 liens, workflow de déploiement,
création du repo GitHub + activation Pages, vérification bout-en-bout.

**Hors périmètre (explicitement) :**
- **STORY-008** — propager ch.4–13, annexe A, et tout le substrat. Ne pas démarrer
  avant le slice vert. La taxonomie fine de la sidebar « Coulisses » (Open Q4) se
  tranche là, pas ici.
- **`related:` orphelins** du substrat (Open Q3) — pas de substrat dans le slice.
- **`lgdweb.fr`** — au plus un lien sortant futur. Ne rien architecturer pour ça.
- **Domaine custom, versioning du guide, toute toolchain non-bun.**

## Proposed Solution

Quatre phases dépendance-ordonnées, **un commit par phase** (préférence actée,
messages en anglais) :

1. **Slice content live** — copier + frontmatter en un bloc, pour atteindre un build
   vert avec du vrai contenu (le canari des 17 liens se vérifie ici même).
2. **Hero navigation + identité site** — sidebar Guide/Coulisses, `site` = TituxMetal,
   suppression du contenu template.
3. **Deploy workflow** — `.github/workflows/deploy.yml` (bun via `withastro/action`).
4. **Ship & verify** — créer le repo, pousser, activer Pages, vérifier en ligne.

Le découpage garantit qu'à chaque frontière de phase `bun run build` est vert
(commit propre). La phase 1 précède la 2 parce que la sidebar référence des slugs
de contenu qui doivent exister sous peine de casser le build.

---

## Implementation Tasks

> Chaque phase se termine par `bun run build` vert **puis** un commit. Le canari
> (`bun run build`) est l'arbitre de correction tout du long.

### Phase 1 — Slice content live (STORY-003 + STORY-004 + STORY-005)

> **DÉVIATION ACTÉE (canari) — voir `docs/adr/2026-06-03-link-validation-canary.md`.**
> L'hypothèse « Astro réécrit les liens `.md` + le build échoue sur lien cassé » est
> **fausse** empiriquement (Astro 6.4 + Starlight 0.39, collection loader) : les liens
> relatifs fuient tels quels et le build reste vert même cassé. Décision (validée par
> l'utilisateur) : ajouter `starlight-links-validator` (vrai canari) et passer les 17
> liens en **root-relative AVEC base** `/grimoire-arch/adr/<slug>/` (seule forme à la
> fois validée par le plugin ET correcte sur le sous-chemin ; la forme relative est
> *ignorée* par le plugin, non validée).

- [x] Copier les 4 fichiers guide depuis `~/migration-backup/docs/guide/` vers
      `src/content/docs/guide/` (fichiers nommés, pas `cp -r`).
- [x] Copier les 17 ADR depuis `~/migration-backup/docs/adr/` vers `src/content/docs/adr/`.
- [x] **Garde-fou archives** : `find src/content/docs -path '*archives*'` → **vide**.
- [x] `guide/` et `adr/` sont **siblings** sous `src/content/docs/`.
- [x] Frontmatter `title:` ajouté aux 4 fichiers guide (title = H1 d'origine, quoté
      YAML), H1 retiré du corps.
- [x] Frontmatter `title:` ajouté aux 17 ADR (aucun frontmatter à la source), H1 retiré.
- [x] ~~Liens relatifs `../adr/…md`~~ → **17 liens en `/grimoire-arch/adr/<slug>/`**
      (root-relative avec base). Cf. déviation ci-dessus.
- [x] `starlight-links-validator` installé (devDep, bun) + branché dans `astro.config.mjs`.
- [x] `bun run build` → **« All internal links are valid »**, exit 0 (canari réel actif).
- [x] (forcé par le canari) index.mdx : repoint minimal du hero `/guides/example/` →
      `/grimoire-arch/guide/01-audit-baseline/` pour passer vert. Reste du template +
      sidebar + site URL : Phase 2.
- [x] ADR-0006 écrit (`docs/adr/2026-06-03-link-validation-canary.md`).
- [x] Commit : `feat(content): publish proof-slice guide + ADRs with link-validation canary`

### Phase 2 — Hero navigation + identité site (STORY-002)

- [ ] `astro.config.mjs` : remplacer `site: 'https://USERNAME.github.io'` par
      `site: 'https://TituxMetal.github.io'`. **`base: '/grimoire-arch'` est déjà
      correct** — ne pas y toucher (gotcha : c'est le nom du repo, pas le dossier daté).
- [ ] Remplacer la sidebar template par : groupe **« Guide »** avec items **explicites
      ordonnés** (`guide/01-audit-baseline`, `guide/02-ext4-vers-btrfs`,
      `guide/03-snapshots`, `guide/annexe-b-adr`) — **pas** autogenerate, pour
      préserver l'ordre de lecture.
- [ ] Ajouter un groupe **« Coulisses / journal »** subordonné, listé **après** Guide.
      Au stade slice il n'y a pas de substrat : le laisser vide/minimal ou pointer un
      placeholder — la taxonomie réelle est STORY-008. Le groupe Guide doit rester
      visuellement premier.
- [ ] Supprimer le contenu template : `src/content/docs/guides/example.md`,
      `src/content/docs/reference/example.md`. Adapter `src/content/docs/index.mdx`
      (la landing splash) pour qu'elle ne référence plus les liens d'exemple ni
      `houston.webp` cassés — pointer le hero/CTA vers `guide/01-audit-baseline`.
- [ ] (Optionnel) Ajuster `src/styles/custom.css` (accent color / quelques
      `--sl-color-*`) — pas de Tailwind (ADR thème).
- [ ] `bun run build` vert ; vérifier l'ordre sidebar (01→02→03→annexe B, Coulisses
      après).
- [ ] Commit : `feat(config): hero sidebar and GitHub Pages site URL, drop template content`

### Phase 3 — Deploy workflow (STORY-006)

- [ ] Créer `.github/workflows/deploy.yml` :
      - `on:` `push` vers `main` **+** `workflow_dispatch`.
      - `permissions:` `contents: read`, `pages: write`, `id-token: write` (exactement
        les trois requises — pas de `contents: write`).
      - Job build : `actions/checkout@v6` → `withastro/action@v6` (bun auto-détecté
        via `bun.lock`).
      - Job deploy : `actions/deploy-pages@v4`, environment `github-pages`.
      - **Aucune** commande npm/pnpm/yarn.
- [ ] (Référence ADR) Alternative B documentée = `oven-sh/setup-bun@v2` + plomberie
      manuelle — ne pas l'implémenter, `withastro/action` est le défaut acté.
- [ ] Commit : `ci(pages): deploy via withastro/action on push to main`

### Phase 4 — Ship & verify (STORY-007) — actions sortantes, confirmer avant push

- [ ] Créer le repo distant : `gh repo create TituxMetal/grimoire-arch --public --source=. --remote=origin` (ou créer puis `git remote add origin`). **Vérifier que le nom du repo est exactement `grimoire-arch`** (== `base`).
- [ ] `git push -u origin main`.
- [ ] Activer Pages, Source = **GitHub Actions** :
      `gh api -X POST repos/TituxMetal/grimoire-arch/pages -f build_type=workflow`
      (ou manuellement Settings → Pages → Source = GitHub Actions si l'API échoue).
- [ ] Suivre le run : `gh run watch` — le job build+deploy doit passer vert.
- [ ] Vérifier le site **sur le vrai sous-chemin** `https://TituxMetal.github.io/grimoire-arch/`
      (la correction de `base` ne se voit pas en `localhost:4321/`).
- [ ] Cliquer un lien de l'annexe B → ouvre le bon ADR (couture inter-dossiers OK en prod).
- [ ] Recherche Pagefind : taper un **terme français accentué** (« récupération »,
      « réseau ») → résultats corrects (accents/césure).
- [ ] Confirmer la sidebar (ordre guide préservé, Coulisses subordonné) et
      qu'**aucun fichier `archives/`** n'apparaît dans le site déployé.
- [ ] (Hors-repo, documenter dans `docs/solutions/` si surprise) noter tout réglage
      manuel de Pages pour reproductibilité.

---

## Acceptance Criteria

Mesurables, dérivés de STORY-007 et des critères de rejet du brainstorm :

- `bun run build` passe en local, **zéro lien cassé**.
- `find src/content/docs -path '*archives*'` renvoie vide ; aucun `archives/` en prod.
- Le site répond sur `https://TituxMetal.github.io/grimoire-arch/` au refresh après
  push `main`, déployé par le run GitHub Actions (pas de step manuel de build).
- La sidebar affiche Guide (01 → 02 → 03 → annexe B) **avant** Coulisses.
- Un clic sur un lien d'annexe B ouvre le bon ADR sur le sous-chemin déployé.
- Une recherche Pagefind sur un terme accentué renvoie des résultats pertinents.
- Aucune commande npm/pnpm/yarn dans le repo ni la CI ; pas de `package-lock.json`
  ni `pnpm-lock.yaml`.

**Critères de rejet (tout échec = slice non atteint) :** un lien interne cassé ; un
fichier `archives/` exposé ou lié ; le guide noyé derrière le substrat ; un build qui
exige autre chose que bun ; perte de l'ordre de lecture.

---

## Decision Rationale

- **Copie + frontmatter dans la même phase** plutôt que deux commits : un fichier
  copié sans `title:` casse le schéma de collection Starlight → build rouge. On ne
  peut pas committer vert entre les deux. On regroupe pour respecter
  « un commit = un état vert ».
- **Sidebar après le contenu** : Starlight valide les `slug` de la sidebar contre le
  contenu existant. Lister un slug absent casse le build. Donc Phase 1 (contenu) puis
  Phase 2 (sidebar). Pour la même raison, suppression du template + nouvelle sidebar
  + correction de `index.mdx` se font **ensemble** en Phase 2.
- **Garder les liens en `.md` relatif, build comme arbitre** : Astro 6 réécrit les
  liens Markdown relatifs et applique `base`. Plutôt que de parier extensionless
  d'avance, on garde la forme source et on laisse le canari trancher — c'est sa raison
  d'être. Bascule extensionless seulement si le build le réclame.
- **`withastro/action@v6` plutôt que `setup-bun` manuel** : acté en ADR
  `workflow-deploiement-withastro-action` (supersede la mention littérale `setup-bun`
  du brainstorm Q5). L'action détecte bun via le lockfile et encapsule
  build + upload-pages-artifact. Moins de plomberie, surface d'erreur réduite.
- **Création du repo dans le plan, exécution confirmée** : l'utilisateur a fourni son
  pseudo `TituxMetal` explicitement (signal fort qu'il veut câbler le deploy). La
  création d'un repo public est une action sortante → `/work` confirme avant de pousser.

**Alternatives écartées (déjà tranchées en amont, non ré-ouvertes) :** Astro Starlight
vs VitePress/Docusaurus/Quartz/MkDocs (brainstorm Q1) ; tout-`docs/` vs guide seul
(Q2) ; guide-héros vs wiki plat (Q3) ; copie unique vs sync (Q4) ; bun vs npm (Q5).

---

## Constraints and Boundaries (BINDING)

- **bun uniquement** — 0 commande npm/pnpm/yarn dans le repo et la CI.
- **`docs/` du repo = doctrine**, jamais de contenu de migration dedans. Le contenu
  publié vit **exclusivement** sous `src/content/docs/`.
- **`guide/` et `adr/` siblings** sous `src/content/docs/` — ne pas aplatir, pas de
  table de routes manuelle. La résolution passe par le layout miroir + Astro.
- **`archives/` jamais copié, jamais lié, jamais publié** — exclu par construction
  (copie ciblée) + garde-fou post-copie.
- **`base: '/grimoire-arch'`** = nom du repo GitHub, **pas** le dossier daté local
  `20260602-grimoire-arch`. Un `base` erroné casse CSS/JS/liens sur le sous-chemin.
- **Pas de Tailwind** — thème Starlight par défaut + petit `customCss`.
- **Ordre de lecture linéaire** du guide préservé dans la sidebar (items explicites).

---

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| Pseudo GitHub = `TituxMetal` | **Verified** | `gh api user --jq .login` → `TituxMetal` |
| Repo `grimoire-arch` n'existe pas encore, pas de remote | **Verified** | `gh repo list` (absent) + `git remote -v` vide |
| Le scaffold build vert tel quel (STORY-001 faite) | **Verified** | `bun run build` → 4 pages, Pagefind OK, exit 0 |
| ch.1–3 ont 0 lien interne | **Verified** | `grep -oE '\]\([^)]+\)'` → vide sur les 3 |
| annexe B = exactement 17 liens `../adr/00NN-slug.md`, rien d'autre | **Verified** | grep : 17 liens, tous vers `adr/`, colonne « Chapitre lié » = texte |
| Les 17 ADR ne lient vers rien (pas de cross-link guide) | **Verified** | grep `\.md` dans `adr/` → 0 |
| ch.1–3 + annexe B **sans** frontmatter | **Verified** | `head -1` = `# titre` |
| Les 17 ADR **sans** frontmatter (résout l'Open Q de STORY-004) | **Verified** | `head -3` = `# ADR …` puis `- Statut :` |
| `custom.css` existe déjà (référencé par la config) | **Verified** | `src/styles/custom.css` (615 o, du scaffold) |
| Astro 6 résout les liens `.md` relatifs + applique `base` | **Verified-by-design** | Le canari `bun run build` (Phase 1) le prouve ; fallback extensionless documenté |
| `withastro/action@v6` détecte bun via `bun.lock` | Unverified | ADR + ground daté ; **confirmé au premier run** (Phase 4) |
| Pagefind indexe correctement le FR accentué | Unverified | Devient une tâche de vérif explicite en Phase 4 (STORY-007) |

Les deux Unverified sont couvertes : l'une par le premier run CI, l'autre par une
vérification manuelle en Phase 4. Aucune ne menace l'approche.

---

## Risk Analysis

| Risque | Impact | Mitigation |
|--------|--------|-----------|
| Liens `.md` non résolus par Astro → build rouge ou liens cassés en prod | Slice échoue (canari) | C'est précisément ce que le canari détecte. Fallback : basculer les 17 liens en extensionless et rebuild. Tranché en Phase 1, pas en prod. |
| Sidebar liste un slug absent → build rouge | Bloque Phase 2 | Phase 2 après Phase 1 ; items explicites = exactement les 4 fichiers copiés. |
| `index.mdx` template référence `houston.webp`/liens d'exemple supprimés → liens cassés | Build rouge en Phase 2 | Adapter `index.mdx` **dans la même phase** que la suppression du template. |
| Pages « Source = GitHub Actions » oublié | Deploy échoue **silencieusement**, site jamais visible | Tâche explicite via `gh api … pages -f build_type=workflow` + fallback manuel documenté. |
| `base` mal réglé (dossier daté au lieu du nom de repo) | CSS/JS/liens cassés sur le sous-chemin | `base` déjà correct dans le scaffold ; ne pas y toucher. Vérifier au `gh repo create` que le nom == `grimoire-arch`. Tester sur le vrai sous-chemin, pas localhost root. |
| Permissions CI incomplètes | 403 au deploy | Bloc `permissions` exact : `contents:read, pages:write, id-token:write`. |
| `cp -r` du dossier guide entier embarque ch.4–13 | Slice pollué, liens hors-slice possibles | Copier les **fichiers nommés**, pas le dossier. Garde-fou + revue post-copie. |
| Secret/perso qui fuit dans le contenu | Exposition publique | Audit grep déjà fait (brainstorm : rien). Re-grep chemins/configs avant le push réel (grep ≠ preuve). |

---

## Phased Implementation — Exit Criteria

- **Phase 1 exit :** 21 fichiers copiés + frontmatter, `archives` guard vide,
  `bun run build` vert **sans warning de lien cassé**, commit posé.
- **Phase 2 exit :** `site`=TituxMetal, sidebar Guide(ordonné)→Coulisses, template
  retiré, `index.mdx` réparé, build vert, ordre sidebar vérifié, commit posé.
- **Phase 3 exit :** `deploy.yml` présent (triggers + permissions + jobs corrects,
  0 npm), commit posé. (Pas de run encore — pas de remote.)
- **Phase 4 exit :** repo créé, `main` poussé, Pages = Actions, run vert, site visible
  sur le sous-chemin, liens annexe B OK en prod, Pagefind FR OK, 0 archives exposé.
  → **Proof-slice atteint.** Candidat `/compound` (recette « docs toolkit → Starlight
  /GH Pages bun »). Débloque STORY-008.

---

## References

- Brainstorm (QUOI/POURQUOI verrouillé) : `../../../_INCUBATOR/2026-06-02-wiki-migration-arch-starlight-brainstorm.md`
- Architecture (BINDING : layout, integration pattern, canari) : `../architecture/grimoire-arch.md`
- User stories (STORY-001 → 008) : `../stories/grimoire-arch.md`
- ADRs site : `../adr/2026-06-02-*.md` (placement contenu, base-path, workflow deploy, thème, exclusion archives)
- Ground briefing daté : `../ground/20260602-grimoire-arch__starlight.md`
- Source contenu (copie unique, lecture seule) : `~/migration-backup/docs/{guide,adr}/`
