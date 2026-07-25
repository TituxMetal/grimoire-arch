---
title: "Devbox — Récidive boot cassé après mise à jour kernel"
type: solution
date: 2026-07-21
domain: devbox / boot
component: systemd-boot / fstab / ESP / mkinitcpio
symptoms:
  - "après pacman -Syu (kernel 7.1.3 → 7.1.4) le boot sur le kernel normal échoue ; le LTS boote"
  - "ESP auto-monté sur /efi (gpt-auto-generator) avec un vieux vmlinuz ; /boot BTRFS a le kernel neuf"
  - "modules 7.1.3 déjà purgés, modules 7.1.4 présents — mismatch kernel ESP ≠ modules racine"
root_cause: "l'entrée fstab ESP→/boot (fix du 15 juillet) a été effacée par accident lors d'un nettoyage fstab le 21 juillet ; sans elle systemd-gpt-auto-generator remonte l'ESP sur /efi et mkinitcpio réécrit sur la racine BTRFS sans synchroniser l'ESP"
severity: high
status: resolved
---

> **Statut : résolu le 2026-07-21. Rapport rédigé le même jour.**
> Modifications effectuées ce jour : copie kernel 7.1.4 vers ESP, ajout ESP dans fstab sur `/boot`.

## Problème

Même symptôme que le 12 juillet 2026 : après `pacman -Syu` (kernel `7.1.3.arch2-2 → 7.1.4.arch1-1`
le 20 juillet), le boot sur le kernel normal échoue. Le LTS (6.18.39-1) boote normalement.

## Cause

Le fix du 15 juillet 2026 (ESP dans `/etc/fstab` monté sur `/boot`) **avait été appliqué**,
mais la ligne a été **supprimée accidentellement** lors d'un nettoyage de fstab le 21 juillet
(ajout de `nofail` sur les backups, suppression de lignes obsolètes au `dd` dans vim).

Conséquence : l'ESP est retombé en auto-mount par `systemd-gpt-auto-generator` sur `/efi` (avec
`fmask=0177`), et mkinitcpio écrivait à nouveau dans `/boot/` (racine BTRFS) sans synchroniser
l'ESP → mismatch kernel ESP (7.1.3) ≠ modules racine (7.1.4 supprimés) → boot cassé.

## Diagnostic

```
ESP auto-monté sur /efi (systemd-gpt-auto-generator, PAS dans fstab)
/boot/vmlinuz-linux               → 7.1.4 (BTRFS)  ✅
/boot/initramfs-linux.img         → 7.1.4 (BTRFS)  ✅
/efi/vmlinuz-linux                → 7.1.3 (ESP)    ❌ vieux
/lib/modules/7.1.4-arch1-1/       → présents        ✅
/lib/modules/7.1.3-arch2-2/       → supprimés       ❌
/etc/fstab                         → aucune entrée ESP
```

`kernel-install-mkinitcpio` (AUR) : **bien désinstallé**, aucun vestige actif.
`/etc/kernel/install.d/` : vide.
Seul vestige : `/etc/kernel/cmdline` (nov 2023) avec UUID obsolète — inoffensif.

## Réparation

### Étape 1 — Copie kernel normal vers l'ESP

```bash
sudo cp /boot/vmlinuz-linux /efi/vmlinuz-linux
sudo cp /boot/initramfs-linux.img /efi/initramfs-linux.img
sudo cp /boot/initramfs-linux-fallback.img /efi/initramfs-linux-fallback.img
```

### Étape 2 — Nettoyage de /boot/ (BTRFS) avant montage ESP

```bash
sudo rm /boot/vmlinuz-linux /boot/initramfs-linux*.img /boot/intel-ucode.img
```

Nécessaire pour éviter des fichiers fantômes sous le point de montage.

### Étape 3 — Ajout ESP dans fstab

```bash
sudo vim /etc/fstab
```

Ligne ajoutée :
```
UUID=DDEE-933B  /boot  vfat  rw,relatime,fmask=0022,dmask=0022,codepage=437,iocharset=ascii,shortname=mixed,utf8,errors=remount-ro  0 2
```

### Étape 4 — Démonter /efi, monter /boot

```bash
sudo umount /efi
sudo systemctl daemon-reload
sudo mount /boot
```

### Étape 5 — Vérifications

```bash
findmnt /boot          # → /dev/nvme0n1p1 vfat
ls -la /boot/          # → contenu ESP (EFI/, loader/, vmlinuz-*, initramfs-*)
bootctl list           # → 4 entrées BLS valides
```

### Étape 6 — Reboot

```bash
sudo reboot
```

Choix dans systemd-boot : **Arch Linux (BTRFS)**.

## Résultat post-reboot

```
Kernel         : 7.1.4-arch1-1
Current Entry  : arch-btrfs.conf
ESP            : /boot (fstab)
/efi           : non monté ✅
```

## Leçons

1. **Le fstab est le contrat de montage.** Sans entrée explicite, systemd-gpt-auto-generator
   prend le relais et monte l'ESP sur `/efi` avec des permissions restrictives — configuration
   héritée de 2023 qui n'est pas adaptée à une installation vanilla systemd-boot.
2. **Ne jamais nettoyer un fstab sans backup.** Le `dd` dans vim sur les premières lignes a
   bouffé l'entrée ESP sans que ce soit visible dans le diff visuel.
3. **La config ESP sur `/boot` est la seule configuration fiable sur devbox.** Sans elle,
   chaque mise à jour kernel cassera le boot du kernel normal (le LTS survit car ses fichiers
   sont placés directement sur l'ESP par un autre mécanisme).

## Reste à faire

- [x] ESP dans fstab sur `/boot`
- [x] Reboot sur kernel normal confirmé
- [ ] Mettre à jour `/etc/kernel/cmdline` avec l'UUID BTRFS actuel
- [ ] Vérifier au prochain `pacman -Syu` kernel que la synchro est bien automatique

## Références

- Rapport initial : [boot BTRFS cassé après maj kernel (2026-07-12)](/grimoire-arch/solutions/devbox/reboot-btrfs-apres-maj-kernel/)
- fstab archivé (`~/sandbox/devbox/archived/fstab_2026-07-21`, hors livre)
- Solution voisine : [réparation boot /var plein](/grimoire-arch/solutions/devbox/reparation-boot-var-plein/)
