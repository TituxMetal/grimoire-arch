# grimoire-arch — AGENTS.md

## Mission

Publier le guide de migration Arch Linux (ext4→BTRFS + station tiling) sous forme de site statique navigable sur GitHub Pages, auto-déployé au push via GitHub Actions. Référence personnelle consultable pendant la migration — projet autonome, pas un module ni un portail.

Stack : Astro Starlight, bun end-to-end, GitHub Actions (`oven-sh/setup-bun`).

Doc de ce projet : **français**. Code (identifiants, commentaires, messages de commit/PR) : **anglais**.

---

## PIEGE CRITIQUE — deux arbres `docs/`, deux mondes distincts

| Arbre | Chemin | Contenu |
|---|---|---|
| **Doctrine du projet** | `docs/` | Comment on construit le site — plans, ADRs Starlight/GH Pages, solutions de build, registre des promotions |
| **Contenu publié** | `src/content/docs/` | Le livre : guide (acte I), acte II devbox, tronc commun, coulisses / substrat migration |

Règles absolues :

- Le contenu de migration ne va **jamais** dans `docs/` — uniquement dans `src/content/docs/`.
- Les ADRs de `docs/adr/` concernent le site. Les ADRs de `src/content/docs/adr/` concernent la migration Arch.
- Rien d'`archives/` ne doit apparaître sous `src/content/docs/`.
- **Le livre dans ce repo est la source de vérité.** Pas de sync depuis un backup externe.

---

## Read First

1. `docs/agents-md-standard.md` — 12 checks PASS/FAIL de ce fichier.
2. `docs/adr/` — décisions architecturales *du site*.
3. *(workspace local, hors clone GitHub)* `../_INCUBATOR/grimoire-arch/2026-06-02-wiki-migration-arch-starlight-brainstorm.md` — QUOI/POURQUOI verrouillé.
4. *(workspace local)* `../AGENTS.md` — discipline webdev (`ce-*`, OMP).

---

## Task Routing

- **Config Astro, thème, sidebar** → `docs/adr/` puis `astro.config.mjs`.
- **Contenu hero (guide / acte II / tronc commun)** → `src/content/docs/guide/`, `devbox/`, `tronc-commun/`. Jamais dans `docs/`.
- **Substrat coulisses** → `src/content/docs/{brainstorms,findings,plans,solutions,stories,adr}/` (et landings `coulisses/`).
- **Décision build/deploy** → ADR dans `docs/adr/` (`AAAA-MM-JJ-titre.md`).
- **Problème de build résolu** → `docs/solutions/` (problem→fix).
- **Plan de travail site** → `docs/plans/` via `ce-plan`.
- **Promouvoir calepin/terrain → livre** → skill `publish` (`.agents/skills/publish/SKILL.md`). Registre : `docs/promotions.md`. Une fois, sens unique ; après promo le livre fait foi.
- **Couture canari** → liens guide ↔ ADR migration en root-relative avec base `/grimoire-arch/...` ; `bun run build` + `starlight-links-validator`.

---

## Repo Map

```
20260602-grimoire-arch/
├── astro.config.mjs
├── public/
├── src/
│   ├── styles/custom.css
│   └── content/docs/          # LIVRE
│       ├── guide/             # acte I (MBP) — ordre sidebar explicite
│       ├── devbox/            # acte II — deltas devbox
│       ├── tronc-commun/      # récits agnostiques machine
│       ├── coulisses/         # index TOC substrat
│       ├── brainstorms|findings|plans|solutions|stories|adr/
├── .github/workflows/deploy.yml
├── docs/                      # DOCTRINE SITE
│   ├── agents-md-standard.md
│   ├── promotions.md          # registre /publish
│   ├── adr|plans|solutions|brainstorms|…
├── .agents/skills/publish/    # skill publish (canon OMP/Pi)
```

---

## Agent tooling

- **Harness :** OMP (défaut webdev). Pi en évaluation. **Pas** Claude Code / heart-of-gold sur ce projet.
- **Plugin :** `compound-engineering` (`ce-*`) — installé au niveau user OMP, pas pin HoG projet.
- **Skill locale :** `publish` uniquement (promotion calepin → livre). ≠ `ce-promote`.
- Artefacts `ce-plan` / `ce-brainstorm` / `ce-compound` → sous `docs/` (doctrine site), pas sous `src/content/docs/`.

| Sortie ce-* (doctrine site) | Chemin |
|---|---|
| brainstorms | `docs/brainstorms/` |
| plans | `docs/plans/` |
| solutions | `docs/solutions/` |
| adr (site) | `docs/adr/` |

Brainstorm produit d'origine : `../_INCUBATOR/grimoire-arch/2026-06-02-wiki-migration-arch-starlight-brainstorm.md`.

---

## Trust / Boundaries

- **bun uniquement** (pas npm/pnpm/yarn).
- Stack : Astro Starlight + TypeScript/MDX + bun.
- Sources hors repo pour `/publish` : `~/sandbox/**` (calepin, dont `devbox/`) et `~/.config/nvim/docs/**` (terrain nvim).
- **`lgdweb.fr` hors périmètre** (lien footer éventuel plus tard seulement).

---

## Verification

```
bun run build
```

Échoue sur liens internes cassés (`starlight-links-validator`) — critère principal.

Compléments : Pagefind FR sur le site déployé ; page visible sur `*.github.io/grimoire-arch/` après push `main`.

---

## Done criteria — où on en est

**Proof-slice initial : atteint** (guide + annexe B, build, GH Pages, sidebar hero vs coulisses).

Travail courant :

1. Promotions calepin → livre (`publish`), surtout coulisses et chapitres acte II / tronc commun.
2. Doctrine agent : OMP + `ce-*` only — pas de heart-of-gold / Claude project plugins.

Rejet permanent : lien interne cassé ; `archives/` exposé ; hero noyé par le substrat ; build hors bun ; `slug:` dans le frontmatter contenu.

---

## Maintenance de cette carte

Mettre à jour `AGENTS.md` quand :

- la sidebar ou la structure hero/coulisses change (`astro.config.mjs` / ADR site) ;
- une nouvelle skill projet apparaît sous `.agents/skills/` ;
- la commande de vérif ou le base path GH Pages change.
