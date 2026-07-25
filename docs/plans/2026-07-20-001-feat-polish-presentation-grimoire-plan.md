---
title: "feat: Polish présentation du grimoire (lot B+C)"
type: plan
date: 2026-07-20
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: legacy-requirements
execution: code
origin: docs/brainstorms/2026-07-20-polish-presentation-grimoire-brainstorm.md
---

## Goal Capsule

- **Objective:** Appliquer les 6 items de polish présentation (lot B+C) — config Astro (sidebar, liens externes), nouvelle page d'index Coulisses, et CSS ; additif pur, zéro contenu existant modifié.
- **Authority:** Brainstorm du 2026-07-20 ; produit validé, questions de design résolues.
- **Execution profile:** Atelier unique, `bun run build` en canari après chaque item config.
- **Stop conditions:** Build rouge ; lien interne cassé ; contenu existant modifié.
- **Tail:** `ce-work` → `ce-simplify-code` → `ce-code-review` → `ce-commit-push-pr`.

---

## Product Contract

### Summary

Atelier unique de polish présentation sur le site grimoire-arch : 6 items purement additifs répartis en config Astro (sidebar Coulisses, liens externes, page d'index) et CSS (palette de gris, taille de police, layout grand écran). Aucune modification de contenu existant. Rejection criteria : build rouge, lien interne cassé, contenu modifié.

### Problem Frame

Le site a atteint 100 % de son objectif primaire (guide complet publié, liens valides). Une visite post-rollout a relevé 8 items de polish cosmétiques. Les 6 items de présentation (B+C) forment un lot homogène, indépendant du contenu — prêts pour un passage unique.

### Requirements

- R1. Les 6 sous-groupes de la sidebar Coulisses sont repliés par défaut (`collapsed: true`)
- R2. Les liens externes ouvrent dans un nouvel onglet (`target="_blank"`, `rel="noopener noreferrer"`)
- R3. Une page d'index `/coulisses/` existe avec une intro situante et une table des matières
- R4. La palette de gris du thème est ajustée via les tokens CSS Starlight
- R5. La taille de police est ajustée via les tokens CSS Starlight
- R6. Le layout s'adapte aux écrans larges (>1920px) sans contrainte excessive

### Scope Boundaries

**Deferred for later (punchlist A.1, A.2):** Linkification du corpus — batch séparé, nécessite son propre cadrage à cause de l'invariant « source unique ».

**Outside this product's identity:** Contenu devbox (Acte II), promotion nvim, adaptation de la skill publish.

**Deferred to Follow-Up Work:** Aucun — le plan couvre l'intégralité du lot B+C.

### Key Design Decisions

#### Q1: Lot présentation seul ou lot mixte A+B+C? — RESOLVED (origin)
Lot présentation seul (B+C, 6 items). Les items contenu (A.1, A.2) touchent `src/content/docs/` et l'invariant « copie unique = source de vérité » — ils méritent un cadrage dédié.

#### Q2: Index Coulisses — intro seule ou intro + TOC? — RESOLVED (origin)
Intro + table des matières, sur le modèle de `guide/index.md`. Le lecteur voit d'un coup d'œil ce que contient chaque sous-section.

#### Q3: Plugin liens externes — lequel? → DÉLÉGUÉ À L'IMPLÉMENTATION (origin)
Le choix exact dépend de la compatibilité Astro 6.x / Starlight 0.39. Contrat : tout lien externe ouvre dans un nouvel onglet. Voir les notes d'approche dans U1.

### Assumptions

- Les tokens CSS `--sl-color-gray-1` à `--sl-color-gray-6`, `--sl-text-base`, `--sl-text-h1` à `--sl-text-h5`, et `--sl-content-width` sont les tokens Starlight 0.39 standards — à vérifier dans la doc Starlight avant d'écrire le CSS.
- `collapsed: true` sur les sous-groupes fonctionne en Starlight 0.39 (déjà validé sur le parent Coulisses).
- Le plugin `starlight-links-validator` déjà actif (`astro.config.mjs:31`) garantit que le canari de liens cassés fonctionne.

---

## Planning Contract

### Key Technical Decisions

- **KTD1. Groupement en 3 unités plutôt que 6.** Les items B.4+B.3 partagent `astro.config.mjs` ; B.5 (U2) touche aussi `astro.config.mjs` pour l'entrée sidebar tout en restant une unité séparée (page + entrée) ; C.6+C.7+C.8 partagent `custom.css`. Grouper réduit l'overhead de commit sans perdre d'indépendance — chaque unité reste vérifiable isolément avec `bun run build`. Les edits `astro.config.mjs` de U1 et U2 sont séquencés (U1 d'abord) ou faits dans le même passage.
- **KTD2. rehype-external-links comme approche privilégiée pour B.3.** Le plugin rehype standard s'intègre dans le pipeline markdown d'Astro. Si incompatible avec Astro 6 / Starlight 0.39, fallback : un script client-side minimal injecté via `head` dans `astro.config.mjs` (pas de nouvelle dépendance). Le contrat est ferme — le choix d'outil est secondaire.
- **KTD3. Ajout d'une entrée sidebar pour B.5.** La page `coulisses/index.md` est le premier élément du groupe Coulisses, avant les sous-groupes autogénérés, sur le modèle du Guide. Le pattern `{ slug: 'coulisses' }` est ajouté dans le groupe `label: 'Coulisses / journal'`.
- **KTD4. CSS additif uniquement.** Tous les réglages CSS (C.6, C.7, C.8) sont ajoutés dans `custom.css` après les variables d'accent existantes, sans modifier les règles existantes. Aucune nouvelle feuille de style.

