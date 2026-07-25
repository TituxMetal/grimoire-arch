---
title: "Devbox — Boot BTRFS cassé après mise à jour kernel"
type: solution
date: 2026-07-12
domain: devbox / boot
component: systemd-boot / ESP / mkinitcpio / modules
symptoms:
  - "après pacman -Syu (kernel 7.1.2 → 7.1.3) le boot BTRFS tombe en maintenance mode"
  - "clavier USB mort après chargement kernel/initramfs (OK dans le menu systemd-boot)"
  - "ESP a encore vmlinuz/initramfs 7.1.2 ; modules 7.1.2 purgés, seuls 7.1.3 présents sur BTRFS"
root_cause: "après migration BTRFS, kernel-install-mkinitcpio retiré sans mécanisme de sync ESP ; mkinitcpio écrit sur /boot (racine BTRFS) tandis que l'ESP reste sur /efi avec l'ancien kernel → mismatch kernel ESP ≠ modules racine"
severity: high
status: resolved
related:
  - solutions/devbox/recidive-boot-apres-maj-kernel
  - solutions/devbox/reparation-boot-var-plein
---

> **Statut : problème résolu le 2026-07-12. Rapport rédigé le même jour.**
> Modifications effectuées ce jour : copy kernel + initramfs vers ESP, modules copiés sur ext4.

## Problème

Après un `pacman -Syu` le 12 juillet 2026 (kernel `7.1.2-arch3-1 → 7.1.3-arch1-2`), le boot sur
le système BTRFS tombe en **maintenance mode** et le **clavier USB ne répond plus**.
Le clavier fonctionne dans le menu systemd-boot, mais plus après le chargement du kernel/initramfs.

Le système ext4 (LVM, filet de sécurité laissé en place lors de la migration) boote normalement.

## Diagnostic

### Symptômes

- Menu systemd-boot : clavier OK
- Après chargement kernel + initramfs : maintenance mode, clavier USB mort
- Cold boot, changement de port USB, attente 5 min hors tension : aucun effet

### Cause immédiate

| Composant | ESP (ce que systemd-boot charge) | Racine BTRFS (ce que le kernel cherche) |
|---|---|---|
| Kernel | `vmlinuz-linux` — **7.1.2** (daté du 6 juillet) | — |
| Initramfs | `initramfs-linux.img` — **7.1.2** (daté du 6 juillet) | — |
| Modules kernel | — | `/lib/modules/7.1.3-arch1-2/` uniquement (7.1.2 supprimé par la MAJ) |

**Mismatch** : le kernel 7.1.2 chargé depuis l'ESP ne trouve pas ses modules dans
`/lib/modules/7.1.2-arch3-1/` (supprimés lors de la mise à jour). Les modules USB HID ne peuvent
pas être chargés → clavier mort → maintenance mode.

### Cause racine

Lors de la migration BTRFS du 6 juillet 2026, la **Phase A.2** a supprimé le paquet AUR
`kernel-install-mkinitcpio` (buggé) et la **Phase A.8** a fait une copie manuelle unique du
kernel et de l'initramfs de `/boot/` vers `/efi/` (l'ESP).

**Aucun mécanisme automatique** n'a été mis en place pour synchroniser `/boot/` (racine BTRFS)
vers `/efi/` (ESP) après chaque mise à jour du kernel.

À chaque `pacman -Syu` :
1. Le paquet `linux` met à jour `/lib/modules/<nouvelle version>/` et supprime l'ancienne
2. `mkinitcpio -P` régénère l'initramfs dans `/boot/` (sur la racine BTRFS)
3. **Rien ne copie ces fichiers vers l'ESP** → l'ESP reste avec l'ancien kernel + ancien initramfs
4. Au reboot suivant : kernel ESP ≠ modules racine → boot cassé

### Pourquoi mbp n'est pas affecté

Sur mbp, l'ESP est monté sur `/boot` (configuration standard systemd-boot). `mkinitcpio`
écrit directement sur l'ESP. La synchronisation est automatique.

Sur devbox, l'ESP est monté sur `/efi` (non standard). Le preset mkinitcpio écrit dans
`/boot/` qui est un répertoire de la racine BTRFS. L'ESP n'est jamais mis à jour.

| | mbp | devbox |
|---|---|---|
| ESP monté sur | `/boot` | `/efi` |
| Sortie mkinitcpio | `/boot/` = ESP ✅ | `/boot/` = racine BTRFS ❌ |
| MAJ kernel → ESP synchronisé ? | Automatique | Manuel (une seule fois, phase A.8) |

## Réparation

### Étape 1 — Diagnostic (sur le système ext4 booté)

```bash
# Constat : ESP a les fichiers du 6 juillet
ls -la /efi/vmlinuz-linux /efi/initramfs-linux*.img
# → Jul 6

# Monter la racine BTRFS pour inspection
sudo mount -o subvol=@,compress=zstd:3 /dev/mapper/archlinux--vg-btrfs_pool /mnt

# Constat : BTRFS a kernel 7.1.3 + modules 7.1.3, mais ESP a 7.1.2
file /mnt/boot/vmlinuz-linux   # → 7.1.3-arch1-2
ls /mnt/lib/modules/            # → 7.1.3-arch1-2 uniquement
file /efi/vmlinuz-linux         # → 7.1.2-arch3-1
```

