---
title: "03 — Snapshots"
---

## Objectif

Mettre en place des **snapshots automatiques avant chaque transaction pacman**, suppressions comprises,
de sorte qu'une mise à jour ou une désinstallation hasardeuse soit réversible. À la fin de ce chapitre,
chaque `pacman -S` **et** chaque `pacman -R` est précédé d'un snapshot BTRFS atomique, et un rollback
système ne fait pas perdre le travail récent.

Le *pourquoi* : le découpage en subvolumes (chapitre 2) n'a de valeur que s'il est exploité. Le snapshot
BTRFS est instantané et atomique (copy-on-write), donc « gratuit » à la création — on peut en prendre un
avant **chaque** opération pacman sans coût perceptible. C'est le vrai filet de sécurité du quotidien,
distinct du filet de migration (les entrées ext4) qui, lui, ne sert qu'une fois.

## Procédure

### 1. Installer Timeshift en mode BTRFS

Timeshift en mode BTRFS utilise directement les snapshots du système de fichiers (pas de copie rsync).
Il s'appuie sur la convention de subvolumes `@` / `@home` posée au chapitre 2. _(Selon Arch Wiki : Timeshift.)_

> _Note._ Installer Timeshift et la stack AUR suppose un système **déjà entièrement à jour** (chapitre 1).
> Le faire sur une base obsolète est précisément ce qui déclenche l'incident du chapitre 5. Un dépôt
> binaire AUR (type `chaotic-aur`) évite la compilation, mais ne dispense pas de la mise à jour préalable.

### 2. Snapshot automatique avant mise à jour

`timeshift-autosnap` est un hook pacman qui déclenche un snapshot **avant chaque `Upgrade`**.
Configuration adaptée à une machine d'expérimentation (`/etc/timeshift-autosnap.conf`) :

```
minHoursBetweenSnapshots=0   # pas de cooldown : un snapshot par transaction
maxSnapshots=10              # marge confortable, purge automatique au-delà
updateGrub=false             # on est en systemd-boot, pas GRUB (chapitre 4)
```

`updateGrub=false` est important : laisser `true` ferait échouer ou bruiterait le hook puisqu'il n'y a
pas de GRUB. _(Selon doc timeshift-autosnap.)_

### 3. Couvrir aussi les installations et les suppressions (hook custom)

Le hook officiel ne couvre que l'opération `Upgrade`. Or **installer un paquet neuf** (`Install`) et
**en désinstaller un** (`Remove`) sont des opérations distinctes qui passent donc **sans snapshot**. On
ajoute un hook pacman custom couvrant ces deux opérations :

```
# /etc/pacman.d/hooks/00-timeshift-autosnap-custom.hook
[Trigger]
Operation = Install
Operation = Remove
Type = Package
Target = *

[Action]
Description = Creating Timeshift snapshot before transaction...
Depends = timeshift
When = PreTransaction
Exec = /usr/bin/timeshift-autosnap
AbortOnFail
```

Points clés : les deux lignes `Operation` couvrent `Install` **et** `Remove` ; `Depends = timeshift`
garantit que le hook ne tourne pas si Timeshift est absent ; `AbortOnFail` **annule la transaction** si
le snapshot échoue (on n'installe/supprime jamais sans filet). _(Selon Arch Wiki : Pacman#Hooks, man alpm-hooks.)_

### 4. Régler ce qui est sauvegardé et ce qui est restauré

Dans `/etc/timeshift/timeshift.json`, deux réglages clés distincts :

```
include_btrfs_home_for_backup  = true    # /home capturé dans le snapshot
include_btrfs_home_for_restore = false   # /home jamais ramené par un rollback
```

Planification de fond conservée en complément des snapshots pacman (par ex. hourly 3, daily 3, weekly 2,
monthly 1, boot 3). _(Selon Arch Wiki : Timeshift.)_

### 5. Vérifier que ça se déclenche

Tester les deux chemins sur un paquet jetable :

```sh
pacman -S figlet   # paquet neuf → opération Install → hook custom
pacman -R figlet   # désinstallation → opération Remove → hook custom
```

Contrôler la présence des snapshots dans `/.snapshots/`.

## Décisions & pourquoi

### Pourquoi sauvegarder `/home` mais ne jamais le restaurer

Le couple `for_backup=true` / `for_restore=false` est délibéré : on **capture** `/home` dans le snapshot
(utile pour consulter un fichier d'un état antérieur), mais un rollback système ne **réécrit jamais**
`/home` — il ne ramène que `@` (le système). Ainsi, restaurer après une mise à jour ratée ne fait pas
perdre le travail produit entre-temps. C'est la traduction concrète de la séparation `@` / `@home` du
chapitre 2.

### Pourquoi un hook custom pour `Install` et `Remove`

Le hook officiel d'autosnap ne couvre que `Upgrade`. Mais une **installation** (dépendances tirées,
nouveaux fichiers de conf) comme une **désinstallation** (dépendances retirées) peuvent casser autant
qu'une mise à jour — et ce sont des opérations alpm distinctes (`Install`, `Remove`) que `Upgrade` ne
déclenche pas. Le hook custom referme ces deux angles morts pour le coût d'un snapshot atomique, et
`AbortOnFail` garantit qu'aucune transaction ne passe sans filet.

> Le choix de Timeshift en mode BTRFS (plutôt qu'un autre outil de snapshot) est une décision figée →
> voir `docs/adr/0004-snapshots-timeshift-btrfs.md`.

## Pièges

- **`updateGrub=true` sur un système systemd-boot** — le hook tente de régénérer un GRUB inexistant →
  bruit ou échec à chaque snapshot ; mettre `updateGrub=false`. _(Selon doc timeshift-autosnap.)_

- **Croire qu'un rollback ramène `/home`** — avec `for_restore=false`, le travail récent est préservé,
  ce qui est voulu ; mais il faut le savoir : `/home` n'est **pas** protégé par un rollback (seulement
  capturé). Pour protéger des données, c'est une **sauvegarde**, pas un snapshot, qu'il faut. _(Selon Arch Wiki : Timeshift#Limitations.)_

- **Ne couvrir que `Upgrade`** — les `pacman -S` (Install d'un paquet neuf) et `pacman -R` (Remove)
  passent alors sans filet ; le hook custom doit lister **les deux** opérations `Install` et `Remove`.
  Vérifier avec un install et une désinstallation de test que le snapshot est bien créé. _(retour d'expérience.)_

- **Hook sans `AbortOnFail`** — si le snapshot échoue, la transaction continue quand même, sans filet →
  ajouter `AbortOnFail` pour qu'un échec de snapshot annule l'opération. _(Selon man alpm-hooks.)_
