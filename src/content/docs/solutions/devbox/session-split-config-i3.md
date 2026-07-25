---
title: "Devbox — Session split config i3 + incident advisor"
type: solution
date: 2026-07-14
domain: devbox / i3
component: i3 config include, config.d, advisor OMP
status: clos
---

> **Statut : session terminée le 2026-07-14. Config splitée, testée, rechargée.**
> Modifications effectuées ce jour : découpage config i3 en 5 fichiers. Aucune modification les 12-13/07
> (restauration manuelle par l'utilisateur + investigation seulement le 14/07).

## Contexte

Après la catastrophe du 13/07 (agent OMP + advisor qui ont bouzillé la config i3), l'utilisateur
a restauré manuellement la config fonctionnelle via Timeshift, puis cette session a :
1. Investigé l'incident advisor
2. Documenté le fonctionnement réel d'`include` dans i3
3. Exécuté le découpage propre de la config

## Incident advisor du 13/07/2026

### Chronologie

| Heure (UTC) | Événement |
|---|---|
| 04:14 | L'utilisateur demande un point sur l'état i3-wm |
| 04:44 | L'agent crée `config.d/10-variables.conf` + split config (correct) |
| 06:59 | L'utilisateur demande doc en commentaires + renommage directions vim ($west/$south…) |
| 07:00 | L'agent réécrit les deux fichiers (correct) |
| **07:02** | **💥 L'advisor envoie un BLOCKER** : accuse l'agent d'avoir halluciné tout le contenu |
| 07:03 | L'agent applique les « corrections » de l'advisor → config bouzillée |

### Le message BLOCKER de l'advisor

L'advisor a affirmé que les valeurs « correctes » étaient :

| Paramètre | Valeur réelle | Valeur advisor | Correct ? |
|---|---|---|---|
| `$pScreen` | `DP-0` | `DVI-D-0` | ❌ |
| `$rightScreen` | `DVI-D-0` | `VGA-0` | ❌ écran inexistant |
| `gaps inner` | `8` | `15` | ❌ |
| `gaps outer` | `5` | supprimé | ❌ |
| `smart_borders` | `on` | supprimé | ❌ |
| `default_border` | `normal 2` | `pixel 1` | ❌ |
| `font` size | `12` | `11` | ❌ |
| `workspace_layout` | `stacking` | `tabbed` | ❌ |

**Toutes les « corrections » étaient fausses.** L'advisor a confabulé des valeurs fantômes.

### Cause racine

L'advisor OMP est un agent parallèle **read-only** qui ne voit **pas les messages de l'utilisateur**.
Quand l'utilisateur a demandé le renommage légitime des variables de direction, l'advisor a vu
l'agent modifier des fichiers sans le contexte de la demande — il a paniqué et déclenché une
fausse alerte BLOCKER avec des valeurs inventées.

L'agent principal, face à une alerte `severity="blocker"`, a appliqué les corrections sans
vérifier les faits — ni relire le fichier, ni consulter la doc i3.

### Décision

**Advisor passé en mode manuel.** Ne plus le laisser tourner en automatique par défaut.
Le lancer uniquement sur demande explicite, et seulement dans des sessions de code source
(pas sur des fichiers système/config machine).

## Fonctionnement d'`include` dans i3

**Source : [i3 User's Guide §4.1](https://i3wm.org/docs/userguide.html#include)**

> Variable expansion happens in a separate stage **before** parsing include directives.

Conséquences :
- On **peut** définir une variable dans le fichier parent et l'utiliser dans un fichier inclus ✅
- On **ne peut pas** utiliser dans le parent une variable définie dans un fichier inclus ❌
- Les variables **doivent** être déclarées dans le fichier maître (`config`)

C'est l'inverse de ce que l'agent du 13/07 avait compris (il pensait que l'inclus était lu
avant le reste du parent, ou que l'ordre dans le fichier dictait tout).

## Résultat final — structure i3

```
~/.config/i3/
├── config                      116 lignes — header + variables + 4 includes
├── i3status.conf
└── config.d/
    ├── 10-keybinds.conf        125 lignes — bindsym + modes (resize, system)
    ├── 20-assignments.conf      68 lignes — workspace/screen, window/workspace, floating
    ├── 30-autostart.conf        15 lignes — polkit, pamac-tray, sxhkd
    └── 40-bar.conf              34 lignes — bar triple écran (i3status)
```

### Modifications utilisateur post-split

- `floating_minimum_size 1400x950` → `floating_maximum_size 1400x950` (empêche popups géantes,
  laisse btop se dimensionner normalement en floating)
- Retrait du flag `--dimensions 100 32` du bind btop dans sxhkdrc (flag inexistant sur Alacritty,
  hallucination de l'agent du 13/07)

## Reste à faire (rappel)

| Priorité | Tâche |
|---|---|
| 🔴 | ESP sync : monter `/efi` → `/boot` dans `/etc/fstab` |
| 🟡 | Rsync configs MBP (GPG déverrouillée, SSH prêt) |
| 🟡 | Section 11 : Session C — test bspwm + polybar |
| ⬜ | Sections 12-13 — Finitions + IA |

## Leçons

1. **Un advisor OMP ne voit pas les messages utilisateur.** Il peut déclencher des alertes
   basées sur une compréhension incomplète de ce que fait l'agent.
2. **Toujours vérifier les affirmations d'un advisor** contre l'état réel des fichiers.
3. **`include` i3 développe les variables avant de parser les includes.** Les variables
   doivent rester dans le fichier maître.
