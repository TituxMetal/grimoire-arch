---
title: "ADR 0013 — Organisation des scripts par portée"
---

- Statut : accepté
- Chapitre lié : 11 / 10

## Contexte

Tous les scripts personnels (`gpgctl`, `vpn`, `lock`, `pinentry-auto`, `powermenu`) étaient dans `~/bin`
sans distinction de portée : scripts autostartés au démarrage côtoyaient des scripts spécifiques à un
WM ou des commandes interactives manuelles. Le résultat était une accumulation opaque, difficile à
maintenir et à porter.

## Décision

Trois périmètres stricts, avec `~/bin` vidé :

| Dossier | Portée | Exemples |
|---------|--------|---------|
| `~/.config/scripts/` | Commun à tous les WM — autostartés ou appelés manuellement | `gpgctl`, `vpn`, `lock`, `pinentry-auto` |
| `~/.config/bspwm/scripts/` | Spécifique bspwm — jamais appelé hors de bspwm | `powermenu`, `thememenu`, `help`, `scratchpad` |
| `~/.config/i3/scripts/` (etc.) | Spécifique au WM concerné | (schéma identique pour i3 si besoin) |

`~/.config/scripts/` est ajouté au **PATH** dans `~/.config/env/00-core.sh` (décision issue du
brainstorm : PATH plutôt qu'alias, car les scripts sont aussi appelés par les autostart `.desktop`).

Toutes les références ont été remises à jour :
- `~/.config/autostart/xss-lock.desktop` → `~/.config/scripts/lock`
- `~/.config/autostart/vpn-up.desktop` → `~/.config/scripts/vpn --up`
- `~/.gnupg/gpg-agent.conf` (`pinentry-program`) → `~/.config/scripts/pinentry-auto`
- `~/.config/xfce4/xfce4-session.xml` (`LockCommand`) → `~/.config/scripts/lock`
- `~/.config/xfce4/panel/launcher-19/…desktop` → `~/.config/scripts/vpn --toggle`
- `~/.config/sxhkd/sxhkdrc-bspwm` (binds power menu, help, thememenu) → `~/.config/bspwm/scripts/`

## Conséquences

- `~/bin` est vide — ne plus y placer de scripts personnels.
- Les trois WM (i3, XFCE, bspwm) fonctionnent avec le même autostart XDG (`lock`, `vpn`, GPG).
- `vpn --status/--down/--toggle` reste appelable interactivement (PATH).
- Ajouter un script commun = le placer dans `~/.config/scripts/` ; aucune entrée `.desktop` ou alias à
  créer pour qu'il soit utilisable en CLI.

## Alternatives considérées

- **Garder `~/bin`** : `~/bin` existe et est dans le PATH par convention — mais il ne distingue pas
  script manuel et autostart, et son contenu est opaque au rechargement des WM — écarté.
- **Symlinks depuis `~/bin`** : double l'indirection sans résoudre la question de la portée — écarté.
- **Aliases shell** : ne fonctionnent pas dans les autostart `.desktop` ni dans les scripts non-interactifs
  — écarté au profit du PATH (décision 1.4 du plan).
