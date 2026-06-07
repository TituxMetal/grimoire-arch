# ADR-0007 : Structure acte II — quatre groupes sidebar frères, additif pur

- **Statut** : accepté
- **Date** : 2026-06-07

## Contexte

Devbox entre dans le grimoire (décisions actées du 2026-06-06, non rouvertes ici) :
acte II = récit des deltas, pas un second déroulé. Le livre passe d'un guide linéaire
one-shot (acte I, 16 items explicites) à une œuvre multi-actes — **sans casser l'ordre
de lecture ni les URLs publiées**, et en gardant le routage `/publish` exprimable en
une règle (*spécifique machine* → acte concerné, *agnostique machine* → tronc commun).

Contraintes vérifiées au moment de la décision :

- Le hero est en items explicites, doctrine « NOT autogenerate » (`astro.config.mjs:36-57`).
- `autogenerate` absorbe les sous-dossiers `devbox/` des Coulisses — prouvé en prod
  (`solutions/devbox/`, commit `0eea21c`).
- Le canari de liens (ADR-0006) protège les références croisées inter-actes.
- `/publish` (commit `94aa763`) s'arrête si la destination exige une structure
  inexistante — le préalable atelier, c'est cet ADR.

Brainstorm complet (Q1–Q6, alternatives, assumption audit) :
`docs/brainstorms/2026-06-07-structure-acte-2-brainstorm.md`.

## Décision

Poser la structure **maintenant** (structure d'abord, promotion ensuite), en additif
pur — quatre groupes sidebar frères, dans cet ordre :

```
Guide — Acte I (MBP)        ▸ guide/           (16 items explicites, intacts)
Acte II — Devbox            ▸ devbox/          (items explicites, récit des deltas)
Tronc commun                ▸ tronc-commun/    (items explicites, naît vide + index)
Coulisses / journal         ▸ (inchangé : replié, autogenerate, sous-dossiers devbox/)
```

1. **Additif pur** (Q1) : l'acte I ne bouge pas — ni URLs, ni ordre, ni contenu. Les
   chapitres agnostiques 8–13 restent où ils sont, référencés **par lien** depuis
   l'acte II, jamais déménagés.
2. **Topologie** (Q2) : les actes se suivent (MBP → devbox), le tronc commun est
   l'annexe partagée consultée par lien — l'ordre narratif prime sur la chronologie.
3. **Dossiers** (Q3) : `src/content/docs/devbox/` et `src/content/docs/tronc-commun/`
   — mot pour mot le vocabulaire de la règle de routage `/publish`. Pas de collision
   avec `solutions/devbox/` (Coulisses).
4. **Labels** (Q4) : « Guide — Acte I (MBP) », « Acte II — Devbox », « Tronc commun ».
   Le mot Guide survit ; renommer un label ne touche aucune URL.
5. **Mécanique** (Q5) : items explicites pour les deux nouveaux groupes, même doctrine
   que l'acte I. Chaque promotion d'un chapitre hero ajoute son slug dans
   `astro.config.mjs` — geste intégré au pipeline `/publish` (étape « slug sidebar »).
6. **Séquencement** (Q6) : groupes + pages d'accueil (`devbox/index.md`,
   `tronc-commun/index.md`) créés en geste atelier par le relieur — ce ne sont pas
   des promotions. L'hypothèse « groupe à items explicites vide » n'est jamais posée.

**Note d'interprétation — ADRs devbox.** « ADR en continuité 0018+ » se lit : les ADRs
migration devbox continuent **à plat** dans `src/content/docs/adr/` avec la
numérotation 0018+ — un seul corpus ADR migration, pas de sous-dossier `adr/devbox/`.
Les sous-dossiers `devbox/` des Coulisses concernent les autres familles (solutions,
findings, plans, brainstorms, stories).

## Conséquences

- (+) Zéro restructuration : URLs publiées, ordre linéaire éprouvé et les 17 liens
  d'annexe B restent intacts — le grimoire est un *rendu*, on n'éventre pas un rendu
  déjà relié.
- (+) `/publish` garde un pipeline simple : les destinations hero existent, le routage
  tient en une phrase.
- (+) La sidebar raconte la structure en actes d'un coup d'œil ; le hero reste hero
  (Coulisses dernier, replié).
- (−) Le tronc commun naît vide (un seul index) : assumé — il grandit par promotions
  (récit nvim, dotfiles…), et l'index situe ce qu'il accueillera sans promettre.
- (−) Chaque promotion hero exige une édition d'`astro.config.mjs` : assumé — c'est le
  prix de l'ordre délibéré, et l'étape « slug sidebar » de `/publish` l'outille.

## Alternatives écartées

- **Extraction des ch. 8–13 vers le tronc commun** : plus pur conceptuellement, mais
  casse URLs + ordre + les 17 liens d'annexe B. Rejeté.
- **Hybride avec redirections** : la pureté payée en maintenance et en sidebar
  ambiguë. Rejeté.
- **Tronc commun entre les actes** (chronologique) : coupe la narration MBP → devbox.
  Rejeté.
- **Groupe parent « Le Livre »** : sépare bien des Coulisses mais enfonce le hero d'un
  niveau. Rejeté.
- **`acte-2/` ou `commun/` comme noms de dossiers** : désalignés du vocabulaire de la
  règle de routage (1:1 avec « devbox » et « tronc commun »). Rejetés.
- **Autogenerate + préfixes numériques pour l'acte II** : moins de friction par
  promotion, mais les chapitres arrivent dans le désordre → renumérotations probables,
  ordre subi. Rejeté.
- **Structure lazy à la première promotion** : fait porter à `/publish` la création de
  groupe + index + slug d'un coup, et pose l'hypothèse non vérifiée du groupe vide.
  Rejeté.
