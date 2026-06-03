---
title: "02 — ext4 → BTRFS à subvolumes"
---

## Objectif

Migrer une racine existante en ext4 vers un BTRFS découpé en **subvolumes**, sans destruction et avec
un **retour arrière en un clic**. À la fin de ce chapitre, le système boote sur BTRFS, les données
chaudes (`/`, `/home`, `/var`) vivent dans des subvolumes distincts adaptés aux snapshots, et l'ancienne
install ext4 reste intacte comme filet de sécurité tant que le nouveau layout n'a pas fait ses preuves.

Le *pourquoi* du chantier : BTRFS apporte les snapshots atomiques (chapitre 3) et la compression
transparente. Mais ces bénéfices ne valent que si le **découpage en subvolumes** est pensé en amont —
un BTRFS monolithique snapshote tout en bloc, y compris ce qu'on ne veut surtout pas restaurer (logs,
caches). Le découpage est la vraie décision de ce chapitre ; le reste est de la plomberie.

## Procédure

La migration suit une logique **non destructive** : on construit le BTRFS *à côté* de l'ext4 existant,
on y recopie le système, on bascule le boot dessus, et on garde l'ancien démarrable. Aucune étape
n'écrase l'install d'origine.

### 1. Créer le volume cible

L'install de référence est sur **LVM** : on taille un nouveau logical volume dans l'espace libre du
groupe, puis on le formate en BTRFS.

```sh
# Illustration — adapter la taille et les noms au système réel
lvcreate -L 100G -n btrfs_root <vg>
mkfs.btrfs -L ARCHBTRFS /dev/<vg>/btrfs_root
```