### Approach

Atelier unique additif pur : trois unités vérifiables isolément — U1 et U2 modifient toutes deux `astro.config.mjs` (B.4/B.3 vs entrée sidebar B.5) donc leurs edits config sont séquencés (U1 d'abord) ou dans le même passage ; U2 crée en plus `src/content/docs/coulisses/index.md` ; U3 seule modifie `src/styles/custom.css`. Aucune ne touche le contenu existant sous `src/content/docs/`. Ordre : config sidebar d'abord (impact structurel visible), puis page index, puis CSS (ajustements visuels par-dessus).

---

## Implementation Units

### U1. Config sidebar — sous-groupes repliés + liens externes

- **Goal:** Ajouter `collapsed: true` sur les 6 sous-groupes Coulisses et intégrer le support `target="_blank"` pour les liens externes.
- **Requirements:** R1, R2
- **Dependencies:** Aucune
- **Files:**
  - `astro.config.mjs` — modifier
- **Approach:**
  - B.4 : Ajouter `collapsed: true` sur chacun des 6 objets de sous-groupe dans le groupe `label: 'Coulisses / journal'` (Brainstorms, Findings, Plans, Solutions, Stories, Décisions/ADR). Pattern : même clé que le parent, qui fonctionne déjà.
  - B.3 : Intégrer `rehype-external-links` dans le pipeline markdown d'Astro (`markdown.rehypePlugins` dans `astro.config.mjs`). Si le plugin rehype n'est pas compatible Astro 6, fallback sans nouvelle dépendance : injecter un script inline dans `head` (config Starlight `head`) qui pose `target="_blank"` et `rel="noopener noreferrer"` sur les liens externes au `DOMContentLoaded`. Le contrat est « tout lien externe ouvre dans un nouvel onglet » — l'outil est secondaire.
- **Patterns to follow:**
  - Sidebar : le pattern `collapsed: true` déjà utilisé sur le parent Coulisses (ligne 80 de `astro.config.mjs`)
  - Config Astro : le pattern d'intégration existant (`integrations: [starlight({ plugins: [...] })]`)
  - Solution doc : `docs/solutions/starlight-gh-pages-bun.md` (piège 3 — API sidebar v0.39)
- **Test scenarios:**
  - **Happy path:** Après build, la sidebar affiche les 6 sous-groupes repliés. Un clic sur le parent Coulisses déplie le groupe ; les sous-groupes restent repliés jusqu'à clic individuel.
  - **Happy path:** Un lien externe dans le contenu rendu porte `target="_blank"` et `rel="noopener noreferrer"`. Un lien interne ne porte aucun de ces attributs.
  - **Edge case:** Liens externes dans la sidebar et le footer — vérifier qu'ils sont aussi couverts.
  - **Error path:** Si le plugin rehype casse le build sur Astro 6, le fallback script fonctionne sans erreur console.
- **Verification:**
  - `bun run build` passe sans erreur
  - Inspection du HTML généré : liens externes avec `target="_blank"`, liens internes sans
  - Sidebar : navigation manuelle dans `bun run preview` — les sous-groupes sont repliés

### U2. Page d'index pour les Coulisses

- **Goal:** Créer une page d'index `/coulisses/` avec une introduction situante et une table des matières listant les 6 sous-sections.
- **Requirements:** R3
- **Dependencies:** U1 d'abord si les deux touchent `astro.config.mjs` dans le même atelier ; le fichier `coulisses/index.md` peut être rédigé en parallèle. L'entrée sidebar `{ slug: 'coulisses' }` s'applique sur le groupe Coulisses post-U1.
- **Files:**
  - `src/content/docs/coulisses/index.md` — créer
  - `astro.config.mjs` — modifier (ajout entrée sidebar)
- **Approach:**
  - Créer `src/content/docs/coulisses/index.md` sur le modèle de `src/content/docs/guide/index.md` : titre + paragraphe d'introduction situant le rôle des Coulisses (journal de bord du projet, pas du guide de migration) + table des matières listant les 6 sous-sections avec une phrase descriptive chacune.
  - Ajouter `{ slug: 'coulisses' }` comme premier item du groupe `label: 'Coulisses / journal'` dans la sidebar, avant les sous-groupes autogénérés.
  - Ton : relieur — quelques lignes situantes, pas un chapitre. Cohérent avec le ton du guide.
- **Patterns to follow:**
  - Structure de page : `guide/index.md` (titre + intro + table des matières)
  - Sidebar : item explicite `{ slug: '...' }` dans un groupe, pattern utilisé pour tous les chapitres du Guide
- **Test scenarios:**
  - **Happy path:** La page `/coulisses/` est accessible, affiche un titre, une intro, et une table des matières avec les 6 sous-sections.
  - **Happy path:** La sidebar affiche l'entrée « Coulisses » en premier dans le groupe Coulisses, avant les sous-groupes.
  - **Edge case:** Les liens de la table des matières pointent vers les bonnes URLs. Vérifier avec `bun run build` (le validateur de liens les contrôle).
  - **Edge case:** La page ne casse pas le build si un sous-groupe est vide (ex. `solutions/` temporairement sans contenu publié).
- **Verification:**
  - `bun run build` passe sans erreur (le validateur de liens vérifie les URLs de la TOC)
  - Navigation dans `bun run preview` : page accessible, rendu correct, liens TOC fonctionnels

### U3. CSS — palette de gris, taille de police, layout grand écran

- **Goal:** Ajuster la présentation visuelle via les tokens CSS Starlight : palette de gris plus contrastée, taille de police ajustée, layout adapté aux écrans larges.
- **Requirements:** R4, R5, R6
- **Dependencies:** Aucune (peut être fait avant, après, ou en parallèle de U1, U2)
- **Files:**
  - `src/styles/custom.css` — modifier
- **Approach:**
  - C.6 : Surcharger `--sl-color-gray-1` à `--sl-color-gray-6` pour ajuster la palette de gris. Cibler les deux thèmes (`:root` dark par défaut + `:root[data-theme='light']`) si le contraste le justifie.
  - C.7 : Surcharger `--sl-text-base` (taille de corps) et `--sl-text-h1` à `--sl-text-h5` (tailles de titres) si l'échelle par défaut est trop petite.
  - C.8 : Surcharger `--sl-content-width` avec une valeur plus large (ex. `90rem` au lieu de la valeur par défaut) pour exploiter les écrans >1920px.
  - Tous les ajouts sont apposés **après** les variables d'accent existantes dans `custom.css`, précédés d'un commentaire identifiant le bloc (C.6, C.7, C.8). Aucune règle existante modifiée.
  - Les tokens exacts sont à vérifier dans la doc Starlight 0.39 avant écriture — l'assumption audit du brainstorm les liste comme probables mais non confirmés.
- **Patterns to follow:**
  - Structure CSS existante : `:root` (dark) puis `:root[data-theme='light']`
  - Conventions du projet : commentaires explicatifs en français, référence à l'ADR theme
  - ADR : `docs/adr/2026-06-02-theme-starlight-defaut-customcss.md`
- **Test scenarios:**
  - **Happy path:** Le site affiche la palette de gris ajustée dans les deux thèmes (dark/light).
  - **Happy path:** La taille de police est modifiée ; les titres et le corps suivent la nouvelle échelle.
  - **Happy path:** Sur un écran >1920px, le contenu utilise une largeur accrue plutôt que de rester centré étroit.
  - **Edge case:** Les réglages ne cassent pas la mise en page sur mobile (<768px).
  - **Edge case:** Les tokens surchargés n'affectent pas les composants Starlight qui utilisent des variables dérivées (vérifier la sidebar, la search bar, les code blocks).
  - **Edge case:** Le contraste reste suffisant dans les deux thèmes (vérifier le ratio de contraste texte/fond).
- **Verification:**
  - `bun run build` passe sans erreur
  - Inspection visuelle dans `bun run preview` : palette de gris, tailles de police, et largeur de contenu dans les deux thèmes
  - Test responsive : mobile, tablette, desktop standard, desktop large (>1920px)

---

## Verification Contract

| Gate | Command | Applies to |
|---|---|---|
| Build canary | `bun run build` | U1, U2, U3 (après chaque unité, puis final) |
| Link validation | Le build échoue sur lien cassé (starlight-links-validator) | U2 (liens TOC) |
| Visual check | `bun run preview` + inspection manuelle | U1 (sidebar), U2 (page index + entrée sidebar + TOC), U3 (CSS) |
| External links | Inspection HTML — `target="_blank"` sur liens externes | U1 |

---

## Definition of Done

- [x] Les 6 sous-groupes Coulisses sont repliés par défaut dans la sidebar
- [x] Les liens externes ouvrent dans un nouvel onglet (`rehype-external-links`, import explicite)
- [x] La page `/coulisses/` existe avec intro + TOC **linkée** (6 landings section `sidebar.hidden`)
- [x] La palette de gris est ajustée dans les deux thèmes (contraste **visible**, pas ±2–3 L)
- [x] La taille de police est ajustée (body 18px appliqué sur `.sl-markdown-content` + échelle h1–h5)
- [x] Le layout élargit le contenu (`--sl-content-width: 75rem` / 1200px ; défaut Starlight 45rem)
- [x] `bun run build` passe sans erreur (66 pages, validator liens vert)
- [x] Contenu guide existant intact ; ajouts limités à `coulisses/index.md` + 6 landings section
- [x] Dépendance `rehype-external-links` ajoutée pour B.3 (nécessité démontrée)
