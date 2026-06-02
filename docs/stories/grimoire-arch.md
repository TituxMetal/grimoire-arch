---
title: "grimoire-arch — User Stories (proof-slice)"
type: stories
date: 2026-06-02
source_brainstorm: ../_INCUBATOR/2026-06-02-wiki-migration-arch-starlight-brainstorm.md
ground_briefing: docs/ground/20260602-grimoire-arch__starlight.md
scope: proof-slice (guide ch.1–3 + annexe B + 17 ADR liés)
---

# grimoire-arch — Publier le guide de migration Arch en Starlight sur GitHub Pages

Périmètre de ce lot : le **proof-slice** défini dans le brainstorm — faire vivre
bout-en-bout **les chapitres 1–3 du guide + l'annexe B** (qui porte les 17 liens
`../adr/`, seul lien inter-dossiers) + **les 17 ADR de migration** qu'elle cible.
Si ce slice build, navigue et déploie proprement, le reste n'est que répétition
(STORY-008, hors slice).

Architecture liée : [`docs/architecture/grimoire-arch.md`](../architecture/grimoire-arch.md).
ADRs : `docs/adr/2026-06-02-*.md`.

> **Faits ancrés (survey source `~/migration-backup/docs/`, 2026-06-02) :**
> guide ch.1–3 = `01-audit-baseline.md`, `02-ext4-vers-btrfs.md`, `03-snapshots.md` ;
> annexe B = `annexe-b-adr.md` ; cibles ADR = `0001-…0017-…` (17, tous présents et liés).
> Les ch.1–3 ont **0 lien interne** ; l'annexe B a **17 liens `](../adr/00NN-slug.md)`**.
> ch.1–3 et annexe B **sans frontmatter** (juste `# titre`). `archives/` **absent de `docs/`**.

---

## STORY-001 : Scaffolder le projet Astro Starlight avec bun

**As a** mainteneur du grimoire
**I want** un projet Astro Starlight initialisé avec la toolchain bun
**So that** j'ai une base buildable (`bun run build`) sur laquelle poser le contenu

### Acceptance Criteria
- [ ] `astro.config.mjs`, `package.json`, `src/`, `public/` existent à la racine du repo
- [ ] `@astrojs/starlight` et `astro` sont dans `package.json`, versions pinnées par le scaffold
- [ ] Le lockfile bun (`bun.lock` ou `bun.lockb`) est généré et commité
- [ ] `bun run build` passe sur le projet vierge (template Starlight par défaut)
- [ ] Aucune trace de npm/pnpm/yarn (pas de `package-lock.json`, pas de `pnpm-lock.yaml`)

### Edge Cases
- Le scaffold crée un `docs/` ou écrase la doctrine projet → **interdit** : le contenu va dans `src/content/docs/`, le `docs/` du repo reste la doctrine (voir STORY-003 + ADR placement).

### Notes
- [INTEGRATION] Étape réalisée par `marvin:scaffold` (`bun create astro --template starlight`), pas par `/work`. Cette story documente le contrat de sortie attendu.
- [INTEGRATION] `.gitignore` doit déjà couvrir `node_modules/`, `dist/`, `.astro/` (fait au commit baseline).

---

## STORY-002 : Configurer `site`, `base` et la sidebar (guide-héros)

**As a** lecteur du guide
**I want** que le site se serve sous le bon sous-chemin GitHub Pages et que la sidebar suive l'ordre de lecture
**So that** les URLs et la navigation soient correctes et le guide ne se noie pas dans le substrat

### Acceptance Criteria
- [ ] `astro.config.mjs` définit `site: 'https://<user>.github.io'` et **`base: '/grimoire-arch'`** (nom du repo GitHub, **pas** le dossier daté local)
- [ ] La sidebar contient un groupe **« Guide »** ordonné explicitement (ch.1 → 13 → annexes), pas autogénéré, pour préserver l'ordre linéaire
- [ ] La sidebar contient un groupe **« Coulisses / journal »** subordonné pour le substrat (autogenerate accepté ici)
- [ ] Le groupe Guide apparaît **avant** le groupe Coulisses
- [ ] `title` du site Starlight = titre du grimoire (FR)

