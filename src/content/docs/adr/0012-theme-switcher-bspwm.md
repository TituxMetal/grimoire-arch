---
title: "ADR 0012 — Theme switcher bspwm : manifeste + script multi-thèmes dark"
---

- Statut : accepté
- Chapitre lié : 11

## Contexte

La session bspwm avait des couleurs Arc Dark codées en dur dans `bspwmrc` et `polybar/config.ini`. Aucun
moyen de changer de thème sans éditer plusieurs fichiers à la main. L'objectif : basculer entre plusieurs
thèmes dark en une commande, sans redémarrer la session.

La référence est le dépôt **JustAGuyLinux bspwm-setup** (clone local : `~/GIT/bspwm-setup`), notamment
sa structure `themes/`, ses manifestes `theme.conf` et son script `thememenu`. L'adaptation est
nécessaire : JAGL stocke les configs polybar/rofi/dunst dans ses propres sous-dossiers (self-contained) ;
ici, les configs vivent dans les dossiers XDG standards.

## Décision

Chaque thème est un répertoire `~/.config/bspwm/themes/<nom>/` contenant un **manifeste** `theme.conf`
(`name`, `gtk`, `icons`, `rofi`, `dunst_*`) et des fichiers de couleurs `colors.ini`, `colors.sh`.
Lors d'un switch, le script `thememenu` copie ces fichiers vers les emplacements actifs :
`~/.config/polybar/colors.ini`, `~/.config/bspwm/colors.sh`, puis recharge polybar et bspwm bordures.

**Portée du switcher :**

| Composant | Mécanisme | Dans le switch |
|-----------|-----------|----------------|
| Polybar (couleurs) | `colors.ini` inclus dans `config.ini` + `pkill polybar` | ✓ |
| Bordures bspwm | `colors.sh` sourcé dans `bspwmrc` + `bspc config *_border_color` | ✓ |
| Dunst | `sed` sur les marqueurs `# THEME: dunst_*` dans `dunstrc` + `pkill dunst` (dbus respawn) | ✓ |
| Rofi | Thème officiel (`@theme` dans `config.rasi`) depuis la clé `rofi` du manifeste | ✓ |
| Alacritty | Couleurs du terminal inchangées (hors switcher) | ✗ (hors scope) |
| Wallpaper | Fond X par défaut | ✗ (rejeté — ni photo ni couleur unie ne convenaient) |

**9 thèmes dark retenus** (après tri à l'usage) : arc-dark, catppuccin, dracula, everforest, github-dark,
gruvbox, kanagawa, monokai, rose-pine. Bind : `super + shift + t`.

## Conséquences

- `~/.cache/bspwm/current_theme` stocke le thème actif.
- `thememenu --current` / `--list` sont des actions lecture seule (style titux).
- Les thèmes rofi restent leurs palettes officielles (pas d'injection d'accent) : on harmonise polybar ↔
  bordures ↔ dunst, pas rofi à la couleur exacte du thème.
- Alacritty et les apps GTK ne sont pas pilotés : GTK suit `~/.config/gtk-*/settings.ini` (clé `gtk` du
  manifeste applicable via `sed` ou outil GTK, au prochain lancement des apps).
- Multi-moniteur à venir : `thememenu` ne hardcode pas de moniteur, compatible dualscreen.

## Alternatives considérées

- **Couleur unique figée (Arc Dark)** : simple mais rigide ; impossible de tester de nouveaux thèmes sans
  éditer à la main — écarté.
- **pywal** : génère des palettes depuis le wallpaper ; trop automatique et aléatoire pour un résultat
  dark/cohérent garanti — écarté.
- **Injection directe de l'accent dans rofi** : testé (colorer `selected-normal-background` etc. via sed
  dans `config.rasi`) ; résultat incohérent selon les thèmes rofi — écarté au profit des thèmes officiels.
- **xsettingsd pour GTK live** : apporterait le rechargement GTK à chaud ; complexité ajoutée pour un
  gain faible (les apps GTK sont relancées naturellement) — non implémenté.