> **Généralisation hors LVM.** Sans gestionnaire de volumes, le volume cible est une **partition**
> (créée dans l'espace libre du disque) au lieu d'un LV : `mkfs.btrfs -L ARCHBTRFS /dev/sdaN`. La suite
> est identique, à deux exceptions près signalées plus bas (hook `lvm2`, options de montage).

Chaque BTRFS reçoit un **UUID** propre à sa création. C'est cet UUID — pas le nom du device — qui sera
référencé dans `fstab` et les entrées de boot. _(Selon Arch Wiki : Btrfs.)_

### 2. Créer les subvolumes

On monte le top-level du BTRFS (`subvolid=5`) puis on crée les subvolumes. Le layout retenu :

```
@           → /                         (système, snapshoté et restaurable)
@home       → /home                     (données utilisateur)
@snapshots  → /.snapshots               (cible Timeshift)
@var-log    → /var/log                  (volatil, hors snapshot de @)
@var-cache  → /var/cache                (volatil)
@var-tmp    → /var/tmp                  (volatil)
@pkg        → /var/cache/pacman/pkg     (cache paquets, volumineux et reconstructible)
```

La convention `@`-préfixée est celle attendue par Timeshift en mode BTRFS. _(Selon Arch Wiki : Btrfs#Subvolumes, Timeshift.)_

### 3. Recopier le système

`rsync` copie l'existant vers les subvolumes montés. **Les pseudo-systèmes de fichiers doivent être
exclus** — les recopier corrompt la cible (voir Pièges) :

```sh
# Illustration — exclure /proc /sys /dev /tmp /run ; copier /, /home, /var séparément
rsync -aAXH --exclude={'/proc/*','/sys/*','/dev/*','/tmp/*','/run/*'} / /mnt/@/
```

Les drapeaux `-aAXH` préservent attributs étendus, ACL et liens durs — indispensable pour un système
de fichiers racine. _(Selon man rsync ; Arch Wiki : Rsync#Full system backup.)_

### 4. Générer le fstab BTRFS

Chaque ligne pointe le **même UUID** (celui du BTRFS) avec un `subvol=` différent et les options de
montage communes :

```
UUID=<btrfs>  /                    btrfs  rw,noatime,compress=zstd:3,space_cache=v2,ssd,discard=async,subvol=@         0 0
UUID=<btrfs>  /home                btrfs  …,subvol=@home        0 0
UUID=<btrfs>  /.snapshots          btrfs  …,subvol=@snapshots   0 0
UUID=<btrfs>  /var/log             btrfs  …,subvol=@var-log     0 0
# … idem pour @var-cache, @var-tmp, @pkg
```

Le rationale de chaque option de montage est détaillé en **Décisions & pourquoi**. _(Selon Arch Wiki : Btrfs#Mount options, fstab.)_

### 5. Régénérer l'initramfs

L'initramfs doit savoir monter du BTRFS : ajouter le hook `btrfs` dans `mkinitcpio.conf`. **Si le BTRFS
est sur LVM**, le hook `lvm2` reste indispensable (il vient *avant*, pour exposer le LV) :

```
# /etc/mkinitcpio.conf — illustration
HOOKS=(… block lvm2 btrfs filesystems fsck)
```

Puis régénérer : `mkinitcpio -P`. _(Selon Arch Wiki : mkinitcpio#HOOKS, Btrfs#Configuration.)_

> **Hors LVM** : retirer `lvm2` des hooks ; `btrfs` suffit.

### 6. Basculer le boot — en gardant l'ext4

C'est l'étape qui crée le **filet de sécurité**. On **ajoute** deux entrées BLS pour le BTRFS
(`*-btrfs.conf`) sans toucher aux **quatre entrées ext4 d'origine**, et on pointe le défaut de
`loader.conf` vers BTRFS :

```
# /boot/loader/entries/arch-btrfs.conf — illustration
options root=UUID=<btrfs> rootflags=subvol=@ rw
```

Le détail du layout de boot (ESP-on-`/boot`, mkinitcpio vanilla, BLS) est traité au **chapitre 4** ;
ici on retient seulement que l'ext4 reste démarrable. _(Selon Arch Wiki : systemd-boot, Boot loader specification.)_

## Décisions & pourquoi

### Pourquoi ce découpage en subvolumes

Le principe directeur : **un subvolume = une politique de snapshot**. On sépare `@` de `@home` pour
qu'un rollback du système (chapitre 3) ne ramène **pas** les données utilisateur à un état antérieur —
on veut pouvoir restaurer `/` après une mise à jour ratée sans perdre le travail récent. Les subvolumes
`@var-log`, `@var-cache`, `@var-tmp` et `@pkg` isolent du **volatil reconstructible** : les inclure dans
les snapshots de `@` les gonflerait inutilement et restaurerait des logs/caches périmés au rollback.
`@snapshots` est plat (`/.snapshots`) parce que c'est la cible attendue par Timeshift.

### Pourquoi ces options de montage

| Option | Raison |
|---|---|
| `noatime` | Supprime les écritures d'horodatage d'accès — gain net avec le CoW et les snapshots (chaque atime modifié = nouvelle extent). |
| `compress=zstd:3` | Compression transparente. Le niveau 3 est le compromis ratio/CPU : utile sur stockage limité, coût CPU contenu même sur processeur modeste. |
| `space_cache=v2` | Arbre de cache d'espace libre nouvelle génération, plus fiable et performant que v1 sur gros volumes. |
| `ssd` | Active les heuristiques d'allocation SSD (souvent autodétecté ; explicite ici). |
| `discard=async` | TRIM asynchrone, en arrière-plan — préféré au `discard` synchrone (qui pénalise chaque suppression) ; alternative valable : `fstrim.timer` périodique sans option `discard`. |

_(Selon Arch Wiki : Btrfs#Mount options, SSD/Memory cell clearing.)_

### Pourquoi conserver l'ext4 (filet de sécurité)

Les anciens volumes ext4 et leurs **quatre entrées BLS** restent en place. Si le BTRFS échoue au boot
ou se révèle instable, on rebascule sur l'install d'origine **en un clic** dans le menu systemd-boot,
sans live USB. La suppression de ce filet est **hors périmètre de ce guide** : elle relève d'une phase
ultérieure, conditionnée à plusieurs semaines de stabilité BTRFS confirmée.

### Décisions figées renvoyées aux ADR

- Le choix **Timeshift en mode BTRFS** (qui motive `@snapshots` et le découpage) → voir
  `docs/adr/0004-snapshots-timeshift-btrfs.md` et le chapitre 3.
- Le layout de boot **ESP-on-`/boot` + mkinitcpio vanilla** → voir
  `docs/adr/0005-esp-sur-boot-mkinitcpio-vanilla.md` et le chapitre 4.

## Pièges

- **rsync recopie `/proc`, `/sys`, `/dev`, `/run` ou `/tmp`** — la cible devient incohérente, voire le
  device s'épuise en recopiant des pseudo-fichiers → **exclure explicitement** ces points de montage,
  et copier `/`, `/home`, `/var` comme arborescences distinctes. _(Selon Arch Wiki : Rsync#Full system backup.)_

- **Hook `btrfs` oublié dans `mkinitcpio.conf`** — l'initramfs ne sait pas monter le subvolume racine,
  le système ne boote pas (drop dans l'emergency shell) → ajouter `btrfs` aux `HOOKS`, **garder `lvm2`
  si le BTRFS est sur LV**, puis `mkinitcpio -P`. _(Selon Arch Wiki : mkinitcpio#HOOKS.)_

- **`subvol=` absent d'une ligne fstab** — le point de montage reçoit le **top-level** (`subvolid=5`) au
  lieu du subvolume voulu : on voit alors *tous* les subvolumes empilés sous ce point → vérifier que
  chaque ligne porte son `subvol=@…` et contrôler avec `findmnt` / `btrfs subvolume list /` après reboot.
  _(Selon Arch Wiki : Btrfs#Mounting subvolumes.)_

- **`root=` pointe le LV mais `rootflags=subvol=@` manque dans l'entrée BLS** — le noyau monte le
  top-level en racine, l'init échoue → l'entrée doit porter `root=UUID=<btrfs> rootflags=subvol=@`.
  _(Selon Arch Wiki : systemd-boot#Adding loaders.)_

- **Conflit `gcc-libs` / `libgcc` pendant l'installation de la stack post-migration** _(retour
  d'expérience)_ — sur un système très en retard, le split du paquet `gcc-libs` n'est pas anticipé et
  `pacman` refuse d'écraser `libgcc_s.so*` → contournement `--overwrite '/usr/lib/libgcc_s.so*'`. Le
  réflexe de fond reste : **mettre le système complètement à jour *avant* la migration FS** (voir
  chapitre 1 et le catalogue du chapitre 5), pas pendant.

> **Leçon portable.** Le découpage en subvolumes et la logique de filet de sécurité valent
> indépendamment du gestionnaire de volumes : seule la création du volume cible et le hook `lvm2`
> changent entre une install LVM et une install sur partitions nues.