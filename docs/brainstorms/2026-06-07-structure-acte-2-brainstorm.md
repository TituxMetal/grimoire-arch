---
title: "Structure acte II du grimoire — sidebar, tronc commun, devbox/"
type: brainstorm
date: 2026-06-07
participants: [Titux, Claude]
related:
  - ~/sandbox/grimoire/2026-06-06-architecture-documentaire-atelier-livre-terrain.md (§ Décisions actées pour l'acte II — entrée verrouillée)
  - ~/sandbox/grimoire/2026-06-07-spec-skill-publish.md (routage /publish — cohérence des chemins)
  - .claude/skills/publish/SKILL.md (skill implémentée, commit 94aa763)
  - docs/promotions.md (registre des promotions)
---

# Structure acte II du grimoire — sidebar, tronc commun, devbox/

## Problem Statement

Ce n'est pas « où poser des dossiers » : c'est **comment le livre passe d'un guide
linéaire one-shot (acte I, 13 chapitres + annexes) à une œuvre multi-actes sans casser
l'ordre de lecture ni les URLs publiées, et en gardant le routage `/publish` exprimable
en une règle** (*spécifique machine* → acte concerné, *agnostique machine* → tronc
commun).

## Context

Entrées verrouillées (capture du 2026-06-06, non rouvertes ici) : devbox entre dans le
grimoire ; acte II = récit des deltas, pas un second déroulé ; nouveau groupe sidebar à
côté de « Guide » ; sous-dossiers `devbox/` dans les Coulisses ; ADR migration en
continuité 0018+.

État du repo vérifié au 2026-06-07 :

- Sidebar : `Guide` (16 items explicites, ordre linéaire délibéré — « NOT
  autogenerate ») + `Coulisses / journal` (replié, sous-groupes autogénérés par cycle
  de vie) — `astro.config.mjs:36-77`.
- `solutions/devbox/` existe déjà (promotion boot-var-plein, commit `0eea21c`) — le
  précédent d'absorption par `autogenerate` est prouvé en prod.
- Dernier ADR migration : 0017 → la continuité 0018+ est cohérente.
- Canari de liens : `starlight-links-validator` fait échouer `bun run build` sur tout
  lien interne cassé.
- `/publish` est implémentée (commit `94aa763`) ; sa spec couvre frontmatter + liens +
  bannière + registre + commit — **pas** l'édition du sidebar.

## Chosen Approach

**Additif pur, quatre groupes, items explicites pour le hero, structure posée d'abord.**

```
Guide — Acte I (MBP)        ▸ guide/           (16 items explicites, intact)
Acte II — Devbox            ▸ devbox/          (items explicites, récit des deltas)
Tronc commun                ▸ tronc-commun/    (items explicites, naît vide + index)
Coulisses / journal         ▸ (inchangé, replié, autogenerate + sous-dossiers devbox/)
```

- L'acte I ne bouge pas : ni URLs, ni ordre, ni contenu. Le tronc commun naît vide et
  grandit par promotions (récit nvim, dotfiles…). L'acte II référence les chapitres
  8–13 de l'acte I quand le sujet est agnostique — par lien, pas par déménagement.
- La structure prend corps **maintenant** : groupes sidebar + deux pages d'accueil
  (`devbox/index.md`, `tronc-commun/index.md`) écrites par le relieur (geste atelier,
  pas une promotion). `/publish` a des destinations réelles ; le site annonce l'acte II.

## Why This Approach

- **Additif pur** : protège l'acquis (URLs publiées, ordre linéaire éprouvé, 17 liens
  annexe-b) — le grimoire est un *rendu*, on n'éventre pas un rendu déjà relié.
- **Tronc après les actes** : les deux récits se suivent (MBP → devbox), le tronc est
  l'annexe partagée qu'on consulte par lien. L'ordre narratif prime sur la chronologie.
- **Items explicites pour le hero** : l'ordre de lecture est délibéré, jamais subi —
  même doctrine que l'acte I ; les chapitres promus arrivent dans le désordre, un
  autogenerate à préfixes imposerait des renumérotations.
- **Structure d'abord** : évite de faire porter à `/publish` la création de groupe +
  index + slug d'un coup, et lève l'incertitude « Starlight accepte-t-il un groupe
  vide ? » en ne la posant jamais.

## Subjective Contract

- Target outcome : la sidebar raconte la structure en actes d'un coup d'œil ; le hero
  reste hero.
- Anti-goals : le guide noyé sous le substrat ; un acte II qui paraphrase l'acte I ;
  des placeholders qui ressemblent à du contenu promis non tenu.
- Tone rules : les deux pages d'index sont du relieur — courtes, situantes (« ce que
  cet acte contient, ce qu'il référence »), pas des chapitres.
- Rejection criteria : une URL acte I qui change ; un lien inter-actes cassé qui passe
  le build ; le routage `/publish` qui ne se laisse plus dire en une phrase.

## Key Design Decisions

### Q1 : Le tronc commun et les chapitres 8–13 existants — RESOLVED
**Decision :** Additif pur. Le tronc commun naît vide ; les chapitres agnostiques de
l'acte I (8–13 : shell, terminal, sxhkd, bspwm, IA) restent où ils sont, référencés
par lien depuis l'acte II.
**Rationale :** Zéro restructuration, URLs et ordre intacts, le canari protège les
références croisées.
**Alternatives considered :** Extraction des ch. 8–13 vers le tronc (plus pur, mais
casse URLs + ordre + 17 liens) ; hybride avec redirections (pureté payée en
maintenance et en sidebar ambiguë). Rejetées.

