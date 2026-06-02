# Le standard AGENTS.md

Ce que `../AGENTS.md` s'engage à respecter. C'est le contrat que `/cc-lab-diagnose`
(et tout relecteur) peut vérifier. Un `AGENTS.md` qui échoue à l'un de ces checks
est de la dette de doctrine, pas une carte.

## Les 12 checks PASS/FAIL

| # | Check | PASS si… |
|---|---|---|
| 1 | `agents_md_exists` | un `AGENTS.md` existe à la racine du projet |
| 2 | `map_not_dump` | il fait ≤ ~180 lignes — une carte, pas un déversoir |
| 3 | `read_first_present` | une section "Read First" liste des fichiers **qui existent** |
| 4 | `task_routing_present` | au moins 3 routes « si tu touches X, lis/édite Y » |
| 5 | `verification_boundary_stated` | la commande qui décide « c'est fini » est nommée (ou marquée TBD honnêtement) |
| 6 | `done_criteria_explicit` | des critères de « terminé » opérationnels, pas vagues |
| 7 | `next_safe_move_obvious` | un nouvel arrivant sait quoi faire ensuite sans demander |
| 8 | `repo_map_matches_reality` | la carte du repo correspond à l'arbo réelle (ou marque ce qui n'existe pas encore) |
| 9 | `links_repo_relative` | tous les liens internes sont relatifs au repo et non cassés |
| 10 | `no_chat_only_rules` | aucune règle ne vit seulement dans une conversation — tout est dans des fichiers |
| 11 | `public_private_boundaries_current` | ce qui est public/privé, secret/exposé, est dit (ici : `archives/` jamais publié) |
| 12 | `maintenance_triggers_named` | on sait *quand* mettre la doctrine à jour (ex. après scaffold Astro) |

## L'heuristique `map_not_dump`

L'`AGENTS.md` **route vers** la profondeur ; il ne la **recopie pas**. Un ADR vit
dans `docs/adr/`, pas dans `AGENTS.md`. Une procédure vit dans le contenu, pas ici.
Si une section dépasse, c'est probablement qu'elle devrait être un fichier lié.

## Déclencheurs de maintenance (ce projet)

Mettre `../AGENTS.md` à jour quand :

- **Astro est scaffoldé** (`bun create astro`) → remplacer le « Verification: TBD »
  par la vraie commande, et confirmer la Repo Map.
- **Le contenu est copié** dans `src/content/docs/` → ajouter le guide README au "Read First".
- **La graine germe** dans `_INCUBATOR/grimoire-arch/` → mettre à jour le chemin `$BRAINSTORM_PATH` (Read First + Toolkit Output Paths).
