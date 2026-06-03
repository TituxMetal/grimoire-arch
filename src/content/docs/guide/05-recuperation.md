---
title: "05 — Quand ça casse : récupération"
---

## Objectif

Se donner une **boîte à outils de récupération** et un **catalogue de pièges reconnaissables** pour
réparer un système qui ne boote plus ou dont pacman est cassé — sans tout réinstaller. À la fin de ce
chapitre, on sait chrooter depuis un live USB, distinguer un méta-paquet légitime d'une vraie corruption,
repérer une décommentation `sed` silencieusement ratée, et trancher chaque `.pacnew` sans dégât.

Le *pourquoi* : sur un système en retard, une mise à jour mal séquencée peut casser des briques aussi
fondamentales que PAM (donc `sudo`, `su`, `loginctl`). Connaître la procédure de chroot et les
signatures des pannes typiques transforme une panique « tout réinstaller » en réparation de dix minutes.

## Procédure

### 1. Chroot depuis un live USB

La procédure de base pour réparer un système BTRFS-sur-LVM injoignable :

```sh
# Illustration — depuis un live Arch
vgchange -ay                                   # activer les LV (si LVM)
mount -o subvol=@ <btrfs> /mnt                 # racine
mount -o subvol=@home <btrfs> /mnt/home        # + les autres subvolumes utiles
mount <ESP> /mnt/boot
arch-chroot /mnt
```

`arch-chroot` gère les bind-mounts de `/dev`, `/proc`, `/sys`, `/run`. Une fois dans le chroot, pacman,
mkinitcpio et bootctl sont de nouveau utilisables sur le système cible. _(Selon Arch Wiki : chroot, Arch-chroot.)_

### 2. Réparer une bibliothèque manquante qui casse PAM

Symptôme typique : `sudo`/`su`/`systemctl` cassés alors que `bash` fonctionne encore — une lib chargée
par PAM (ex. `libgcc_s.so.1`) manque. Diagnostic et fix depuis le chroot :

```sh
pacman -Qkk <paquet>                       # vérifier l'intégrité des fichiers du paquet
pacman -S --overwrite '/usr/lib/<lib>*' <paquet>   # réinstaller proprement
```

_(Selon Arch Wiki : Pacman#Troubleshooting, GnuPG/keyring si la signature est en cause.)_

### 3. Vérifier le résultat, toujours

La plupart des réparations échouent **silencieusement**. Après chaque opération sensible, contrôler :
locale (`locale -a`), microcode (`journalctl -b | grep microcode`), montages (`findmnt`), services
(`systemctl --failed`). Une commande qui « dit que c'est bon » n'est pas une preuve que ça l'est.

## Décisions & pourquoi

### Pourquoi `pacman -Syu` complet, jamais `-Sy` partiel

Un `-Sy` met à jour la base de données sans les paquets : le système se retrouve à référencer des
versions que les miroirs ne servent plus → 404, dépendances incohérentes, paquet en cache corrompu. Sur
un système en retard, la règle est absolue : **mise à jour complète d'abord** (keyring si nécessaire,
puis `-Syu`), nettoyage et migration **ensuite**. _(Selon Arch Wiki : System maintenance#Partial upgrades are unsupported.)_

## Pièges

- **Paquet « vide » à 2-3 Ko pris pour une corruption** — un paquet « important » qui pèse 2-3 Ko après
  téléchargement peut être un **méta-paquet légitime** (cas d'un `gcc-libs` splitté upstream, dont le
  contenu a migré vers d'autres paquets). Vérifier avec `tar -tf` : si le contenu n'est que `.PKGINFO`,
  `.MTREE`, `.BUILDINFO` → méta-paquet normal, ne pas purger ; sinon → vraie corruption (souvent une
  réponse HTTP d'erreur d'un miroir enregistrée comme fichier), à virer du cache et re-télécharger.
  _(retour d'expérience.)_

- **Confondre le méta-paquet et le paquet qui porte la lib** — réinstaller le méta-paquet vide ne ramène
  pas la bibliothèque ; c'est le paquet **enfant** (celui qui contient réellement le `.so`) qu'il faut
  réinstaller. Identifier le bon paquet avant d'agir (`pacman -Fx` / `pacman -Qo`). _(retour d'expérience.)_

- **`sed` de décommentation silencieusement raté** — un pattern ancré (`…$`) ne matche pas si la ligne a
  des **espaces traînants** : le `sed` ne change rien, sans erreur, et un `locale-gen` peut afficher
  « Generation complete » **sans rien générer**. Décommenter robustement et vérifier :

  ```sh
  sed -i -E 's/^#(<motif>)[[:space:]]*$/\1/' <fichier>
  grep -nE '^[^#]' <fichier>      # confirmer que la ligne est bien décommentée
  ```

  _(retour d'expérience.)_

- **Fusionner un `.pacnew` qui est un template d'install** — `passwd.pacnew`, `group.pacnew`,
  `shadow.pacnew` (paquet `filesystem`) ne contiennent souvent qu'**une ligne** : les fusionner écrase
  les comptes système et utilisateurs réels → **toujours DROP**. À reconnaître par leur petite taille
  vs le fichier actif. _(Selon Arch Wiki : Pacman/Pacnew and Pacsave.)_

- **`.pacnew` réseau/miroirs fusionnés par réflexe** — `mirrorlist.pacnew` (si on gère les miroirs via
  reflector) → DROP ; `hosts.pacnew` → DROP par défaut (sinon perte des mappings réseau locaux). Trancher
  chaque `.pacnew` au cas par cas, pas en bloc. _(Selon Arch Wiki : Pacman/Pacnew and Pacsave.)_

- **Régénérer l'initramfs au mauvais moment** — regénérer pendant qu'une lib critique manque produit un
  initramfs cassé et un kernel panic au reboot → réparer d'abord, régénérer ensuite. _(retour d'expérience.)_

> Le **filet de sécurité ext4** (chapitre 2) reste la sortie ultime : si la réparation traîne, rebooter
> sur une entrée BLS ext4 d'origine rend la main immédiatement, le temps de diagnostiquer à froid.