### Q2 : Topologie sidebar — RESOLVED
**Decision :** Quatre groupes frères : Acte I → Acte II → Tronc commun → Coulisses.
**Rationale :** Les récits se suivent, le tronc est l'annexe partagée ; l'ordre
narratif prime sur la chronologie de l'aventure.
**Alternatives considered :** Tronc entre les actes (chronologique — nvim se joue
maintenant — mais coupe la narration MBP → devbox) ; groupe parent « Le Livre »
(sépare bien des Coulisses mais enfonce le hero d'un niveau). Rejetées.

### Q3 : Noms de dossiers — RESOLVED
**Decision :** `src/content/docs/devbox/` et `src/content/docs/tronc-commun/`.
**Rationale :** Colle mot pour mot au vocabulaire des décisions actées et de la règle
de routage `/publish`. Pas de collision avec `solutions/devbox/` (Coulisses).
**Alternatives considered :** `acte-2/` (explicite sur la structure, muet sur le
sujet, désaligné du vocabulaire machine) ; `commun/` (court mais vague, casse le 1:1
avec « tronc commun »). Rejetées.

### Q4 : Labels de groupes — RESOLVED
**Decision :** « Guide — Acte I (MBP) », « Acte II — Devbox », « Tronc commun ».
**Rationale :** Le mot Guide survit (continuité), la structure en actes devient
lisible d'un coup d'œil. Renommer un label ne touche aucune URL.
**Alternatives considered :** Machines en avant (« Guide MBP » / « Devbox » — sobre
mais la narration en actes disparaît) ; « Guide » inchangé (zéro retouche mais
asymétrique). Rejetées.

### Q5 : Mécanique sidebar de l'acte II et du tronc — RESOLVED
**Decision :** Items explicites, comme l'acte I. Chaque promotion d'un chapitre hero
ajoute son slug dans `astro.config.mjs` — geste intégré au pipeline `/publish`.
**Rationale :** Ordre délibéré, cohérent avec la doctrine « NOT autogenerate » du
hero ; l'arrivée incrémentale des chapitres rend les préfixes numériques fragiles.
**Alternatives considered :** Autogenerate + préfixes 01-, 02- (moins de friction par
promotion, mais renumérotations probables et ordre subi). Rejetée.

### Q6 : Séquencement — RESOLVED
**Decision :** Structure d'abord : groupes sidebar + `devbox/index.md` +
`tronc-commun/index.md` créés maintenant, en geste atelier (le relieur écrit les
pages d'accueil ; ce ne sont pas des promotions). La retouche `/publish` (étape slug
sidebar) se fait au même passage.
**Rationale :** `/publish` garde un pipeline simple ; le site annonce l'acte II ;
l'hypothèse « groupe vide » n'est jamais posée.
**Alternatives considered :** Lazy à la première promotion (fait tout porter à
`/publish`) ; structure sans index (dépend d'un comportement Starlight non vérifié).
Rejetées.

### Note d'interprétation — ADRs devbox
« ADR en continuité 0018+ » (décision actée) se lit : les ADRs migration devbox
continuent **à plat** dans `src/content/docs/adr/` avec la numérotation 0018+ — un
seul corpus ADR migration, pas de sous-dossier `adr/devbox/`. Les sous-dossiers
`devbox/` des Coulisses concernent les autres familles (solutions, findings, plans,
brainstorms, stories).

## Assumption Audit (approche choisie)

- ✓ Bedrock : `autogenerate` absorbe les sous-dossiers `devbox/` des Coulisses —
  prouvé en prod (`solutions/devbox/`, commit `0eea21c`).
- ✓ Bedrock : le canari de liens protège les références inter-actes (`bun run build`
  échoue sur lien cassé).
- ✓ Bedrock : `devbox/` top-level ne collisionne pas avec `solutions/devbox/`.
- ? Non vérifiée → **mitigée par Q6** : `/publish` doit gagner une étape « slug
  sidebar » pour les destinations hero — actée comme partie du même passage atelier.
- ? Non vérifiée → **évitée par Q6** : comportement Starlight sur groupe à items
  explicites vide — jamais posée, les index existent dès la création des groupes.

## Open Questions

- **Prologue de l'acte II** : boot-var-plein est déjà promu en Coulisses
  (`solutions/devbox/`, mode Coulisses). Jamais de re-promotion — si l'acte II veut un
  prologue rédigé, ce sera un chapitre en mode récit qui *référence* la solution
  publiée. À trancher quand le chapitre s'écrira.
- **Contenu exact des deux pages d'index** (ton relieur, quelques lignes situantes +
  renvois) — à écrire pendant l'implémentation, pas à sur-spécifier ici.
- **Forme précise de l'étape « slug sidebar » dans `/publish`** (où dans le pipeline,
  comment elle propose l'emplacement dans l'ordre) — détail d'implémentation pour
  `/plan`.

## Out of Scope

- Truth-up des statuts périmés (carte des fils, finding theme-dark, plan
  fix-fullscreen, ligne drag de guide/11) — session séparée, déjà au programme.
- La migration devbox elle-même et son carnet de terrain (`~/migration-devbox/`,
  ~juillet 2026) — le travail se fait là où vivent les fichiers.
- Toute réécriture de l'acte I (y compris extraction des ch. 8–13).
- `lgdweb.fr`, déploiement, re-promotion d'artefacts déjà promus.

## Next Steps

- `/plan docs/brainstorms/2026-06-07-structure-acte-2-brainstorm.md` — tranche
  atelier : ADR site (docs/adr/) actant la structure, édition `astro.config.mjs`
  (labels + deux groupes), `devbox/index.md` + `tronc-commun/index.md`, étape « slug
  sidebar » dans `.claude/skills/publish/SKILL.md`, `bun run build` en canari.
- Candidat `/compound` : le pattern « structure d'abord, promotion ensuite » (le
  relieur pose les rayonnages avant que les livres arrivent) si l'acte II le valide à
  l'usage.