### Edge Cases
- `base` mal orthographié (ex. le dossier daté `20260602-grimoire-arch`) → CSS/JS/liens cassés sur le sous-chemin. Vérifier au `git remote add` que `base` == nom exact du repo.
- Au stade proof-slice, seuls ch.1–3 + annexe B existent : le groupe Guide ne liste que ces entrées ; les autres chapitres s'ajouteront au rollout (STORY-008).

### Notes
- [INTEGRATION] Décisions actées : ADR `base-path-github-pages`, et le principe guide-héros vient du brainstorm Q3.

---

## STORY-003 : Copier le contenu du proof-slice dans `src/content/docs/`

**As a** mainteneur
**I want** les fichiers du slice copiés depuis `~/migration-backup/docs/` vers `src/content/docs/`, dans une arbo miroir
**So that** Starlight les serve sans collision avec la doctrine du repo

### Acceptance Criteria
- [ ] `src/content/docs/guide/` contient `01-audit-baseline.md`, `02-ext4-vers-btrfs.md`, `03-snapshots.md`, `annexe-b-adr.md` (+ `README.md` du guide si utilisé comme index de section)
- [ ] `src/content/docs/adr/` contient les **17** fichiers `0001-…` à `0017-…`
- [ ] **Rien** n'est copié dans le `docs/` du repo (la doctrine projet reste intacte)
- [ ] Garde-fou : après copie, `find src/content/docs -path '*archives*'` ne renvoie **rien**
- [ ] L'arbo `guide/` et `adr/` reste **siblings** sous `src/content/docs/` (préserve la profondeur `../adr/` du lien canari)

### Edge Cases
- `archives/` est sibling de `docs/` à la source (pas dedans) → exclu par construction si la copie cible le sous-arbre `docs/` uniquement. Le garde-fou reste, au cas où.
- Collision de noms : `migration-backup/docs/adr/` ≠ `repo docs/adr/`. Ne jamais fusionner — destination = `src/content/docs/adr/`.

### Notes
- [INTEGRATION] Acté par ADR `placement-contenu-src-content-docs` (anti-collision, Open Q8 du brainstorm) et ADR `exclusion-archives`.
- Copie **une seule fois** : ensuite le repo est la source de vérité (brainstorm Q4), pas de sync.

---

## STORY-004 : Ajouter le frontmatter Starlight aux fichiers guide qui en manquent

**As a** moteur de build Starlight
**I want** un `title:` en frontmatter sur chaque page du slice
**So that** le build ne casse pas et chaque page a un H1 propre

### Acceptance Criteria
- [ ] `01-audit-baseline.md`, `02-ext4-vers-btrfs.md`, `03-snapshots.md`, `annexe-b-adr.md` ont un frontmatter YAML avec `title:`
- [ ] Le `title` reprend le texte du `# H1` d'origine (ex. `title: "01 — Audit & baseline"`)
- [ ] Le `# H1` d'origine est **retiré du corps** pour éviter le double titre (Starlight rend déjà `title` en H1)
- [ ] Les 17 ADR (déjà avec frontmatter à la source ? à vérifier) ont aussi un `title:` valide
- [ ] `bun run build` ne lève **aucune** erreur de schéma de collection

### Edge Cases
- ADR de migration `0001-…0017-…` : le survey a confirmé le frontmatter du substrat mais pas explicitement celui des ADR — vérifier au moment du `/plan` et traiter pareil si absent.
- Caractères spéciaux dans les titres (`→`, `&`, accents) : quoter le `title:` en YAML.

### Notes
- Mécanique, scriptable ou à la main (Open Q1 du brainstorm). Le `/plan` tranchera le moyen.

---

## STORY-005 : Faire résoudre les 17 liens `annexe-b → ../adr/` (le canari)

**As a** lecteur de l'annexe B
**I want** que les 17 liens vers les ADR pointent vers les bonnes routes Starlight
**So that** la navigation inter-dossiers marche et le build le prouve

