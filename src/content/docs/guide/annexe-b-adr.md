---
title: "Annexe B — Décisions d'architecture (index ADR)"
---

Les décisions structurantes du chantier sont consignées comme **ADR** (Architecture Decision Records)
dans `docs/adr/`, un fichier par décision, au format **Contexte → Décision → Conséquences →
Alternatives**. Ce sont des **contraintes posées au départ** : à respecter, ne pas proposer
d'alternatives sans raison forte.

| ADR | Décision | Chapitre lié |
|---|---|---|
| [0001](/grimoire-arch/adr/0001-login-manager-ly/) | Login manager : **Ly** (jamais LightDM) | 6 |
| [0002](/grimoire-arch/adr/0002-bootloader-systemd-boot/) | Bootloader : **systemd-boot** (jamais GRUB) | 4 |
| [0003](/grimoire-arch/adr/0003-swap-zram/) | Swap : **zram** (pas de swap disque) | 1 / 4 |
| [0004](/grimoire-arch/adr/0004-snapshots-timeshift-btrfs/) | Snapshots : **Timeshift mode BTRFS** + autosnap + hook *Install/Remove* | 3 |
| [0005](/grimoire-arch/adr/0005-esp-sur-boot-mkinitcpio-vanilla/) | Boot : **ESP-on-`/boot`** + **mkinitcpio vanilla** | 4 |
| [0006](/grimoire-arch/adr/0006-runtime-js-bun/) | Runtime JS : **bun** (npm = béquille Mason seulement) | 9 / 12 |
| [0007](/grimoire-arch/adr/0007-outils-terminal-hd3000/) | Édition : **outils terminal** sur GPU ancien | 9 / annexe A |
| [0008](/grimoire-arch/adr/0008-vpn-wireguard-wg-quick/) | VPN : **WireGuard wg-quick** + killswitch (pas NM) | 7 |
| [0009](/grimoire-arch/adr/0009-lock-suspend-xss-lock/) | Lock/suspend : **xss-lock** + script commun (logind) | 6 |
| [0010](/grimoire-arch/adr/0010-hotkeys-sxhkd-daemon-unique/) | Hotkeys : **sxhkd** daemon unique, split par WM | 10 / 11 |
| [0011](/grimoire-arch/adr/0011-shell-env-modulaire-xdg/) | Shell/env : **modulaire XDG** (`~/.config/{bash,env}/NN-*`) | 8 |
| [0012](/grimoire-arch/adr/0012-theme-switcher-bspwm/) | Theme switcher bspwm : **manifeste + script** multi-thèmes dark | 11 |
| [0013](/grimoire-arch/adr/0013-organisation-scripts-par-portee/) | Scripts : **par portée** (`~/.config/scripts/` + `bspwm/scripts/`) | 11 / 10 |
| [0014](/grimoire-arch/adr/0014-theme-dark-modele-b-sans-gtk-theme/) | Thème dark : **Modèle B** (jamais `GTK_THEME` global ; `settings.ini` par famille + `color-scheme` + kvantum) | 11 |
| [0015](/grimoire-arch/adr/0015-reload-bspwm-sur/) | Reload bspwm : **valider avant d'appliquer** + config-only par défaut + dex idempotent | 11 |
| [0016](/grimoire-arch/adr/0016-compositeur-picom-glx/) | Compositeur : **picom backend `glx`** sur HD 3000 (renverse « écarté a priori ») | 11 |
| [0017](/grimoire-arch/adr/0017-bspwm-tabs-tabbing-externe/) | Onglets bspwm : **tabbing externe** (`tabbed`/bspwm-tabs, JAGL) | 11 |

Les ADR à rationale **faible** (choix de légèreté ou contrainte de départ sans justification technique
forte — Ly, zram) sont signalés comme tels dans leur fichier : on les **assume**, on n'invente pas de
justification rétrospective.
