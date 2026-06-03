---
title: "04 — Boot moderne"
---

## Objectif

Mettre en place un boot **simple, vanilla et robuste** : ESP montée sur `/boot`, initramfs générés par
mkinitcpio en convention standard (paths plats), microcode CPU embarqué dans l'initramfs, et entrées
systemd-boot au format BLS — sans aucune dépendance exotique sur le chemin critique. À la fin de ce
chapitre, le système boote sur BTRFS, le microcode est appliqué tôt, et les entrées ext4 du filet de
sécurité restent sélectionnables.

Le *pourquoi* : le boot est le maillon où une config « maligne » se paie au pire moment. La convention
Arch vanilla est la mieux documentée et la plus réparable ; tout écart (presets exotiques, paquets AUR
sur le workflow boot) ajoute une dette latente qui n'explose que des semaines plus tard.

## Procédure

### 1. Monter l'ESP sur `/boot`

La convention moderne (kernel-install) attend l'ESP sur `/boot`, pas sur `/efi`. C'est ce qui marche
out-of-the-box sur les installs récentes :

```sh
# Illustration — bascule depuis un ancien /efi
umount /efi
mv /boot /boot.old        # vestiges initramfs à purger ensuite
mkdir /boot && mount <ESP> /boot
sed -i 's|/efi|/boot|g' /etc/fstab
```

_(Selon Arch Wiki : systemd-boot#ESP, EFI system partition.)_

### 2. Configurer mkinitcpio (HOOKS modernes)

Le jeu de hooks doit être à jour. Points clés :

```
HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block lvm2 btrfs filesystems fsck)
```

- `microcode` embarque le microcode CPU dans l'early-CPIO (remplace l'ancien `initrd /…-ucode.img`).
- `sd-vconsole` remplace `keymap consolefont` quand on utilise le hook `systemd`.
- `udev` est **retiré** : il est redondant avec `systemd`.
- `lvm2` et `btrfs` sont **tous deux** présents si le BTRFS est sur LVM (lvm2 expose le LV, btrfs le monte).
- L'**ordre compte** : `autodetect` doit précéder `microcode`.

_(Selon Arch Wiki : mkinitcpio#Common hooks, Microcode.)_

### 3. Presets vanilla + initramfs à plat

Utiliser les presets standard (`/usr/share/mkinitcpio/hook.preset` comme modèle), avec fallback, et des
chemins **plats** :

```
ALL_kver="/boot/vmlinuz-linux"
PRESETS=('default' 'fallback')
default_image="/boot/initramfs-linux.img"
fallback_image="/boot/initramfs-linux-fallback.img"
```

Copier les `vmlinuz` canoniques vers `/boot/vmlinuz-<pkgbase>`, puis régénérer : `mkinitcpio -P`.
_(Selon Arch Wiki : mkinitcpio#Image creation and activation.)_

### 4. Entrées systemd-boot (BLS)

Chaque entrée BLS pointe le **filesystem par son UUID** et le bon subvolume :

```
# /boot/loader/entries/arch-btrfs.conf — illustration
title    Arch Linux (BTRFS)
linux    /vmlinuz-linux
initrd   /initramfs-linux.img
options  root=UUID=<btrfs> rootflags=subvol=@ rw
```

On **ajoute** les entrées BTRFS sans supprimer les entrées ext4 d'origine (filet de sécurité, chapitre 2),
puis on règle le défaut et le timeout dans `loader.conf`. `bootctl update` met à jour le binaire
systemd-boot sur l'ESP. _(Selon Arch Wiki : systemd-boot, Boot loader specification.)_

## Décisions & pourquoi

### Trois décisions de boot indépendantes — à ne pas mélanger

Une source fréquente de confusion : **bootloader**, **générateur d'initramfs** et **orchestrateur
d'install kernel** sont trois choix orthogonaux.

| Décision | Choix ici | Indépendant de… |
|---|---|---|
| Bootloader | systemd-boot | du générateur d'initramfs |
| Générateur d'initramfs | mkinitcpio | du bootloader |
| Orchestrateur d'install kernel | alpm-hook classique (vanilla) | des deux autres |

systemd-boot lit **n'importe quels** chemins dans les entrées BLS : le layout `/<machine-id>/<kver>/`
n'est qu'une convention d'organisation, pas une exigence. Mélanger ces trois axes (comme le fait un
certain paquet AUR, voir Pièges) crée des configs fragiles. → ADR `0002-bootloader-systemd-boot.md`,
`0005-esp-sur-boot-mkinitcpio-vanilla.md`.

### machine-id ≠ UUID de filesystem

Deux identifiants à ne pas confondre :

- **machine-id** identifie l'**installation OS** (vit dans `/etc/machine-id`) — cosmétique pour un setup
  mono-OS, sert à organiser des sous-dossiers de boot.
- **UUID de filesystem** identifie le **système de fichiers** dans son superblock — c'est lui, dans
  `options root=UUID=…`, qui protège contre la réattribution des `/dev/sd*` (utile sur machine multi-disques).

Les entrées BLS doivent référencer l'**UUID de filesystem**, jamais un `/dev/sdX` ni le machine-id.

### Microcode via le hook mkinitcpio

Le hook `microcode` embarque le microcode dans chaque initramfs automatiquement : plus de fichier
`-ucode.img` séparé à référencer, donc plus de risque d'oublier la ligne `initrd ucode` dans une nouvelle
entrée. Vérifiable au boot (`journalctl -b | grep microcode` → ligne `Updated early from: …`).

## Pièges

- **Paquet AUR `kernel-install-mkinitcpio` sur un setup mono-OS** — il génère des presets au format
  **ESP-relatif** (`/<machine-id>/<kver>/linux`) qui plantent en invocation directe de mkinitcpio
  (`ERROR: … must be readable`). Le bug est **latent** tant que kernel-install passe `-k` explicitement,
  puis casse au premier `mkinitcpio -P` direct → désinstaller le paquet, revenir aux **presets vanilla**
  à chemins plats. _(retour d'expérience — voir aussi Arch Wiki : mkinitcpio.)_

- **Microcode non chargé sans s'en rendre compte** — si aucune entrée BLS ne référence le microcode (ni
  hook `microcode`, ni `initrd /…-ucode.img`), le CPU tourne sans patchs : silencieux mais bien réel →
  contrôler `journalctl -b | grep microcode`. _(retour d'expérience.)_

- **`udev` ET `systemd` dans les HOOKS** — redondance qui peut bruiter ou ralentir → n'en garder qu'un
  (`systemd` inclut udev). _(Selon Arch Wiki : mkinitcpio#Common hooks.)_

- **Entrée BLS sans `rootflags=subvol=@`** — le noyau monte le top-level BTRFS comme racine, l'init
  échoue → toute entrée BTRFS doit porter `root=UUID=… rootflags=subvol=@`. _(Selon Arch Wiki : Btrfs#Mounting subvolumes.)_

- **Supprimer `/boot.old` ou les vestiges trop tôt** — purger les anciens initramfs/sous-dossiers
  seulement **après** un reboot réussi sur la nouvelle stack, jamais avant. _(retour d'expérience.)_