### Acceptance Criteria
- [ ] Les 17 liens de `annexe-b-adr.md` résolvent vers les pages ADR générées
- [ ] `bun run build` passe **sans avertissement de lien cassé** (c'est le check de correction principal)
- [ ] Les ch.1–3 sont confirmés sans lien interne (rien à réécrire pour eux)
- [ ] Au rendu déployé (sous-chemin `/grimoire-arch/`), cliquer un lien d'annexe B ouvre le bon ADR

### Edge Cases
- Forme du lien : Astro 5 résout les liens Markdown relatifs ; **garder la forme relative `../adr/00NN-slug`** (préserver `guide/`+`adr/` siblings). Conserver ou retirer l'extension `.md` est **tranché par `bun run build`** — c'est la raison d'être du canari. Défaut : garder `.md` ; passer en extensionless seulement si le build le réclame.
- Le `base` doit être appliqué automatiquement par Astro aux liens résolus — vérifier sur le vrai sous-chemin, pas localhost root.

### Notes
- [INTEGRATION] Pattern de liaison **BINDING** détaillé dans l'architecture (« Integration Pattern »). C'est l'unique couture inter-dossiers du contenu.

---

## STORY-006 : Workflow GitHub Actions de déploiement (bun) vers Pages

**As a** mainteneur
**I want** qu'un push sur `main` build et déploie le site sur GitHub Pages
**So that** le site soit visible au refresh sans étape manuelle

### Acceptance Criteria
- [ ] `.github/workflows/deploy.yml` se déclenche sur `push` vers `main` + `workflow_dispatch`
- [ ] Le job utilise **`withastro/action@v6`** (bun auto-détecté via lockfile) — défaut recommandé
- [ ] Bloc `permissions` : `contents: read`, `pages: write`, `id-token: write`
- [ ] Job `deploy` via `actions/deploy-pages@v4` avec l'environment `github-pages`
- [ ] Aucune commande npm/pnpm/yarn dans le workflow
- [ ] Réglage repo (hors-repo, documenté) : Settings → Pages → Source = **GitHub Actions**

### Edge Cases
- Oublier le réglage « Source = GitHub Actions » → le déploiement échoue silencieusement (bloque le critère « visible au refresh »). À cocher manuellement, documenté dans le README de déploiement.
- Permissions manquantes → 403 au deploy.

### Notes
- [INTEGRATION] Acté par ADR `workflow-deploiement-withastro-action` (choix ouvert, **supersede** la mention littérale `setup-bun` du brainstorm Q5). Alternative B (`oven-sh/setup-bun@v2` + plomberie manuelle) documentée dans l'ADR.

---

## STORY-007 : Vérifier le proof-slice bout-en-bout

**As a** mainteneur
**I want** une vérification complète du slice (build + deploy + recherche)
**So that** je sache que la boucle entière fonctionne avant de propager

### Acceptance Criteria
- [ ] `bun run build` passe en local, **zéro lien cassé**
- [ ] Le site est visible sur `https://<user>.github.io/grimoire-arch/` après push sur `main`
- [ ] La sidebar respecte l'ordre du guide (ch.1 → 2 → 3 → annexe B), Coulisses subordonné
- [ ] Recherche Pagefind : un terme **français accentué** (ex. « récupération », « réseau ») renvoie des résultats corrects
- [ ] Aucun fichier `archives/` exposé ou lié dans le site déployé

### Edge Cases
- Pagefind FR : valider accents/césure (Open Q7 du brainstorm).
- Base-path : la correction `base` ne se voit que sur le vrai sous-chemin, pas en `localhost:4321/`.

### Notes
- Critères de rejet (brainstorm) : lien cassé ; `archives/` exposé ; guide noyé ; build non-bun ; perte de l'ordre de lecture. Tout échec ici = slice non atteint.
- [INTEGRATION] Candidat `/compound` une fois vert (recette réutilisable « docs toolkit → Starlight/GH Pages bun »).

---

## STORY-008 : Propager à l'ensemble de `src/content/docs/` (post-proof-slice)

**As a** mainteneur
**I want** copier et intégrer le reste du guide (ch.4–13, annexe A) et tout le substrat
**So that** le grimoire complet soit publié

### Acceptance Criteria
- [ ] Tous les chapitres restants + annexe A sont sous `src/content/docs/guide/`, frontmatter ajouté
- [ ] Les ~46 liens intra-guide restants résolvent (`bun run build` vert)
- [ ] Le substrat (brainstorms/findings/plans/solutions/stories) est sous `src/content/docs/`, taxonomie « Coulisses » finalisée (Open Q4)
- [ ] `related:` orphelins du substrat nettoyés ou ignorés sans casser le build (Open Q3)

### Edge Cases
- Cette story **dépend** du slice vert (STORY-007). Ne pas démarrer avant.

### Notes
- Hors périmètre du lot proof-slice. Listée pour capturer la dépendance et la règle de rollout du brainstorm.
