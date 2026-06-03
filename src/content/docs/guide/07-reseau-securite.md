---
title: "07 — Réseau & sécurité"
---

## Objectif

Mettre en place un **VPN full-tunnel avec killswitch**, un **agent GPG** fonctionnel avec pinentry
contextuel, et une **politique faillock** qui ne se retourne pas contre soi. À la fin de ce chapitre, le
trafic part chiffré (et se coupe si le tunnel tombe), GPG demande la passphrase au bon endroit selon le
contexte, et une rafale de mauvaises saisies ne verrouille pas le compte.

Le *pourquoi* : ces trois briques partagent un piège commun — elles peuvent **se verrouiller dehors**
(killswitch trop zélé, agent GPG muet, faillock punitif). On les configure donc en pensant d'abord au
mode dégradé : que se passe-t-il quand ça échoue.

## Procédure

### 1. VPN : WireGuard via wg-quick

Un seul mécanisme : `wg-quick`, pas NetworkManager (voir Décisions). Configuration full-tunnel avec
killswitch automatique :

```ini
# /etc/wireguard/<tunnel>.conf — chmod 600 — illustration
[Interface]
# AllowedIPs 0.0.0.0/0, ::/0 → tout le trafic dans le tunnel
# wg-quick génère un killswitch via fwmark quand AllowedIPs = tout
[Peer]
Endpoint = <serveur>:<port>
AllowedIPs = 0.0.0.0/0, ::/0
```

`wg-quick up <tunnel>` monte l'interface, route tout le trafic et installe le killswitch (fwmark) ; le
DNS bascule dans le tunnel au up et revient au down. _(Selon Arch Wiki : WireGuard, man wg-quick.)_
→ décision figée : `docs/adr/0008-vpn-wireguard-wg-quick.md`.

### 2. Cohabitation DNS NM ↔ wg-quick

Pour que NetworkManager et wg-quick ne se disputent pas le `resolv.conf`, configurer NM en
`rc-manager=resolvconf` et installer `openresolv` :

```
# /etc/NetworkManager/conf.d/rc-manager.conf
[main]
rc-manager=resolvconf
```

_(Selon Arch Wiki : openresolv, NetworkManager#DNS management.)_

### 3. Wrapper de contrôle (style titux)

Le pilotage quotidien passe par un script `~/.config/scripts/vpn` : action read-only par défaut (`--status`),
actions explicites (`--up`/`--down`/`--toggle`), `-v/--verbose`. Les commandes privilégiées passent par
une règle sudo NOPASSWD ciblée (voir Décisions). _(Convention scripts du dépôt.)_

### 4. GPG : agent + pinentry contextuel

Un dispatcher `~/.config/scripts/pinentry-auto` choisit `pinentry-gtk` si `$DISPLAY` est présent, sinon
`pinentry-curses` (utile en SSH) ; `gpg-agent.conf` pointe dessus. Un hook par shell rafraîchit le TTY de
l'agent (`gpg-connect-agent updatestartuptty /bye`). Le wrapper de contrôle s'appelle **`gpgctl`** — pas
`gpg` (voir Pièges). _(Selon Arch Wiki : GnuPG#pinentry, gpg-agent.)_

### 5. Politique faillock

`faillock` compte les échecs d'authentification. Sur un poste personnel, une politique trop stricte
verrouille le compte au mauvais moment ; on assume un compromis explicite (voir Décisions). _(Selon Arch Wiki : Security#Lockout policy, man pam_faillock.)_

## Décisions & pourquoi

### wg-quick plutôt que NetworkManager

NM et wg-quick **ne voient pas la même interface** et se désynchronisent quand on essaie de piloter le
tunnel des deux côtés. On tranche pour **un seul mécanisme** : wg-quick, natif, scriptable, avec
killswitch fwmark intégré. NM reste pour le réseau de base (Wi-Fi/Ethernet), pas pour le VPN.

### Ordre des règles sudo drop-in

Les fichiers de `/etc/sudoers.d/` sont lus en **ordre alphabétique**, et la **dernière** règle qui
matche gagne. Une règle `wheel ALL=(ALL:ALL) ALL` lue après une règle NOPASSWD ciblée **annule** cette
dernière. Solution : préfixer par des numéros (`01-wheel`, `02-<tunnel>`) pour que la règle spécifique
soit lue en dernier. Permissions `440`. _(Selon man sudoers.)_

### faillock désamorcé sur un poste personnel

Après un lock-out temporaire (deny=3, 600 s) sur rafale de mauvaises saisies, on pose `deny=0` dans
`/etc/security/faillock.conf` : sur une machine mono-utilisateur, le risque d'un verrouillage accidentel
dépasse le bénéfice anti-bruteforce local. Compromis **assumé et documenté**.

### gpgctl, jamais gpg

Nommer le wrapper `gpgctl` et non `gpg` : un script nommé `gpg` dans le `PATH` masquerait
`/usr/bin/gpg` et provoquerait une récursion infinie quand le wrapper appelle le vrai binaire. Règle
générale : ne jamais nommer un wrapper comme le binaire qu'il enrobe.

## Pièges

- **NM et wg-quick pilotant le même tunnel** — interfaces désynchronisées, DNS incohérent → un seul
  mécanisme (wg-quick), NM en `rc-manager=resolvconf` pour le DNS. _(retour d'expérience.)_

- **Règle sudo NOPASSWD écrasée par `wheel`** — lue avant dans l'ordre alphabétique, la règle générale
  `wheel` reprend la main → numéroter les drop-in pour que la règle ciblée soit lue en dernier. _(retour d'expérience — voir man sudoers.)_

- **Lock-out faillock alors que le mot de passe est bon** — `su - <user>` accepte mais `sudo` refuse :
  c'est faillock, pas le mot de passe → `faillock --user <user> --reset`, puis `deny=0` pour ne plus
  jamais se faire piéger. _(retour d'expérience.)_

- **`RELOADAGENT` ne vide pas le cache de passphrase** — seul `gpgconf --kill gpg-agent` le purge
  réellement ; `RELOADAGENT` recharge la config mais garde le cache. _(retour d'expérience.)_

- **Toggle VPN qui oscille** — évaluer l'état du tunnel **deux fois** (avant et après) le fait basculer
  down-puis-up → capturer l'état **une seule fois** (`case $?`) au début du toggle. _(retour d'expérience.)_

- **Wrapper nommé comme le binaire** — un script `gpg` dans le PATH masque `/usr/bin/gpg` → récursion ; nommer `gpgctl`. _(retour d'expérience.)_
