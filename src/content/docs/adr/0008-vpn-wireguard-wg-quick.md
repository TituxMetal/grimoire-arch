---
title: "ADR 0008 — VPN : WireGuard wg-quick + killswitch"
---

- Statut : accepté
- Chapitre lié : 7

## Contexte

Le poste a besoin d'un VPN full-tunnel avec coupure du trafic si le tunnel tombe (killswitch).
NetworkManager et wg-quick ne voient pas la même interface et se désynchronisent quand on pilote le
tunnel des deux côtés.

## Décision

Utiliser **un seul mécanisme : `wg-quick`** (pas NetworkManager pour le VPN). Config full-tunnel
(`AllowedIPs = 0.0.0.0/0, ::/0`) avec **killswitch fwmark** généré par wg-quick, et `openresolv` +
NM en `rc-manager=resolvconf` pour la cohabitation DNS. Pilotage via un wrapper `~/.config/scripts/vpn` (voir ADR 0013).

## Conséquences

- Tunnel scriptable et reproductible ; le DNS bascule dans le tunnel au up, revient au down.
- NM reste pour le réseau de base (Wi-Fi/Ethernet), pas pour le VPN.
- Les commandes privilégiées passent par une règle sudo NOPASSWD ciblée, dont l'ordre de lecture des
  drop-in doit être maîtrisé (chapitre 7).

## Alternatives considérées

- **VPN via NetworkManager** : incompatibilité de pilotage hybride avec wg-quick → écarté.
- **OpenVPN** : non retenu (WireGuard plus simple, plus performant, killswitch natif via fwmark).
