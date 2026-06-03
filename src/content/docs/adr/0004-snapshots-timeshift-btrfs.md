---
title: "ADR 0004 — Snapshots : Timeshift mode BTRFS"
---

- Statut : accepté (contrainte de départ)
- Chapitre lié : 3

## Contexte

Sur BTRFS à subvolumes (ADR 0005, chapitre 2), on veut un filet de sécurité quotidien : pouvoir revenir
en arrière après une mise à jour ou une désinstallation ratée, sans perdre le travail récent.

## Décision

Utiliser **Timeshift en mode BTRFS** avec **`timeshift-autosnap`** (snapshot avant chaque `Upgrade`
pacman), complété d'un **hook custom couvrant aussi les `Remove`**. `/home` est capturé mais **jamais
restauré** par un rollback (`include_btrfs_home_for_restore=false`).

## Conséquences

- Snapshots atomiques instantanés (CoW), donc un snapshot avant chaque transaction pacman est indolore.
- Un rollback restaure `@` sans toucher `@home` → le travail récent est préservé.
- `updateGrub=false` requis (systemd-boot, ADR 0002).
- Dépend du découpage en subvolumes `@`/`@home`/`@snapshots` (chapitre 2).

## Alternatives considérées

- **snapper** : possible, mais Timeshift suffit et reste simple ; pas de raison forte de migrer.
- **Hook `Upgrade` seul** : laisse les `Remove` sans filet → angle mort, refermé par le hook custom.
