---
title: "01 — Audit & baseline"
---

## Objectif

Avant toute migration de système de fichiers, **assainir l'install existante** et se doter d'une
**méthode de mesure reproductible**. À la fin de ce chapitre, le système est débarrassé de son poids
mort (paquets inutiles, caches, services qui ralentissent le boot, entrées EFI zombies), une sauvegarde
des points sensibles existe, et on dispose d'un point de comparaison chiffré pour prouver les gains des
étapes suivantes.

Le *pourquoi* : une migration FS recopie l'existant. Migrer un système encombré ou obsolète, c'est
recopier l'encombrement et hériter de ses pannes latentes. On part donc d'une base propre **et** à jour
— c'est aussi à ce stade qu'on installe le réflexe qui évitera la moitié des incidents : mise à jour
complète **avant** toute manipulation lourde.

## Procédure

### 1. Relever l'état initial

Inventorier ce qu'on s'apprête à migrer : table des volumes (`lsblk -f`, `vgs`/`lvs` si LVM), espace
libre, services activés, et le temps de boot de référence. C'est ce relevé qui rend les gains mesurables.
_(Selon Arch Wiki : General recommendations.)_

### 2. Mesurer le boot (méthode de référence)

`systemd-analyze` donne le total ; `blame` et `critical-chain` identifient **qui** coûte du temps :

```sh
systemd-analyze                 # total firmware → userspace
systemd-analyze blame           # services classés par durée
systemd-analyze critical-chain  # chemin critique réel
```

On mesure **avant** nettoyage, **après** nettoyage, puis après chaque étape de migration. Un gain n'a de
sens que comparé à une baseline relevée dans les mêmes conditions. _(Selon man systemd-analyze.)_

> _Retour d'expérience._ Sur le matériel de référence, le seul nettoyage (services + caches) a réduit le
> boot d'environ 40 %, l'essentiel venant du masquage d'un service d'attente réseau (voir étape 4).
> Ce chiffre **n'est pas universel** : il dépend du matériel et de ce qui était activé.

### 3. Alléger le système

- Désinstaller les paquets inutilisés et purger les **orphelins** (`pacman -Qdtq` → `pacman -Rns`).
- Vider le **cache pacman** (`paccache -r`, ou plus agressif avant migration) — il peut peser plusieurs Go.
- Réduire les **journaux systemd** (`journalctl --vacuum-size=…`).

_(Selon Arch Wiki : Pacman#Cleaning the package cache, systemd/Journal.)_

### 4. Désactiver ce qui ralentit ou ne sert pas

- **Masquer** un service d'attente réseau bloquant au boot s'il n'est pas nécessaire
  (`systemctl mask systemd-networkd-wait-online.service`) — souvent plusieurs secondes gagnées.
- Désactiver les services dormants (`bluetooth.service` si non utilisé).
- Supprimer les reliquats réseau (ponts `br0` d'anciens tests, par ex.).

_(Selon Arch Wiki : systemd#Using units, Improving performance/Boot process.)_

### 5. Nettoyer la NVRAM EFI

Les entrées de boot mortes (anciens bootloaders, `BOOTX64` sans cible) encombrent le firmware et
brouillent le diagnostic plus tard :

```sh
efibootmgr            # lister
efibootmgr -B -b XXXX # supprimer une entrée zombie
```

_(Selon Arch Wiki : Unified Extensible Firmware Interface#efibootmgr.)_

### 6. Sauvegarder les points sensibles

Avant de toucher au FS, archiver au minimum `/etc`, l'ESP (`/boot`), les **listes de paquets**
(`pacman -Qqe`, `-Qqen`, `-Qqem`) et les dotfiles. Ces listes serviront aussi de diff de contrôle après
migration. _(Selon Arch Wiki : Pacman/Tips and tricks#Backing up and retrieving a list of installed packages.)_

## Décisions & pourquoi

### Mettre à jour complètement avant toute autre opération

Sur un système substantiellement en retard, faire le **`pacman -Syu` complet d'abord**, puis le
nettoyage, puis la migration FS. Inverser l'ordre (installer des outils ou migrer sur une base obsolète)
expose à des désynchronisations base/miroirs et à des paquets en cache corrompus dont les conséquences
se paient bien plus tard (voir chapitre 5). C'est la leçon n°1 de tout le chantier.

### Masquer plutôt que désactiver un service bloquant

`mask` empêche tout réveil par dépendance, là où `disable` laisse un autre service le rallumer. Pour un
service d'attente réseau qui bloque le boot sans utilité ici, le masquage est le bon outil. _(Selon Arch Wiki : systemd#Using units.)_

## Pièges

- **`pacman -Sy` partiel au lieu de `-Syu` complet** — sur un système en retard, met à jour la base de
  données sans les paquets : désynchronisation, 404 sur les miroirs, dépendances cassées → toujours
  `pacman -Syu` complet. Détail des dégâts possibles au chapitre 5. _(Selon Arch Wiki : System maintenance#Partial upgrades are unsupported.)_

- **Nettoyer le cache pacman *avant* d'avoir une base saine** — si une réparation s'avère nécessaire
  juste après, les anciennes versions ne sont plus disponibles localement → ordonner : mise à jour
  complète, *puis* nettoyage du cache. _(Selon Arch Wiki : Pacman#Cleaning the package cache.)_

- **Mesurer le boot sans baseline comparable** _(retour d'expérience)_ — un chiffre isolé ne prouve
  rien ; relever le total **et** le chemin critique avant/après, dans les mêmes conditions, sinon les
  « gains » ne sont pas attribuables.
