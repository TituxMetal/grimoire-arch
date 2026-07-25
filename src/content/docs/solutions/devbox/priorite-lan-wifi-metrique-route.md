---
title: "Devbox — Priorité LAN sur WiFi par métrique de route"
type: solution
date: 2026-07-16
domain: devbox / réseau
component: systemd-networkd / RouteMetric
symptoms:
  - "LAN et WiFi tous les deux up : pas de priorité garantie sur la route par défaut"
  - "ip route show default → les deux interfaces à metric 1024"
root_cause: "systemd-networkd n'avait pas de RouteMetric explicite ; égalité de métrique DHCP → le noyau ne privilégie pas enp6s0"
severity: low
status: resolved
---

> **Statut : clos, résolu le 2026-07-16. Modifications effectuées sur devbox.**

## Problème

Avec LAN et WiFi tous les deux up, le noyau doit choisir une route par défaut. La sélection se fait
sur la métrique : la plus basse gagne. Il fallait s'assurer que le LAN (`enp6s0`) soit prioritaire
sur le WiFi (`wlan0`).

## Diagnostic

```bash
ip route show default
# → les deux à metric 1024 = égalité, pas de priorité garantie
```

Les fichiers systemd-networkd existaient déjà :
- `/etc/systemd/network/10-enp6.network`
- `/etc/systemd/network/25-wireless.network`

## Solution

Ajout de `RouteMetric` dans les deux fichiers :

**`/etc/systemd/network/10-enp6.network`** :
```ini
[Match]
Name=enp6s0

[Network]
DHCP=yes

[DHCPv4]
RouteMetric=100

[IPv6AcceptRA]
RouteMetric=100
```

**`/etc/systemd/network/25-wireless.network`** :
```ini
[Match]
Name=wlan0

[Network]
DHCP=yes

[DHCPv4]
RouteMetric=600

[IPv6AcceptRA]
RouteMetric=600
```

Puis `sudo systemctl restart systemd-networkd`.

## Résultat

```
default via 192.168.0.1 dev enp6s0 proto dhcp src 192.168.0.10 metric 100
default via 192.168.0.1 dev wlan0 proto dhcp src 192.168.0.101 metric 600
```

LAN prioritaire (100 < 600).

## À savoir pour les autres machines

| Gestionnaire réseau | Où configurer la métrique |
|---|---|
| **NetworkManager** | `nmcli connection modify "NomConnexion" ipv4.route-metric 100` |
| **systemd-networkd** | `[DHCPv4] RouteMetric=100` dans le fichier `.network` |
| **Netplan** | `dhcp4-overrides: { route-metric: 100 }` dans le YAML |
| **/etc/network/interfaces** | `metric 100` dans la stanza `iface` |
| **Manuel (non persistant)** | `ip route replace default via <gw> dev <iface> metric 100` |

Note : la commande `ip route replace` ne survit ni au reboot ni au renouvellement DHCP.

## Incident collatéral

Après un reboot, l'interface LAN était en `NO-CARRIER` / `state DOWN` : le switch avait
probablement trop chaud. Débrancher/rebrancher le switch a suffi, l'IP est revenue
immédiatement.

## Reste à faire

Rien — c'est réglé et persistant via systemd-networkd.