### Étape 2 — Copie kernel + initramfs vers l'ESP

```bash
sudo cp /mnt/boot/vmlinuz-linux /efi/vmlinuz-linux
sudo cp /mnt/boot/initramfs-linux.img /efi/initramfs-linux.img
sudo cp /mnt/boot/initramfs-linux-fallback.img /efi/initramfs-linux-fallback.img
```

### Étape 3 — Copie des modules 7.1.3 vers le système ext4

Nécessaire car l'ESP est partagé entre les deux systèmes. Les entrées BLS ext4 chargent
aussi `/vmlinuz-linux` depuis l'ESP. Sans les modules 7.1.3 sur l'ext4, le filet de sécurité
serait cassé aussi.

```bash
sudo cp -a /mnt/lib/modules/7.1.3-arch1-2 /lib/modules/
```

### Étape 4 — Reboot

```bash
sudo umount /mnt
sudo reboot
```

Choix dans systemd-boot : **Arch Linux (BTRFS)**.

## Résultat post-reboot

```
Kernel      : 7.1.3-arch1-2
Racine      : btrfs (subvol=@)
Subvolumes  : 9/9 montés (@, @home, @webdev, @snapshots, @var-log, @var-cache, @var-tmp, @pkg, @home-cache)
Services    : 0 failed
Microcode   : Updated early from: 0x0000002c
Boot time   : 22.5s (firmware 13.7s + loader 2.6s + kernel 0.8s + initrd 2.0s + userspace 3.2s)
```

## Reste à faire (MàJ 2026-07-21)

### ✅ Résolu — ESP sync (Option A, 2026-07-21)

L'ESP est monté sur `/boot` dans `/etc/fstab` (UUID `DDEE-933B`). `mkinitcpio -P` écrit
directement sur l'ESP. Confirmé par reboot post-fix.

**Historique** : le fix avait été appliqué le 2026-07-15, mais la ligne ESP a été effacée
accidentellement lors d'un nettoyage de fstab le 2026-07-21 (ajout de `nofail` sur les backups).
Cf. [récidive boot après maj kernel](/grimoire-arch/solutions/devbox/recidive-boot-apres-maj-kernel/).

### ✅ Abandonné — Réparer pacman sur ext4

Le filet de sécurité ext4 a été supprimé le 2026-07-15 (4 LV `lvremove`, BLS entries supprimées).
LTS (6.18.38-3) sert de fallback à la place.

### ✅ Fait — Phase G (2026-07-15)

4 LV ext4 supprimés, `btrfs_pool` étendu 120G→296G, BLS ext4 supprimées.
Cf. plan migration BTRFS phase 3b (`~/sandbox/devbox/2026-07-06-phase-3b-migration-btrfs.md`, non publié), Phase G.

## Leçons apprises

1. **Ne pas supprimer `kernel-install-mkinitcpio` sans mettre en place un mécanisme de remplacement**
   pour synchroniser l'ESP. La copie manuelle unique de la phase A.8 est un sparadrap qui ne survit
   pas à la première mise à jour kernel.

2. **L'ESP monté sur `/boot` est la configuration standard pour une bonne raison** : elle rend la
   synchronisation automatique. La déviation (ESP sur `/efi`) était un héritage de l'installation
   initiale de 2023 qui n'a pas été corrigé pendant la migration.

3. **Toute intervention sur le boot doit inclure un test de mise à jour kernel** dans la checklist
   de validation. La phase E (reboot test BTRFS) validait le premier boot mais pas le cycle
   « MAJ kernel → reboot ».

4. **Les modules kernel dans `/lib/modules/` et le kernel sur l'ESP doivent toujours matcher.**
   Un mismatch rend le clavier USB inutilisable (modules HID non chargeables), ce qui rend le
   mode maintenance inutilisable — cercle vicieux.

5. **Quand on partage l'ESP entre deux systèmes, toute modification de l'ESP affecte les deux.**
   Copier le nouveau kernel sur l'ESP pour réparer BTRFS casse aussi ext4 si les modules ne
   sont pas mis à jour des deux côtés.

## Références

- Migration BTRFS — plan d'exécution (`~/sandbox/devbox/2026-07-06-phase-3b-migration-btrfs.md`, non publié)
- Migration BTRFS — récapitulatif (`~/sandbox/devbox/2026-07-06-recap-migration-btrfs.md`, non publié)
- [Grimoire Arch — ch. 04 Boot moderne](/grimoire-arch/guide/04-boot-moderne/)
- Suite : [récidive boot après maj kernel (2026-07-21)](/grimoire-arch/solutions/devbox/recidive-boot-apres-maj-kernel/)
- Voisine : [réparation boot /var plein](/grimoire-arch/solutions/devbox/reparation-boot-var-plein/)
