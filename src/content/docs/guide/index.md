---
title: "Guide — migration Arch → BTRFS + station tiling"
---

Guide **raisonné** : il explique *pourquoi* chaque décision est prise, pas seulement *comment*. Les
commandes sont des illustrations à adapter, jamais un script à copier tel quel. Les exemples sont tirés
du rebuild d'un poste ancien (matériel détaillé en **annexe A**) ; les leçons — BTRFS, boot, snapshots,
réseau, sécurité, WM — valent **indépendamment du matériel**.

Chaque chapitre suit le même gabarit : **Objectif → Procédure (ancrée doc officielle) → Décisions &
pourquoi → Pièges**. Quand une affirmation n'a pas de source officielle, elle porte l'étiquette
**« retour d'expérience »**.

## Ordre de lecture

| # | Chapitre | Sujet |
|---|---|---|
| 1 | [Audit & baseline](/grimoire-arch/guide/01-audit-baseline/) | Assainir et mesurer avant de migrer |
| 2 | [ext4 → BTRFS à subvolumes](/grimoire-arch/guide/02-ext4-vers-btrfs/) | Migration non destructive, filet de sécurité |
| 3 | [Snapshots](/grimoire-arch/guide/03-snapshots/) | Timeshift BTRFS + autosnap + hook *Install/Remove* |
| 4 | [Boot moderne](/grimoire-arch/guide/04-boot-moderne/) | ESP-on-`/boot`, mkinitcpio vanilla, microcode, systemd-boot |
| 5 | [Quand ça casse : récupération](/grimoire-arch/guide/05-recuperation/) | Live USB, chroot, pièges pacman |
| 6 | [Bureau (XFCE + Ly)](/grimoire-arch/guide/06-bureau-xfce-ly/) | Session, login manager, suspend/lock |
| 7 | [Réseau & sécurité](/grimoire-arch/guide/07-reseau-securite/) | WireGuard, GPG, faillock |
| 8 | [Shell & env modulaire](/grimoire-arch/guide/08-shell-env-modulaire/) | Split XDG `~/.config/{bash,env}/NN-*` |
| 9 | [Outils terminal](/grimoire-arch/guide/09-outils-terminal/) | Neovim, alacritty, Firefox durci |
| 10 | [Hotkeys portables](/grimoire-arch/guide/10-hotkeys-sxhkd/) | xbindkeys → sxhkd, un lanceur par WM |
| 11 | [WM tiling : i3 → bspwm](/grimoire-arch/guide/11-wm-bspwm-polybar/) | bspwm + polybar |
| 12 | [Outillage IA](/grimoire-arch/guide/12-outillage-ia/) | Claude Code, intégration Neovim |
| 13 | [Workflow IA](/grimoire-arch/guide/13-workflow-ia/) | Le cycle des skills (méthode réutilisable) |

Annexes : [A — Matériel ancien](/grimoire-arch/guide/annexe-a-materiel-ancien/) · [B — Décisions d'architecture (ADR)](/grimoire-arch/guide/annexe-b-adr/)

## Périmètre

Ce guide **documente** une migration déjà réalisée et une station déjà reconstruite — il n'est pas un
récit chronologique (les journaux bruts sont archivés dans `archives/`, hors de ce guide). Hors périmètre : la suppression
du filet de sécurité ext4 (phase ultérieure conditionnée), le portage vers une autre machine.
