---
title: "ADR 0017 — Onglets bspwm : tabbing externe (bspwm-tabs / tabbed)"
---

- Statut : accepté
- Chapitre lié : 11
- Lié à : ADR 0010 (sxhkd daemon unique), ADR 0012 (référence JAGL)

## Contexte

bspwm est du tiling **pur** : pas de conteneurs *stacked/tabbed* comme i3. Pour retrouver le confort des
onglets (empiler plusieurs fenêtres dans un même cadre, naviguer entre elles), il faut un mécanisme
externe. La référence est le dépôt **JustAGuyLinux bspwm-setup** (cloné à `~/GIT/bspwm-setup`), qui
fournit `bspwm-tabs` — un wrapper autour de **`tabbed`** (suckless), compilé depuis un `config.h`.

Cette piste avait d'abord été notée « reportée / non implémentée ». À l'usage, elle a été **adoptée** et
câblée.

## Décision

Adopter **`tabbed` via bspwm-tabs**, compilé depuis `~/.config/bspwm/tabbed/config.h` :

- **Attach / detach** : `super + ctrl + a` / `super + ctrl + d`.
- **Navigation dans un groupe** : `alt + Tab` (suivant), `alt + {symboles fr-mac}` (onglet N),
  `alt + grave` (menu), `alt + q` (fermer l'onglet) — binds compilés dans `config.h`.

Outil **léger**, dans l'esprit suckless (config par recompilation), cohérent avec le poste terminal.

## Conséquences

- Le confort « onglets » est disponible sous bspwm sans introduire un WM à conteneurs.
- Les binds onglets vivent dans `config.h` (recompilation), pas dans sxhkd — distinction à garder en tête
  quand on documente les raccourcis.
- Dépendance à un dépôt de référence cloné : ne pas confondre **dépôt-référence** (lecture) et
  **fonctionnalité câblée** (adoptée ici). La doctrine « ne pas confondre clone et feature » (ADR 0012)
  reste valable pour les *autres* features de JAGL non reprises.

## Alternatives considérées

- **monocle bspwm** : empile les fenêtres mais sans barre d'onglets ni navigation nommée — complément, pas
  substitut.
- **Ne rien faire** (position « reportée ») : prive du confort onglets sans raison forte une fois l'outil
  validé — écarté.
- **WM à conteneurs (i3)** : contredit le choix bspwm tiling pur (ADR 0010) — hors sujet.

Détail : `docs/guide/11-wm-bspwm-polybar.md` § Écarts tiling + § Bindings ; référence JAGL
<https://codeberg.org/justaguylinux/bspwm-setup>.
