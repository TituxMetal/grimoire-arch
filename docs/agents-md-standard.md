# Le standard AGENTS.md

Ce que `AGENTS.md` à la racine du repo s'engage à respecter. Un `AGENTS.md` qui échoue à l'un de
ces checks est de la dette de doctrine, pas une carte.

## Les 12 checks PASS/FAIL

| # | Check | PASS si… |
|---|---|---|
| 1 | `agents_md_exists` | un `AGENTS.md` existe à la racine du projet |
| 2 | `map_not_dump` | il fait ≤ ~180 lignes — une carte, pas un déversoir |
| 3 | `read_first_present` | une section "Read First" liste des fichiers **qui existent** |
| 4 | `task_routing_present` | au moins 3 routes « si tu touches X, lis/édite Y » |
| 5 | `verification_boundary_stated` | la commande qui décide « c'est fini » est nommée |
| 6 | `done_criteria_explicit` | des critères de « terminé » opérationnels, pas vagues |
| 7 | `next_safe_move_obvious` | un nouvel arrivant sait quoi faire ensuite sans demander |
| 8 | `repo_map_matches_reality` | la carte du repo correspond à l'arbo réelle (ou marque l'éphémère explicitement) |
| 9 | `links_repo_relative` | tous les liens internes sont relatifs au repo et non cassés |
| 10 | `no_chat_only_rules` | aucune règle ne vit seulement dans une conversation — tout est dans des fichiers |
| 11 | `public_private_boundaries_current` | public/privé dit (ici : pas d'`archives/` publiés ; livre = SoT) |
| 12 | `maintenance_triggers_named` | on sait *quand* mettre la doctrine à jour |

## L'heuristique `map_not_dump`

L'`AGENTS.md` **route vers** la profondeur ; il ne la **recopie pas**. Un ADR vit
dans `docs/adr/`, pas dans `AGENTS.md`. La procédure publish vit dans
`.agents/skills/publish/SKILL.md`.

## Déclencheurs de maintenance (ce projet)

Mettre `AGENTS.md` (racine) à jour quand :

- la sidebar ou la structure hero/coulisses change ;
- une skill projet est ajoutée/déplacée sous `.agents/skills/` ;
- `bun run build`, le base path, ou l'hébergement change ;
- le plugin/harness de référence webdev change (aujourd'hui : OMP + `ce-*` only).
