---
title: "Devbox — réparation boot après mise à jour (/var plein, entrée BLS perdue)"
type: solution
date: 2026-06-04
domain: devbox / boot
component: kernel-install / systemd-boot / /var
symptoms:
  - "après pacman -Syu (kernel 7.0.11) et reboot : pas de boot, le firmware propose d'entrer dans le BIOS"
  - "loader/entries/ vide sur l'ESP, mtime = l'heure de l'update"
  - "No space left on device dans pacman.log pendant la génération de l'initramfs ; dkms nvidia exited 10 dans le même log"
root_cause: "/var 100% plein (cache pacman 26G, 1157 vieilles versions) → kernel-install add échoue (ENOSPC dans /var/tmp) APRÈS que le remove ait supprimé l'ancienne entrée BLS → ESP sans aucune entrée de boot → firmware → BIOS"
severity: high
---

> **TL;DR** : `/var` 100% plein → la génération de l'initramfs a échoué pendant l'update du kernel,
> *après* que `kernel-install` ait supprimé l'ancienne entrée BLS → ESP sans aucune entrée de boot →
> le firmware tombait directement sur le BIOS. Réparé en ~1h depuis un live USB via chroot :
> nettoyage de `/var`, `kernel-install add`, rebuild du module nvidia. Aucune perte de données.

## Symptôme

- Après `pacman -Syu` (kernel `7.0.11-arch1-1`) et reboot : pas de boot, le firmware propose
  d'entrer dans le BIOS. Le disque est visible dans le BIOS mais rien ne démarre.
- Intervention depuis le MacBook Pro, devbox démarré sur live Arch (clé Ventoy), SSH activé sur le
  live (`passwd` + `systemctl start sshd` + `ip -br a`).

## Contexte machine (état pré-migration BTRFS)

| Élément | Valeur |
|---|---|
| Disque système | NVMe — ESP `UUID=DDEE-933B` (FAT32, 1G) + LVM `archlinux-vg` |
| LV | root 32G / home 64G / var 48G / webdev 32G / virtPool 120G / game 80G — tout **ext4** |
| ESP montée sur | **`/efi`** (vieux layout, pré-grimoire) |
| Bootloader | systemd-boot + paquet AUR `kernel-install-mkinitcpio` (layout `/<machine-id>/<kver>/`) |
| machine-id | `ff2518599afe46adbf2865c56cb0145a` |
| Backups | Timeshift rsync sur VG `backup` (820G) |

⚠️ Les noms `nvmeXn1` ne sont **pas stables** entre boots (ESP vue `nvme1n1p1` sur le live,
`nvme0n1p1` après reboot) — toujours raisonner en UUID/labels, jamais en `/dev/nvmeX`.

## Diagnostic

1. `efibootmgr -v` : NVRAM **saine** — `Boot0000` pointe bien `\EFI\SYSTEMD\SYSTEMD-BOOTX64.EFI`,
   binaire présent et à jour sur l'ESP. Donc le problème n'était pas l'entrée EFI.
2. `ls /esp/loader/entries/` : **vide**, mtime = l'heure de l'update → systemd-boot se chargeait
   mais n'avait aucune entrée à booter → retour au firmware.
3. `ff…145a/7.0.11-arch1-1/` sur l'ESP : dossier créé mais **vide** → `kernel-install add` avait
   échoué à mi-parcours, après que le `remove` de l'ancien kernel ait déjà tout nettoyé.
4. **Preuve dans `/var/log/pacman.log`** :
   ```
   ==> Creating zstd-compressed initcpio image: '/var/tmp/kernel-install.staging.…/initrd'
   cat: write error: No space left on device
   ==> ERROR: Early uncompressed CPIO image generation FAILED
   /usr/lib/kernel/install.d/50-mkinitcpio.install failed with exit status 1.
   ```
   Et plus haut, victime collatérale du même ENOSPC :
   ```
   ==> WARNING: `dkms install --no-depmod nvidia/580.159.04 -k 7.0.11-arch1-1' exited 10
   ```
5. `df -h /var` : **47G/47G, 100%** — coupables : cache pacman 26G (1157 vieilles versions),
   journaux 3G. (docker 20G dans /var/lib, légitime, non touché.)

### Chaîne causale complète

`/var` jamais nettoyé → plein → update kernel → `kernel-install` supprime l'ancienne entrée BLS
(normal) → génération du nouvel initramfs en échec (ENOSPC dans `/var/tmp`) → ESP sans entrée →
firmware → BIOS. Le module nvidia dkms a échoué pour la même raison.

## Réparation (depuis le live, en SSH)

```sh
# 1. Activer et monter
vgchange -ay
mount /dev/archlinux-vg/root /mnt
mount /dev/archlinux-vg/var /mnt/var
mount /dev/nvme1n1p1 /mnt/efi          # l'ESP, au point de montage attendu par le fstab
arch-chroot /mnt

