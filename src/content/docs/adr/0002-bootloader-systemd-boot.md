---
title: "ADR 0002 — Bootloader : systemd-boot"
---

- Statut : accepté (contrainte de départ)
- Chapitre lié : 4

## Contexte

Une machine UEFI mono-OS doit choisir un bootloader. Le choix structure le workflow d'installation des
kernels et le format des entrées de boot.

## Décision

Utiliser **systemd-boot**, **jamais GRUB**. Les entrées sont au format BLS (Boot Loader Specification) et
référencent le filesystem par UUID.

## Conséquences

- Configuration minimale, alignée sur le défaut moderne kernel-install (ESP-on-`/boot`, ADR 0005).
- systemd-boot lit **n'importe quels** chemins dans les entrées BLS : le layout `/<machine-id>/<kver>/`
  n'est qu'une convention, pas une obligation (chapitre 4).
- `updateGrub=false` requis dans les outils qui supposent GRUB (ex. timeshift-autosnap, ADR 0004).

## Alternatives considérées

- **GRUB** : plus lourd, configuration plus complexe pour un mono-OS UEFI ; aucun bénéfice ici.
- **rEFInd** : non retenu (entrées zombies rEFInd justement nettoyées de la NVRAM au chapitre 1).
