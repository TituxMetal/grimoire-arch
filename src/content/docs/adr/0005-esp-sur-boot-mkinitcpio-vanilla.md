---
title: "ADR 0005 — Boot : ESP-on-/boot + mkinitcpio vanilla"
---

- Statut : accepté
- Chapitre lié : 4

## Contexte

Le workflow de boot doit être simple et réparable. Un paquet AUR (`kernel-install-mkinitcpio`), hérité
d'un ancien tutoriel, créait des presets au format **ESP-relatif** (`/<machine-id>/<kver>/linux`)
invalides en invocation directe de mkinitcpio — un bug latent qui n'explosait qu'au premier
`mkinitcpio -P` direct.

## Décision

Adopter la **convention Arch vanilla** : ESP montée sur **`/boot`**, presets mkinitcpio standard à
**chemins plats** (`/boot/vmlinuz-<pkgbase>`, `/boot/initramfs-<pkgbase>.img`), hooks modernes (dont
`microcode` et `sd-vconsole`), **sans** le paquet AUR. Le microcode est embarqué dans l'initramfs via le
hook, pas via un `initrd` séparé.

## Conséquences

- Aucune dépendance AUR sur le chemin critique du boot ; convention la mieux documentée.
- ESP-on-`/boot` aligne les presets sur le défaut kernel-install (chemins valides).
- Les hooks modernes remplacent les anciens (`udev` retiré car redondant avec `systemd` ; `keymap
  consolefont` → `sd-vconsole`) ; l'ordre `autodetect` avant `microcode` compte.
- Trois décisions de boot restent **indépendantes** : bootloader / générateur d'initramfs / orchestrateur
  d'install kernel (chapitre 4).

## Alternatives considérées

- **Patcher les presets et garder le paquet AUR** : statu quo nettoyé mais dépendance AUR permanente sur
  le boot — écarté.
- **Autre générateur d'initramfs (dracut)** : pas d'alternative officielle, mkinitcpio est requis par les
  kernels Arch — écarté.