# 2. Libérer /var (dans le chroot)
paccache -rk2                          # → 6,87 GiB libérés (garde 2 versions = filet de rollback)
journalctl --vacuum-size=200M          # → 2,8 GiB libérés
df -h /var                             # → 9,9G libres ✅

# 3. Régénérer kernel + initramfs + entrée BLS
kernel-install add 7.0.11-arch1-1 /usr/lib/modules/7.0.11-arch1-1/vmlinuz

# 4. Rebuilder le module nvidia (le dkms qui avait échoué)
dkms install nvidia/580.159.04 -k 7.0.11-arch1-1
dkms status                            # → installed ✅

# 5. Régénérer l'initrd une dernière fois (hook kms : embarquer les modules nvidia fraîchement compilés)
kernel-install add 7.0.11-arch1-1 /usr/lib/modules/7.0.11-arch1-1/vmlinuz

# 6. Vérifier AVANT de rebooter (règle d'or ch. 05 du grimoire)
ls -la /efi/ff2518599afe46adbf2865c56cb0145a/7.0.11-arch1-1/   # linux + initrd + initrd-fallback ✅
cat /efi/loader/entries/*.conf                                  # 2 entrées BLS, root=UUID correct ✅

# 7. Sortir et rebooter (retirer la clé USB !)
exit ; umount -R /mnt ; reboot
```

## Vérifications post-boot (toutes OK)

- `nvidia-smi` ✅ (GTX 1660, driver 580.159.04, Xorg dessus)
- `findmnt /efi` et `findmnt /var` ✅ (montés via UUID)
- `systemctl --failed` : voir dettes ci-dessous

## Dettes / TODO restants

- [ ] **Microcode Intel non chargé** — `journalctl -b | grep -i microcode` →
      `x86/CPU: Running old microcode`. Ni hook `microcode` dans mkinitcpio, ni `initrd
      /intel-ucode.img` dans les entrées BLS générées. Piège silencieux du
      [ch. 04 du grimoire](/grimoire-arch/guide/04-boot-moderne/).
      → sera réglé proprement par la migration boot vanilla.
- [ ] `dnsmasq.service` et `nftables.service` en **failed** au boot — pré-existant ? À diagnostiquer
      (`systemctl status dnsmasq nftables`).
- [ ] **Vestiges sur l'ESP** : `vmlinuz-linux`, `initramfs-linux*.img`, `intel-ucode.img` datés de
      nov. 2023 à la racine — à purger *après* quelques boots stables (piège
      [ch. 04](/grimoire-arch/guide/04-boot-moderne/) : jamais avant).
- [ ] **Surveiller `/var`** : docker 20G + cache pacman qui regonfle. Mettre en place
      `paccache.timer` (paquet `pacman-contrib`) et une limite journald (`SystemMaxUse=`).
- [ ] **Migration complète selon le grimoire** (prévue ~été 2026) :
      [ch. 01](/grimoire-arch/guide/01-audit-baseline/) baseline →
      [ch. 02](/grimoire-arch/guide/02-ext4-vers-btrfs/) BTRFS →
      [ch. 04](/grimoire-arch/guide/04-boot-moderne/) boot vanilla (virer
      `kernel-install-mkinitcpio` AUR, ESP sur `/boot`, hooks modernes
      `microcode`/`sd-vconsole`, presets plats) →
      [ch. 03](/grimoire-arch/guide/03-snapshots/) Timeshift BTRFS.

## Leçons

1. **Le nettoyage n'est pas du confort, c'est de la prévention de panne de boot** — exactement la
   thèse du [ch. 01 du grimoire](/grimoire-arch/guide/01-audit-baseline/) (audit & baseline avant
   tout). 26G de cache pacman accumulés ont cassé le boot.
2. **Signature de panne reconnaissable** (candidate au catalogue du
   [ch. 05](/grimoire-arch/guide/05-recuperation/)) : firmware → BIOS direct
   + `loader/entries/` vide avec mtime de l'update + `No space left on device` dans pacman.log
   = kernel-install interrompu après le remove, avant le add.
3. Un échec d'initramfs peut en cacher un autre : penser à vérifier **dkms** (`exited 10` dans le
   même log) — sinon reboot réussi mais écran noir au lancement de X.
4. SSH depuis le live (`passwd` + `systemctl start sshd`) transforme un dépannage pénible au clavier
   en session confortable avec copier-coller.